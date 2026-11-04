import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyStripeEvent(rawBody, signature, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!Buffer.isBuffer(rawBody) || rawBody.length > 262144 || rawBody.length === 0 ||
      typeof signature !== 'string' || !secret?.startsWith('whsec_')) throw new Error('INVALID_WEBHOOK');
  const fields = signature.split(',').map(part => part.trim().split('='));
  const timestamps = fields.filter(([key]) => key === 't').map(([, value]) => value);
  const signatures = fields.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (timestamps.length !== 1 || !/^\d+$/.test(timestamps[0]) ||
      signatures.length === 0 || signatures.length > 20) throw new Error('INVALID_SIGNATURE');
  const timestamp = Number(timestamps[0]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) throw new Error('INVALID_SIGNATURE');
  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest();
  const matching = signatures.some(value => /^[a-f0-9]{64}$/i.test(value) &&
    timingSafeEqual(expected, Buffer.from(value, 'hex')));
  if (!matching) throw new Error('INVALID_SIGNATURE');
  const event = JSON.parse(rawBody.toString('utf8'));
  if (!event || typeof event !== 'object' || typeof event.id !== 'string' || !event.id.startsWith('evt_')) throw new Error('INVALID_EVENT');
  return event;
}

export async function handleTestWebhook(rawBody, signature, { secret, accountId, store, nowSeconds, livemode = false }) {
  if (!accountId?.startsWith('acct_') || !store) return { status: 503, code: 'WEBHOOK_NOT_CONFIGURED' };
  let event;
  try { event = verifyStripeEvent(rawBody, signature, secret, nowSeconds); }
  catch { return { status: 400, code: 'INVALID_SIGNATURE_OR_PAYLOAD' }; }
  if (event.livemode !== livemode || (event.account && event.account !== accountId)) return { status: 400, code: 'WRONG_ACCOUNT_OR_MODE' };
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired'].includes(event.type)) return { status: 200, code: 'IGNORED_EVENT' };
  const session = event.data?.object;
  const reservationId = session?.metadata?.reservation_id;
  const sessionPrefix = livemode ? 'cs_live_' : 'cs_test_';
  if (typeof session?.id !== 'string' || !session.id.startsWith(sessionPrefix) ||
      typeof reservationId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(reservationId)) return { status: 400, code: 'INVALID_SESSION' };
  try {
    const reservation = await store.getReservation(reservationId);
    if (!reservation || reservation.stripeSessionId !== session.id || reservation.currency !== session.currency ||
        reservation.totalCents !== session.amount_total || session.mode !== 'payment') return { status: 400, code: 'ORDER_MISMATCH' };
    if (event.type === 'checkout.session.expired') {
      if (session.status !== 'expired' || session.payment_status === 'paid') return { status: 400, code: 'NOT_EXPIRED' };
      if (reservation.status === 'paid' || reservation.status === 'payment_review') return { status: 200, code: 'NO_RELEASE' };
      await store.releaseAfterVerifiedExpiry(reservationId, session.id);
    } else {
      if (session.payment_status !== 'paid') return { status: 400, code: 'NOT_PAID' };
      const outcome = await store.markPaid(reservationId, session.id, session.customer_details?.email || session.customer_email || null);
      if (outcome === 'manual_review') return { status: 200, code: 'MANUAL_REVIEW' };
    }
    return { status: 200, code: 'PROCESSED' };
  } catch {
    // Storage failures must be retried by Stripe; no 2xx acknowledgement.
    return { status: 503, code: 'STORAGE_RETRY' };
  }
}
