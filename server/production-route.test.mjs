import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { receiveCheckout } from '../api/checkout.mjs';
import { receiveStripeWebhook } from '../api/stripe-webhook.mjs';

const origin = 'https://shop.example';
const base = {
  GUA_ORIGIN: origin,
  GUA_MONGO_URI: 'mongodb://isolated',
  GUA_STRIPE_ACCOUNT_ID: 'acct_livefixture',
  GUA_COOKIE_SECRET: 'c'.repeat(48),
};
const cartRequest = () => new Request(`${origin}/api/checkout`, {
  method: 'POST',
  headers: { origin, 'content-type': 'application/json' },
  body: JSON.stringify({ items: [{ sku: 'the-steel', quantity: 1 }] }),
});

test('single checkout route enables test only in preview and live only in production', async () => {
  const store = { consumeCheckoutRate: async () => true };
  const openStore = async () => store;
  const preview = { ...base, GUA_MODE: 'test', VERCEL_ENV: 'preview', GUA_STRIPE_KEY: 'rk_test_fixture' };
  assert.equal((await receiveCheckout(cartRequest(), { env: preview, openStore })).status, 202);
  assert.equal((await receiveCheckout(cartRequest(), { env: { ...preview, VERCEL_ENV: 'production' }, openStore })).status, 503);
  const live = { ...base, GUA_MODE: 'live', VERCEL_ENV: 'production', GUA_STRIPE_KEY: 'rk_live_fixture' };
  assert.equal((await receiveCheckout(cartRequest(), { env: live, openStore })).status, 202);
  assert.equal((await receiveCheckout(cartRequest(), { env: { ...live, VERCEL_ENV: 'preview' }, openStore })).status, 503);
});

test('production webhook accepts signed live events and rejects test events', async () => {
  const secret = 'whsec_fixture';
  const env = { ...base, GUA_MODE: 'live', VERCEL_ENV: 'production', GUA_STRIPE_WEBHOOK_SECRET: secret };
  let paid = 0;
  const store = {
    getReservation: async () => ({ stripeSessionId: 'cs_live_order', totalCents: 1290, currency: 'eur', status: 'reserved' }),
    markPaid: async () => { paid++; },
  };
  const makeRequest = (livemode) => {
    const body = JSON.stringify({ id: 'evt_live', livemode, account: 'acct_livefixture', type: 'checkout.session.completed', data: { object: { id: 'cs_live_order', metadata: { reservation_id: 'r1' }, currency: 'eur', amount_total: 1290, mode: 'payment', payment_status: 'paid' } } });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
    return new Request(`${origin}/api/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, body });
  };
  const deps = { env, openStore: async () => store, createTransport: async () => ({ configured: false }) };
  assert.equal((await receiveStripeWebhook(makeRequest(false), deps)).status, 400);
  assert.equal((await receiveStripeWebhook(makeRequest(true), deps)).status, 200);
  assert.equal(paid, 1);
});
