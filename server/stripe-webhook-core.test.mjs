import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handleTestWebhook } from './stripe-webhook-core.mjs';
import { verifyStripeEvent } from './stripe-webhook-core.mjs';

const secret = 'whsec_test_dummy';
const accountId = 'acct_1UXMjTK4IqjIy5fU';
const nowSeconds = 1793630000;
function signed(event, timestamp = nowSeconds) {
  const body = Buffer.from(JSON.stringify(event));
  const digest = createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest('hex');
  return [body, `t=${timestamp},v1=${digest}`];
}
function event(type = 'checkout.session.completed', overrides = {}) {
  return { id: 'evt_test', livemode: false, account: accountId, type, data: { object: {
    id: 'cs_test_order', metadata: { reservation_id: 'r1' }, amount_total: 798, currency: 'eur', mode: 'payment',
    payment_status: 'paid', status: 'complete', ...overrides,
  } } };
}
function store() {
  let status = 'reserved', writes = 0;
  return { get writes() { return writes; },
    async getReservation() { return { stripeSessionId: 'cs_test_order', totalCents: 798, currency: 'eur', status }; },
    async markPaid() { if (status === 'paid') return false; if (status !== 'reserved') throw new Error('STATE'); status = 'paid'; writes++; return true; },
    async releaseAfterVerifiedExpiry() { if (status === 'released') return false; if (status !== 'reserved') throw new Error('STATE'); status = 'released'; writes++; return true; },
  };
}
async function handle(evt, db = store(), timestamp = nowSeconds) {
  const [body, signature] = signed(evt, timestamp);
  return handleTestWebhook(body, signature, { secret, accountId, store: db, nowSeconds });
}

test('signature, timestamp, account, mode, payment and amount gates', async () => {
  const db = store();
  const [body, signature] = signed(event());
  assert.equal((await handleTestWebhook(body, signature.replace(/.$/, '0'), { secret, accountId, store: db, nowSeconds })).status, 400);
  assert.equal((await handle(event(), db, nowSeconds - 301)).status, 400);
  assert.equal((await handle({ ...event(), account: 'acct_other' }, db)).status, 400);
  assert.equal((await handle({ ...event(), livemode: true }, db)).status, 400);
  assert.equal((await handle(event('checkout.session.completed', { payment_status: 'unpaid' }), db)).status, 400);
  assert.equal((await handle(event('checkout.session.completed', { amount_total: 1 }), db)).status, 400);
  assert.equal(db.writes, 0);
});

test('duplicate paid is idempotent; expired/paid race never releases sold stock', async () => {
  const db = store();
  assert.equal((await handle(event(), db)).status, 200);
  assert.equal((await handle(event(), db)).status, 200);
  assert.equal(db.writes, 1);
  assert.deepEqual(await handle(event('checkout.session.expired', { status: 'expired', payment_status: 'unpaid' }), db), { status: 200, code: 'NO_RELEASE' });
  assert.equal(db.writes, 1);
});

test('storage failure produces retry status; self-signed fixture is not a Stripe delivery', async () => {
  const db = store();
  db.markPaid = async () => { throw new Error('DATABASE_DOWN'); };
  assert.deepEqual(await handle(event(), db), { status: 503, code: 'STORAGE_RETRY' });
});

test('only a verified paid session passes its customer email to paid-order persistence', async () => {
  let received;
  const db = store();
  db.markPaid = async (_reservation, _session, email) => { received = email; };
  assert.equal((await handle(event('checkout.session.completed', { customer_details: { email: 'buyer@example.invalid' } }), db)).status, 200);
  assert.equal(received, 'buyer@example.invalid');
  received = undefined;
  assert.equal((await handle(event('checkout.session.completed', { payment_status: 'unpaid', customer_details: { email: 'buyer@example.invalid' } }), db)).status, 400);
  assert.equal(received, undefined);
});

test('duplicate verified expiry releases stock once', async () => {
  const db = store();
  const expired = event('checkout.session.expired', { status: 'expired', payment_status: 'unpaid' });
  assert.equal((await handle(expired, db)).status, 200);
  assert.equal((await handle(expired, db)).status, 200);
  assert.equal(db.writes, 1);
});

test('rotated signatures accept any valid v1 and reject timestamp ambiguity or changed bytes', () => {
  const [body, signature] = signed(event());
  const valid = signature.split('v1=')[1];
  const wrong = '0'.repeat(64);
  assert.equal(verifyStripeEvent(body, `t=${nowSeconds},v1=${valid},v1=${wrong}`, secret, nowSeconds).id, 'evt_test');
  assert.equal(verifyStripeEvent(body, `t=${nowSeconds},v1=${wrong},v1=${valid}`, secret, nowSeconds).id, 'evt_test');
  assert.throws(() => verifyStripeEvent(body, `t=${nowSeconds},v1=${wrong}`, secret, nowSeconds));
  assert.throws(() => verifyStripeEvent(body, `v1=${valid}`, secret, nowSeconds));
  assert.throws(() => verifyStripeEvent(body, `t=${nowSeconds},t=${nowSeconds},v1=${valid}`, secret, nowSeconds));
  assert.throws(() => verifyStripeEvent(Buffer.from(body.toString() + ' '), signature, secret, nowSeconds));
});
