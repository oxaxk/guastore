import { MongoClient } from 'mongodb';
import { mongoReservationStore } from './mongo-reservations.mjs';

// The URI must refer to a dedicated GUA test cluster, never RHODIDE production.
let cachedKey;
let connection;
async function initializeStore(client, databaseName) {
  const db = client.db(databaseName);
  await db.collection('inventory').bulkWrite([
    { updateOne: { filter: { _id: 'the-steel' }, update: { $setOnInsert: { available: 21, reserved: 0, sold: 0 } }, upsert: true } },
    { updateOne: { filter: { _id: 'the-jade' }, update: { $setOnInsert: { available: 80, reserved: 0, sold: 0 } }, upsert: true } },
  ], { ordered: true });
  await Promise.all([
    db.collection('reservations').createIndex({ status: 1, createdAt: 1 }),
    db.collection('orders').createIndex({ reservationId: 1 }, { unique: true }),
    db.collection('mail_outbox').createIndex({ status: 1, nextAttemptAt: 1, createdAt: 1 }),
    db.collection('withdrawals').createIndex({ orderReference: 1, createdAt: 1 }),
  ]);
  return mongoReservationStore(client, databaseName);
}
export async function openMongoStore(uri, databaseName) {
  if (!['gua_shop_test', 'gua_shop'].includes(databaseName)) throw new Error('INVALID_DATABASE');
  const key = `${databaseName}\n${uri}`;
  if (!connection || cachedKey !== key) {
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 });
    cachedKey = key;
    connection = client.connect().then(() => initializeStore(client, databaseName));
    connection.catch(() => { if (cachedKey === key) { connection = undefined; cachedKey = undefined; } });
  }
  return connection;
}
export function openTestStore(uri) { return openMongoStore(uri, 'gua_shop_test'); }
