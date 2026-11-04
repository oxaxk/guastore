import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCheckoutCart } from './checkout-policy.mjs';
import { checkoutSessionParams, createTestCheckoutSession } from './stripe-test-adapter.mjs';
const STOCK = { 'the-steel': 21, 'the-jade': 80 };

test('one stone carries 1.99 EUR shipping; two mixed stones ship free', () => {
  assert.equal(validateCheckoutCart({ items: [{ sku: 'the-jade', quantity: 1 }] }, STOCK).totalCents, 1189);
  const mixed = validateCheckoutCart({ items: [{ sku: 'the-steel', quantity: 1 }, { sku: 'the-jade', quantity: 1 }] }, STOCK);
  assert.deepEqual([mixed.subtotalCents, mixed.shippingCents, mixed.totalCents], [2280, 0, 2280]);
  const params = checkoutSessionParams(mixed, 'https://guasha-shop.de');
  assert.equal(params.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '0');
  assert.equal(params.get('shipping_address_collection[allowed_countries][0]'), 'DE');
});

test('sold-out SKU, overstock, duplicate lines and client price are rejected', () => {
  for (const cart of [
    { items: [{ sku: 'the-rose', quantity: 1 }] },
    { items: [{ sku: 'the-steel', quantity: 22 }] },
    { items: [{ sku: 'the-jade', quantity: 1, price: 0 }] },
    { items: [{ sku: 'the-jade', quantity: 1 }, { sku: 'the-jade', quantity: 1 }] },
    { items: [{ sku: 'the-jade', quantity: 1 }], total: 0 },
  ]) assert.throws(() => validateCheckoutCart(cart, STOCK));
  assert.equal(validateCheckoutCart({ items: [{ sku: 'the-steel', quantity: 21 }] }, STOCK).totalCents, 27090);
  assert.equal(validateCheckoutCart({ items: [{ sku: 'the-jade', quantity: 80 }] }, STOCK).totalCents, 79200);
  assert.throws(() => validateCheckoutCart({ items: [{ sku: 'the-steel', quantity: 1 }] }), /STOCK_UNAVAILABLE/);
  assert.throws(() => validateCheckoutCart({ items: [{ sku: 'the-steel', quantity: 2 }] }, { 'the-steel': 1 }), /OUT_OF_STOCK/);
});

test('adapter supports isolated test/live modes and only sends server-derived prices', async () => {
  const cart = validateCheckoutCart({ items: [{ sku: 'the-steel', quantity: 1 }] }, STOCK);
  let posted;
  const session = await createTestCheckoutSession(cart, {
    secretKey: 'rk_test_dummy', origin: 'https://guasha-shop.de', reservationId: 'r1',
    fetchImpl: async (_url, request) => { posted = request; return Response.json({ id: 'cs_test_dummy', url: 'https://checkout.stripe.com/c/pay/cs_test_dummy' }); },
  });
  assert.equal(session.id, 'cs_test_dummy');
  assert.equal(posted.body.get('line_items[0][price_data][unit_amount]'), '1290');
  assert.equal(posted.body.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '199');
  assert.equal(posted.headers['Idempotency-Key'], 'gua-checkout-r1');
  const live = await createTestCheckoutSession(cart, {
    secretKey: 'rk_live_dummy', origin: 'https://guasha-shop.de', reservationId: 'live-r1',
    fetchImpl: async () => Response.json({ id: 'cs_live_dummy', url: 'https://checkout.stripe.com/c/pay/cs_live_dummy' }),
  });
  assert.equal(live.id, 'cs_live_dummy');
});

test('retry after uncertain transport failure keeps the same Stripe idempotency key', async () => {
  const cart = validateCheckoutCart({ items: [{ sku: 'the-jade', quantity: 1 }] }, STOCK);
  const keys = [];
  const options = { secretKey: 'sk_test_dummy', origin: 'https://guasha-shop.de', reservationId: 'stable-123',
    fetchImpl: async (_url, request) => {
      keys.push(request.headers['Idempotency-Key']);
      if (keys.length === 1) throw new Error('NETWORK_TIMEOUT');
      return Response.json({ id: 'cs_test_stable', url: 'https://checkout.stripe.com/c/pay/cs_test_stable' });
    },
  };
  await assert.rejects(() => createTestCheckoutSession(cart, options), /STRIPE_POST_FAILED/);
  await createTestCheckoutSession(cart, options);
  assert.deepEqual(keys, ['gua-checkout-stable-123', 'gua-checkout-stable-123']);
});
