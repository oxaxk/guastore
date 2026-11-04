import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const PURPOSE = 'gua-shop-checkout-resume-v1';
function mac(payload, secret) { return createHmac('sha256', secret).update(payload).digest(); }

export function issueResumeToken(reservationId, sessionId, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(reservationId) || !/^cs_test_[a-zA-Z0-9_]+$/.test(sessionId) ||
      typeof secret !== 'string' || secret.length < 32) throw new Error('RESUME_NOT_CONFIGURED');
  const body = Buffer.from(JSON.stringify({ p: PURPOSE, r: reservationId, s: sessionId,
    e: nowSeconds + 900, n: randomBytes(16).toString('base64url') })).toString('base64url');
  return `${body}.${mac(body, secret).toString('base64url')}`;
}

export function verifyResumeToken(token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string' || token.length > 1024 || typeof secret !== 'string' || secret.length < 32) throw new Error('INVALID_RESUME_TOKEN');
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) throw new Error('INVALID_RESUME_TOKEN');
  const signature = Buffer.from(parts[1], 'base64url');
  const expected = mac(parts[0], secret);
  if (signature.toString('base64url') !== parts[1] || signature.length !== expected.length || !timingSafeEqual(signature, expected)) throw new Error('INVALID_RESUME_TOKEN');
  const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  if (data.p !== PURPOSE || !/^[a-zA-Z0-9_-]{1,100}$/.test(data.r || '') ||
      !/^cs_test_[a-zA-Z0-9_]+$/.test(data.s || '') || !Number.isSafeInteger(data.e) ||
      data.e < nowSeconds || data.e > nowSeconds + 900 || !/^[A-Za-z0-9_-]{20,30}$/.test(data.n || '')) throw new Error('INVALID_RESUME_TOKEN');
  return { reservationId: data.r, sessionId: data.s };
}

export async function resumeTestCheckout(token, { secret, store, retrieveSession, nowSeconds }) {
  const { reservationId, sessionId } = verifyResumeToken(token, secret, nowSeconds);
  const reservation = await store.getReservation(reservationId);
  if (reservation?.status !== 'reserved' || reservation.stripeSessionId !== sessionId) throw new Error('RESUME_DENIED');
  const session = await retrieveSession(sessionId);
  if (session?.id !== sessionId || session.status !== 'open' ||
      !session.url?.startsWith('https://checkout.stripe.com/')) throw new Error('SESSION_NOT_OPEN');
  return { id: sessionId, url: session.url };
}
