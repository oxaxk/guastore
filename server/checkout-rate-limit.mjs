import { createHash } from 'node:crypto';

// Shared, atomic Mongo counters. Global cap applies to every initialized request;
// a second cap uses the server-signed random cookie, not an untrusted IP header.
export function mongoCheckoutLimiter(db) {
  const counters=db.collection('checkout_rate_limits');let indexPromise;
  async function ready() {
    if(!indexPromise) { indexPromise=counters.createIndex({expiresAt:1},{expireAfterSeconds:0}); indexPromise.catch(()=>{indexPromise=undefined;}); }
    await indexPromise;
  }
  async function consume(scope, identity, seconds) {
    if(!Number.isSafeInteger(seconds) || seconds<0 || !['global','session'].includes(scope)) throw Error('INVALID_RATE_INPUT');
    if(scope==='session' && !/^[A-Za-z0-9_-]{43}$/.test(identity||'')) throw Error('INVALID_RATE_INPUT');
    await ready();
    const period=scope==='global'?60:900, limit=scope==='global'?60:12;
    const bucket=Math.floor(seconds/period);
    const id=scope==='global'?`global:${bucket}`:`session:${createHash('sha256').update(identity).digest('hex')}:${bucket}`;
    const expiresAt=new Date((bucket+2)*period*1000);
    try {
      const row=await counters.findOneAndUpdate({_id:id,count:{$lt:limit}},{$inc:{count:1},$setOnInsert:{expiresAt}},{upsert:true,returnDocument:'after'});
      return Boolean(row && Number.isSafeInteger(row.count) && row.count<=limit);
    } catch(error) {
      // Duplicate _id means limit reached or concurrent first insert: deny safely.
      if(error?.code===11000)return false;
      throw error;
    }
  }
  return { consume };
}
