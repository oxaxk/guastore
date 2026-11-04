import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { receiveTestWebhook } from '../api/stripe-test-webhook.mjs';

const env = { GUA_TEST_MODE: 'enabled', VERCEL_ENV: 'preview', GUA_TEST_MONGO_URI: 'mongodb://unused', GUA_TEST_STRIPE_WEBHOOK_SECRET: 'whsec_dummy', GUA_TEST_STRIPE_ACCOUNT_ID: 'acct_test' };
function request(payload, valid = true) {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', env.GUA_TEST_STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest('hex');
  return new Request('https://example.test/api/stripe-test-webhook', { method: 'POST', headers: { 'stripe-signature': `t=${timestamp},v1=${valid ? signature : '0'.repeat(64)}` }, body });
}
const event = { id: 'evt_test', livemode: false, account: 'acct_test', type: 'checkout.session.completed', data: { object: { id: 'cs_test_order', metadata: { reservation_id: 'r1' }, currency: 'eur', amount_total: 1189, mode: 'payment', payment_status: 'paid' } } };
test('test webhook is disabled in production and rejects unsigned input before opening storage', async () => {
  let opened = 0;
  const openStore = async () => { opened++; throw new Error('unexpected'); };
  assert.equal((await receiveTestWebhook(request(event), { env: { ...env, VERCEL_ENV: 'production' }, openStore })).status, 503);
  assert.equal((await receiveTestWebhook(request(event, false), { env, openStore })).status, 400);
  assert.equal((await receiveTestWebhook(request({ ...event, livemode: true }), { env, openStore })).status, 400);
  assert.equal(opened, 0);
});
test('valid signed test event is passed to storage and repeated delivery remains idempotent', async () => {
  let status = 'reserved', writes = 0;
  const store = { getReservation: async () => ({ stripeSessionId: 'cs_test_order', totalCents: 1189, currency: 'eur', status }), markPaid: async () => { if (status === 'reserved') { status = 'paid'; writes++; } } };
  const openStore = async () => store;
  assert.equal((await receiveTestWebhook(request(event), { env, openStore })).status, 200);
  assert.equal((await receiveTestWebhook(request(event), { env, openStore })).status, 200);
  assert.equal(writes, 1);
});
