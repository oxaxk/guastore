import test from 'node:test';
import assert from 'node:assert/strict';
import { issueResumeToken, verifyResumeToken, resumeTestCheckout } from './checkout-resume.mjs';

const secret = 'test-only-secret-at-least-thirty-two-bytes';
const now = 1793630000;
test('resume token is random, purpose-bound, short-lived and tamper resistant', () => {
  const first = issueResumeToken('r1', 'cs_test_one', secret, now);
  const second = issueResumeToken('r1', 'cs_test_one', secret, now);
  assert.notEqual(first, second);
  assert.deepEqual(verifyResumeToken(first, secret, now), { reservationId: 'r1', sessionId: 'cs_test_one' });
  assert.throws(() => verifyResumeToken(first, secret, now + 901));
  assert.throws(() => verifyResumeToken(first.slice(0, -1) + (first.endsWith('A') ? 'B' : 'A'), secret, now));
  assert.throws(() => verifyResumeToken(first, 'wrong-secret-but-long-enough-to-pass-check', now));
  const [body, sig] = first.split('.');
  const data = JSON.parse(Buffer.from(body, 'base64url').toString());
  data.p = 'other-purpose';
  assert.throws(() => verifyResumeToken(`${Buffer.from(JSON.stringify(data)).toString('base64url')}.${sig}`, secret, now));
});

test('resume only reads the bound open session; never creates or reserves', async () => {
  const token = issueResumeToken('r1', 'cs_test_one', secret, now);
  let lookups = 0;
  const store = { async getReservation(id) { assert.equal(id, 'r1'); return { status: 'reserved', stripeSessionId: 'cs_test_one' }; } };
  const retrieveSession = async id => { lookups++; return { id, status: 'open', url: 'https://checkout.stripe.com/c/pay/cs_test_one' }; };
  assert.equal((await resumeTestCheckout(token, { secret, store, retrieveSession, nowSeconds: now })).id, 'cs_test_one');
  assert.equal(lookups, 1);
  await assert.rejects(() => resumeTestCheckout(token, { secret, store: { getReservation: async () => ({ status: 'released', stripeSessionId: 'cs_test_one' }) }, retrieveSession, nowSeconds: now }));
  await assert.rejects(() => resumeTestCheckout(token, { secret, store: { getReservation: async () => ({ status: 'reserved', stripeSessionId: 'cs_test_foreign' }) }, retrieveSession, nowSeconds: now }));
  assert.equal(lookups, 1);
});
