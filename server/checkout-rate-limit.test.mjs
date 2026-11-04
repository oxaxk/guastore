import test from 'node:test';
import assert from 'node:assert/strict';
import { mongoCheckoutLimiter } from './checkout-rate-limit.mjs';

function fakeAtomicMongo() {
  const rows=new Map();let indexes=0;
  return { rows, get indexes(){return indexes;}, collection(){return {
    async createIndex(spec,opts){assert.deepEqual(spec,{expiresAt:1});assert.equal(opts.expireAfterSeconds,0);indexes++;},
    async findOneAndUpdate(query,update){
      const current=rows.get(query._id);
      if(current && current.count>=query.count.$lt){const e=Error('duplicate');e.code=11000;throw e;}
      const row=current||{count:0,expiresAt:update.$setOnInsert.expiresAt};row.count++;rows.set(query._id,row);return {...row};
    },
  };} };
}
test('two limiter instances share the global cap across concurrent calls',async()=>{
  const db=fakeAtomicMongo(),a=mongoCheckoutLimiter(db),b=mongoCheckoutLimiter(db);
  const results=await Promise.all(Array.from({length:100},(_,i)=>(i%2?a:b).consume('global',null,120)));
  assert.equal(results.filter(Boolean).length,60);assert.equal(results.filter(x=>!x).length,40);
  assert.equal(await a.consume('global',null,180),true);
});
test('signed cookie bucket is bounded independently and stores only a hash',async()=>{
  const db=fakeAtomicMongo(),limit=mongoCheckoutLimiter(db),id='A'.repeat(43);
  const results=await Promise.all(Array.from({length:20},()=>limit.consume('session',id,100)));
  assert.equal(results.filter(Boolean).length,12);assert(![...db.rows.keys()].some(key=>key.includes(id)));
  assert.equal(await limit.consume('session','B'.repeat(43),100),true);
  await assert.rejects(()=>limit.consume('session','forged',100),/INVALID_RATE_INPUT/);
});
test('database and index failures propagate for handler to fail closed',async()=>{
  const db={collection:()=>({createIndex:async()=>{throw Error('unavailable');}})};
  await assert.rejects(()=>mongoCheckoutLimiter(db).consume('global',null,100),/unavailable/);
});
