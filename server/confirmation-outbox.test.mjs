import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { sqliteHarness } from './test-fixtures/outbox-sqlite.mjs';
import { processNextConfirmation } from './confirmation-outbox.mjs';

const base = resolve('test-work', 'outbox');
mkdirSync(base, { recursive: true });
const order = { reference: 'cs_test_order', items: [{ name: 'The Steel', quantity: 1, unitCents: 1290 }], shippingCents: 199, totalCents: 1489, paymentStatus: 'paid' };
function fixture(t) {
  const dir = mkdtempSync(join(base, 'case-'));
  const path = join(dir, 'orders.sqlite');
  const db = sqliteHarness(path);
  t.after(() => { db.close(); for (const suffix of ['', '-wal', '-shm']) { try { unlinkSync(path + suffix); } catch (error) { if (error.code !== 'ENOENT') throw error; } } rmdirSync(dir); });
  return { db, path };
}
test('real SQLite transaction rolls back order and outbox together, duplicate event creates one job', t => {
  const { db } = fixture(t);
  assert.throws(() => db.paid('cs_test_order', order, { fail: true }), /SIMULATED_ROLLBACK/);
  assert.equal(db.orderCount(), 0); assert.equal(db.outboxCount(), 0);
  assert.equal(db.paid('cs_test_order', order), true);
  assert.equal(db.paid('cs_test_order', order), false);
  assert.equal(db.orderCount(), 1); assert.equal(db.outboxCount(), 1);
});
test('unknown result and expired claim are quarantined; a proven pre-send failure retries', async t => {
  const { db } = fixture(t); db.paid('cs_test_order', order);
  let clock = 1000000;
  assert.equal((await processNextConfirmation({ store: db })).status, 'unavailable');
  const now = () => new Date(clock);
  let count = 0;
  const transport = { configured: true, send: async () => { count++; return count === 1 ? { status: 'not_sent', confirmedNotAccepted: true } : { status: 'unknown' }; } };
  assert.equal((await processNextConfirmation({ store: db, transport, now })).status, 'pending');
  assert.equal((await processNextConfirmation({ store: db, transport, now })).status, 'empty');
  clock += 60000;
  assert.equal((await processNextConfirmation({ store: db, transport, now })).status, 'unknown');
  assert.equal((await processNextConfirmation({ store: db, transport, now })).status, 'empty');
  assert.equal(count, 2);
  db.paid('cs_test_second', { ...order, reference: 'cs_test_second' });
  await db.claimMail('crashed', now(), new Date(clock + 30000));
  clock += 30001;
  assert.equal(await db.markExpiredMailClaimsUnknown(now()), 1);
  assert.equal(db.row('cs_test_second').status, 'unknown');
  assert.equal(await db.settleMail('cs_test_second', 'crashed', 'sent', now()), false);
  assert.equal((await processNextConfirmation({ store: db, transport, now })).status, 'empty');
});
test('two worker threads with independent SQLite connections claim a single job once', async t => {
  const { db, path } = fixture(t); db.paid('cs_test_order', order);
  const workers = [0, 1].map(() => new Worker(new URL('./test-fixtures/outbox-sqlite.mjs', import.meta.url), { workerData: { outboxWorker: true, path } }));
  const exits = workers.map(w => new Promise(resolve => w.once('exit', resolve)));
  const ready = workers.map(w => new Promise((resolve, reject) => { w.once('message', resolve); w.once('error', reject); }));
  assert.deepEqual(await Promise.all(ready), ['ready', 'ready']);
  const results = workers.map(w => new Promise((resolve, reject) => { w.once('message', resolve); w.once('error', reject); }));
  workers.forEach(w => w.postMessage('go'));
  assert.deepEqual((await Promise.all(results)).sort(), ['empty', 'sent']);
  await Promise.all(exits);
  assert.equal(db.row('cs_test_order').status, 'sent');
  assert.equal(db.row('cs_test_order').attempts, 1);
});
