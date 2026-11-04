import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeStore } from './test-store.mjs';

test('production bootstrap seeds approved stock and creates operational indexes idempotently', async () => {
  const writes = [];
  const indexes = [];
  const collections = new Map();
  const db = {
    collection(name) {
      if (!collections.has(name)) collections.set(name, {
        async bulkWrite(ops, options) { writes.push({ name, ops, options }); },
        async createIndex(spec, options = {}) { indexes.push({ name, spec, options }); },
      });
      return collections.get(name);
    },
  };
  const client = { db: name => (assert.equal(name, 'gua_shop'), db) };
  await initializeStore(client, 'gua_shop');

  assert.equal(writes.length, 1);
  assert.equal(writes[0].name, 'inventory');
  assert.deepEqual(writes[0].ops.map(op => op.updateOne.update.$setOnInsert), [
    { available: 21, reserved: 0, sold: 0 },
    { available: 80, reserved: 0, sold: 0 },
  ]);
  assert(indexes.some(index => index.name === 'orders' && index.options.unique === true));
  assert(indexes.some(index => index.name === 'checkout_rate_limits' && index.options.expireAfterSeconds === 0));
  assert(indexes.some(index => index.name === 'payment_conflicts'));
});
