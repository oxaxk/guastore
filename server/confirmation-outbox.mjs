import { randomUUID } from 'node:crypto';
import { renderOrderConfirmation } from './order-confirmation.mjs';

// A configured transport is server-owned and must report `not_sent` ONLY when it
// can prove the provider never accepted the message. An exception is unknown.
export async function processNextConfirmation({ store, transport, now = () => new Date(), leaseMs = 120000 } = {}) {
  if (!store || typeof store.claimMail !== 'function' || typeof store.settleMail !== 'function' ||
      !transport || transport.configured !== true || typeof transport.send !== 'function' ||
      !Number.isSafeInteger(leaseMs) || leaseMs < 30000 || leaseMs > 900000) return { status: 'unavailable' };
  const claimId = randomUUID();
  const startedAt = now();
  const job = await store.claimMail(claimId, startedAt, new Date(startedAt.getTime() + leaseMs));
  if (!job) return { status: 'empty' };
  let message;
  try {
    if (typeof job.recipient !== 'string' || !job.recipient) throw new Error('MISSING_RECIPIENT');
    message = renderOrderConfirmation(job.order);
  } catch {
    const updated = await store.settleMail(job._id, claimId, 'blocked', now());
    return { status: updated ? 'blocked' : 'claim_lost' };
  }
  let result;
  try { result = await transport.send({ to: job.recipient, ...message, idempotencyKey: `order-confirmation-${job._id}` }); }
  catch { result = { status: 'unknown' }; }
  let nextStatus = 'unknown';
  let nextAttemptAt;
  if (result?.status === 'sent') nextStatus = 'sent';
  else if (result?.status === 'not_sent' && result.confirmedNotAccepted === true) {
    nextStatus = job.attempts >= 5 ? 'blocked' : 'pending';
    nextAttemptAt = new Date(now().getTime() + Math.min(3600000, 60000 * 2 ** Math.max(0, job.attempts - 1)));
  }
  const updated = await store.settleMail(job._id, claimId, nextStatus, now(), nextAttemptAt);
  return { status: updated ? nextStatus : 'claim_lost' };
}
