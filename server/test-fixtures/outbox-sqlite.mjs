// Test harness only: exercises the outbox contract against a real local SQLite
// database. It is not the production MongoDB adapter or a Vercel persistence layer.
import { DatabaseSync } from 'node:sqlite';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { processNextConfirmation } from '../confirmation-outbox.mjs';

export function sqliteHarness(path) {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY); CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, status TEXT NOT NULL, recipient TEXT, payload TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_ms INTEGER NOT NULL, created_ms INTEGER NOT NULL, claim_id TEXT, lease_ms INTEGER);');
  return {
    close: () => db.close(),
    paid(id, order, { fail = false } = {}) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const inserted = db.prepare('INSERT OR IGNORE INTO orders(id) VALUES (?)').run(id);
        if (inserted.changes) {
          db.prepare('INSERT INTO outbox(id,status,recipient,payload,next_ms,created_ms) VALUES (?, ?, ?, ?, ?, ?)').run(id, 'pending', 'buyer@example.invalid', JSON.stringify(order), 0, 0);
          if (fail) throw new Error('SIMULATED_ROLLBACK');
        }
        db.exec('COMMIT'); return Boolean(inserted.changes);
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    async claimMail(claimId, now, leaseUntil) {
      const row = db.prepare("UPDATE outbox SET status='sending', claim_id=?, lease_ms=?, attempts=attempts+1 WHERE id=(SELECT id FROM outbox WHERE status='pending' AND next_ms<=? ORDER BY created_ms,id LIMIT 1) AND status='pending' RETURNING *").get(claimId, leaseUntil.getTime(), now.getTime());
      return row ? { _id: row.id, recipient: row.recipient, order: JSON.parse(row.payload), attempts: row.attempts } : null;
    },
    async settleMail(id, claimId, status, now, nextAttemptAt) {
      return db.prepare("UPDATE outbox SET status=?, claim_id=NULL, lease_ms=NULL, next_ms=? WHERE id=? AND status='sending' AND claim_id=?").run(status, (nextAttemptAt || now).getTime(), id, claimId).changes === 1;
    },
    async markExpiredMailClaimsUnknown(now) {
      return db.prepare("UPDATE outbox SET status='unknown', claim_id=NULL, lease_ms=NULL WHERE status='sending' AND lease_ms<=?").run(now.getTime()).changes;
    },
    row: id => db.prepare('SELECT id,status,attempts,claim_id,lease_ms,next_ms FROM outbox WHERE id=?').get(id),
    orderCount: () => db.prepare('SELECT count(*) AS n FROM orders').get().n,
    outboxCount: () => db.prepare('SELECT count(*) AS n FROM outbox').get().n,
  };
}

if (!isMainThread && workerData?.outboxWorker) {
  const store = sqliteHarness(workerData.path);
  parentPort.postMessage('ready');
  parentPort.once('message', async () => {
    try {
      const result = await processNextConfirmation({ store, now: () => new Date(1000000), transport: { configured: true, send: async () => ({ status: 'sent' }) } });
      parentPort.postMessage(result.status);
    } catch { parentPort.postMessage('error'); }
    finally { store.close(); }
  });
}
