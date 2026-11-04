import test from 'node:test';
import assert from 'node:assert/strict';
import { receiveWithdrawal } from '../api/withdrawal.mjs';

const origin = 'https://preview.example';
const env = { GUA_MODE: 'test', VERCEL_ENV: 'preview', GUA_MONGO_URI: 'mongodb://unused', GUA_ORIGIN: origin };
const request = (body, headers = {}) => new Request(`${origin}/api/withdrawal`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const body = { name: 'GUA Test', email: 'owner@example.invalid', orderReference: 'cs_test_order' };

test('withdrawal route fails closed outside its configured environment and validates origin', async () => {
  assert.equal((await receiveWithdrawal(request(body), { env: { ...env, VERCEL_ENV: 'production' } })).status, 503);
  assert.equal((await receiveWithdrawal(new Request(`${origin}/api/withdrawal`, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify(body) }), { env })).status, 403);
});

test('withdrawal requires a matching order recipient and confirms a stored request', async () => {
  const calls = [];
  const store = {
    authorizeWithdrawal: async (reference, email) => reference === body.orderReference && email === body.email,
    recordWithdrawal: async (_id, value) => calls.push(['record', value]),
    settleWithdrawal: async (_id, status) => calls.push(['settle', status]),
  };
  const response = await receiveWithdrawal(request(body), {
    env, openStore: async () => store, id: () => 'withdrawal-1', now: () => new Date('2026-11-04T12:00:00Z'),
    createTransport: async () => ({ configured: true, send: async message => { calls.push(['send', message.to]); return { status: 'sent' }; } }),
  });
  assert.equal(response.status, 201);
  assert.deepEqual(calls.map(call => call[0]), ['record', 'send', 'settle']);
  assert.equal(calls[2][1], 'confirmed');
});

test('withdrawal never emails an address that is not tied to the order', async () => {
  let sent = false;
  const response = await receiveWithdrawal(request(body), {
    env,
    openStore: async () => ({ authorizeWithdrawal: async () => false }),
    createTransport: async () => ({ configured: true, send: async () => { sent = true; return { status: 'sent' }; } }),
  });
  assert.equal(response.status, 404);
  assert.equal(sent, false);
});
