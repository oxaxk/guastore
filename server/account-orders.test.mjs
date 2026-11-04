import test from 'node:test';
import assert from 'node:assert/strict';
import { listCustomerOrders } from './account-orders.mjs';

const request = { headers: { cookie: 'opaque-session' } };
const now = () => 1000;
const auth = { authenticate: async () => ({ subject: 'customer-a', verified: true, expiresAt: 2000 }) };
test('missing provider, invalid, expired and logged out sessions fail closed', async () => {
  let calls = 0;
  const orders = { findByOwner: async () => { calls++; return []; } };
  assert.equal((await listCustomerOrders(request, { orders, now })).status, 503);
  for (const session of [null, { subject: 'customer-a', verified: false, expiresAt: 2000 }, { subject: 'customer-a', verified: true, expiresAt: 1000 }]) {
    assert.equal((await listCustomerOrders(request, { auth: { authenticate: async () => session }, orders, now })).status, 401);
  }
  assert.equal(calls, 0);
});
test('verified principal receives only own projected orders; foreign records fail closed', async () => {
  const orders = { findByOwner: async subject => [{ ownerId: subject, id: 'order-a', totalCents: 1290, currency: 'eur', status: 'paid', secret: 'not-returned' }] };
  const result = await listCustomerOrders(request, { auth, orders, now });
  assert.equal(result.status, 200);
  assert.equal(result.body.orders[0].id, 'order-a');
  assert.equal('secret' in result.body.orders[0], false);
  const foreign = { findByOwner: async () => [{ ownerId: 'customer-b', id: 'order-b' }] };
  assert.equal((await listCustomerOrders(request, { auth, orders: foreign, now })).status, 503);
});
