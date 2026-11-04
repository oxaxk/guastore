import { MongoClient } from 'mongodb';
import { initializeStore } from '../server/test-store.mjs';

const uri = process.env.GUA_MONGO_URI;
if (process.env.GUA_DB_BOOTSTRAP !== 'confirm-gua-shop') {
  throw new Error('Set GUA_DB_BOOTSTRAP=confirm-gua-shop for the dedicated production bootstrap.');
}
if (typeof uri !== 'string' || !/^mongodb(?:\+srv)?:\/\//.test(uri)) {
  throw new Error('GUA_MONGO_URI must be a MongoDB connection string for the dedicated gua_shop user.');
}

const client = new MongoClient(uri, { maxPoolSize: 2, serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const store = await initializeStore(client, 'gua_shop');
  const stock = await store.available();
  if (stock['the-steel'] !== 21 || stock['the-jade'] !== 80) {
    throw new Error('Production inventory already differs from the approved initial stock; manual review required.');
  }
  console.log(JSON.stringify({ status: 'ready', database: 'gua_shop', stock }));
} finally {
  await client.close();
}
