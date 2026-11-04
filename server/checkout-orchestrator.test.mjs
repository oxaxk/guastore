import test from 'node:test';
import assert from 'node:assert/strict';
import { startTestCheckout } from './checkout-orchestrator.mjs';

function fakeStore() {
  const stock = { 'the-steel': 21, 'the-jade': 80 };
  const reservations = new Map();
  return {
    stock, reservations,
    async available() { return { ...stock }; },
    async getReservation(id) { return reservations.get(id) || null; },
    async reserve(id, cart) {
      const existing = reservations.get(id);
      if (existing) {
        if (existing.cartHash !== JSON.stringify(cart.items)) throw new Error('RESERVATION_CONFLICT');
        return existing;
      }
      for (const item of cart.items) {
        if (stock[item.sku] < item.quantity) throw new Error('OUT_OF_STOCK');
        stock[item.sku] -= item.quantity;
      }
      const value = { status: 'reserved', items: cart.items.map(({ sku, quantity }) => ({ sku, quantity })), cartHash: JSON.stringify(cart.items), stripeSessionId: null };
      reservations.set(id, value);
      return value;
    },
    async attachSession(id, sessionId) { reservations.get(id).stripeSessionId = sessionId; },
  };
}

test('uncertain Stripe timeout keeps reservation; retry uses same ID without second stock decrement', async () => {
  const store = fakeStore();
  const body = { items: [{ sku: 'the-steel', quantity: 21 }] };
  const keys = [];
  const options = { store, reservationId: 'same-request', origin: 'https://guasha-shop.de', secretKey: 'sk_test_dummy',
    fetchImpl: async (_url, request) => {
      keys.push(request.headers['Idempotency-Key']);
      if (keys.length === 1) throw new Error('NETWORK_TIMEOUT');
      return Response.json({ id: 'cs_test_same', url: 'https://checkout.stripe.com/c/pay/cs_test_same' });
    },
  };
  await assert.rejects(() => startTestCheckout(body, options), /STRIPE_POST_FAILED/);
  assert.equal(store.stock['the-steel'], 0);
  const result = await startTestCheckout(body, options);
  assert.equal(result.id, 'cs_test_same');
  assert.equal(store.stock['the-steel'], 0);
  assert.deepEqual(keys, ['gua-checkout-same-request', 'gua-checkout-same-request']);
  await assert.rejects(() => startTestCheckout(body, options), /SESSION_ALREADY_CREATED/);
  await assert.rejects(() => startTestCheckout({ items: [{ sku: 'the-steel', quantity: 1 }] }, options), /RESERVATION_CONFLICT/);
  store.reservations.get('same-request').status = 'released';
  await assert.rejects(() => startTestCheckout(body, options), /RESERVATION_TERMINAL/);
});
