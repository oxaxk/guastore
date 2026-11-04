// Isolated SQLite contract fixture, NOT the production Mongo adapter or Stripe service.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHmac } from 'node:crypto';
import { receiveTestCheckout } from '../api/checkout-test.mjs';
import { receiveTestWebhook } from '../api/stripe-test-webhook.mjs';
import { reconcileWithTestStripe } from './stripe-test-reader.mjs';

const env={GUA_TEST_MODE:'enabled',VERCEL_ENV:'preview',GUA_TEST_ORIGIN:'https://preview.example',GUA_TEST_MONGO_URI:'mongodb://isolated',GUA_TEST_STRIPE_KEY:'rk_test_fixture',GUA_TEST_STRIPE_ACCOUNT_ID:'acct_fixture',GUA_TEST_COOKIE_SECRET:'s'.repeat(48),GUA_TEST_STRIPE_WEBHOOK_SECRET:'whsec_fixture'};
const cart={items:[{sku:'the-steel',quantity:1},{sku:'the-jade',quantity:1}]};
const request=(cookie)=>new Request(`${env.GUA_TEST_ORIGIN}/api/checkout-test`,{method:'POST',headers:{origin:env.GUA_TEST_ORIGIN,'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(cart)});
function dbFixture(){
  const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE stock(sku TEXT PRIMARY KEY,available INTEGER,reserved INTEGER,sold INTEGER); INSERT INTO stock VALUES('the-steel',21,0,0),('the-jade',80,0,0); CREATE TABLE reservations(id TEXT PRIMARY KEY,status TEXT NOT NULL,session TEXT,payload TEXT NOT NULL); CREATE TABLE orders(id TEXT PRIMARY KEY,total INTEGER); CREATE TABLE outbox(id TEXT PRIMARY KEY,status TEXT NOT NULL,recipient TEXT); CREATE TABLE conflicts(id TEXT PRIMARY KEY,status TEXT NOT NULL);");
  let failConflict=false;
  const tx=fn=>{db.exec('BEGIN IMMEDIATE');try{const value=fn();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}};
  const get=id=>{const row=db.prepare('SELECT * FROM reservations WHERE id=?').get(id);return row?{...JSON.parse(row.payload),status:row.status,stripeSessionId:row.session}:null;};
  return {db,setFailConflict:value=>{failConflict=value;},close:()=>db.close(),consumeCheckoutRate:async()=>true,getReservation:async id=>get(id),
    available:async()=>Object.fromEntries(db.prepare('SELECT sku,available FROM stock').all().map(r=>[r.sku,r.available])),
    reserve:async(id,value)=>tx(()=>{const old=get(id);if(old){if(old.cartHash!==JSON.stringify(value.items))throw Error('RESERVATION_CONFLICT');return old;}for(const item of value.items){if(!db.prepare('UPDATE stock SET available=available-?,reserved=reserved+? WHERE sku=? AND available>=?').run(item.quantity,item.quantity,item.sku,item.quantity).changes)throw Error('OUT_OF_STOCK');}const payload={items:value.items,cartHash:JSON.stringify(value.items),totalCents:value.totalCents,currency:'eur'};db.prepare('INSERT INTO reservations VALUES(?,?,?,?)').run(id,'reserved',null,JSON.stringify(payload));return {...payload,status:'reserved',stripeSessionId:null};}),
    attachSession:async(id,sid)=>{db.prepare("UPDATE reservations SET session=? WHERE id=? AND status='reserved'").run(sid,id);},
    markPaid:async(id,sid,email)=>tx(()=>{const r=get(id);if(!r||r.stripeSessionId!==sid)throw Error('NOT_FOUND');if(r.status==='paid')return false;if(r.status==='released'||r.status==='payment_review'){db.prepare('INSERT OR IGNORE INTO conflicts VALUES(?,?)').run(sid,'manual_review');if(failConflict)throw Error('STORAGE_FAILURE');db.prepare("UPDATE reservations SET status='payment_review' WHERE id=?").run(id);return 'manual_review';}if(r.status!=='reserved')throw Error('STATE');for(const i of r.items)db.prepare('UPDATE stock SET reserved=reserved-?,sold=sold+? WHERE sku=? AND reserved>=?').run(i.quantity,i.quantity,i.sku,i.quantity);db.prepare('INSERT INTO orders VALUES(?,?)').run(sid,r.totalCents);db.prepare('INSERT INTO outbox VALUES(?,?,?)').run(sid,'pending',email);db.prepare("UPDATE reservations SET status='paid' WHERE id=?").run(id);return true;}),
    releaseAfterVerifiedExpiry:async(id,sid)=>tx(()=>{const r=get(id);if(!r||r.stripeSessionId!==sid)throw Error('NOT_FOUND');if(r.status==='released')return false;if(r.status!=='reserved')throw Error('STATE');for(const i of r.items)db.prepare('UPDATE stock SET reserved=reserved-?,available=available+? WHERE sku=? AND reserved>=?').run(i.quantity,i.quantity,i.sku,i.quantity);db.prepare("UPDATE reservations SET status='released' WHERE id=?").run(id);return true;}),
  };
}
function stripeFixture({timeoutFirst=false}={}){
  let session,posts=0;const keys=[];
  const fetchImpl=async(url,options)=>{
    if(url.endsWith('/v1/account'))return Response.json({id:'acct_fixture'});
    if(options.method==='GET')return Response.json(session);
    posts++;keys.push(options.headers['Idempotency-Key']);
    if(!session)session={id:'cs_test_flow',url:'https://checkout.stripe.com/c/pay/cs_test_flow',metadata:{reservation_id:options.body.get('metadata[reservation_id]')},livemode:false,mode:'payment',currency:'eur',amount_total:2280,status:'open',payment_status:'unpaid',customer_details:{email:'test@example.invalid'}};
    if(timeoutFirst&&posts===1)throw Error('simulated lost response after creation');
    return Response.json(session);
  };
  return {fetchImpl,keys,get session(){return session;},get posts(){return posts;}};
}
function eventRequest(type,session){
  const body=JSON.stringify({id:'evt_fixture',livemode:false,account:'acct_fixture',type,data:{object:session}}),t=Math.floor(Date.now()/1000);
  const signature=createHmac('sha256',env.GUA_TEST_STRIPE_WEBHOOK_SECRET).update(`${t}.${body}`).digest('hex');
  return new Request('https://preview.example/api/stripe-test-webhook',{method:'POST',headers:{'stripe-signature':`t=${t},v1=${signature}`},body});
}
async function initialize(store,stripe){const deps={env,openStore:async()=>store,fetchImpl:stripe.fetchImpl};const initial=await receiveTestCheckout(request(),deps);assert.equal(initial.status,202);return {deps,cookie:initial.headers.get('set-cookie').split(';')[0]};}
test('actual handlers carry checkout through paid webhook and one order/outbox under duplicate delivery and reconciliation',async()=>{
  const store=dbFixture(),stripe=stripeFixture();try{
    const {deps,cookie}=await initialize(store,stripe);assert.equal((await receiveTestCheckout(request(cookie),deps)).status,200);
    stripe.session.status='complete';stripe.session.payment_status='paid';
    const webhookDeps={env,openStore:async()=>store};
    const outcomes=await Promise.all([receiveTestWebhook(eventRequest('checkout.session.completed',stripe.session),webhookDeps),receiveTestWebhook(eventRequest('checkout.session.completed',stripe.session),webhookDeps),reconcileWithTestStripe(stripe.session.metadata.reservation_id,{store,secretKey:env.GUA_TEST_STRIPE_KEY,accountId:env.GUA_TEST_STRIPE_ACCOUNT_ID,fetchImpl:stripe.fetchImpl})]);
    assert.equal(outcomes[0].status,200);assert.equal(outcomes[1].status,200);assert.equal(outcomes[2].status,'paid');
    assert.deepEqual(store.db.prepare('SELECT sku,available,reserved,sold FROM stock ORDER BY sku').all().map(r=>({...r})),[{sku:'the-jade',available:79,reserved:0,sold:1},{sku:'the-steel',available:20,reserved:0,sold:1}]);
    assert.equal(store.db.prepare('SELECT total FROM orders').get().total,2280);assert.equal(store.db.prepare('SELECT count(*) n FROM orders').get().n,1);assert.equal(store.db.prepare('SELECT count(*) n FROM outbox').get().n,1);assert.equal(store.db.prepare('SELECT status FROM outbox').get().status,'pending');
    const lateExpiry={...stripe.session,status:'expired',payment_status:'unpaid'};assert.equal((await receiveTestWebhook(eventRequest('checkout.session.expired',lateExpiry),webhookDeps)).status,200);assert.equal(store.db.prepare("SELECT available FROM stock WHERE sku='the-steel'").get().available,20);
  }finally{store.close();}
});
test('lost create response keeps inventory reserved and identical retry does not decrement twice',async()=>{
  const store=dbFixture(),stripe=stripeFixture({timeoutFirst:true});try{
    const {deps,cookie}=await initialize(store,stripe);assert.equal((await receiveTestCheckout(request(cookie),deps)).status,503);assert.equal((await receiveTestCheckout(request(cookie),deps)).status,200);
    assert.equal(stripe.posts,2);assert.equal(stripe.keys[0],stripe.keys[1]);assert.equal(store.db.prepare("SELECT available FROM stock WHERE sku='the-steel'").get().available,20);assert.equal(store.db.prepare('SELECT count(*) n FROM reservations').get().n,1);
  }finally{store.close();}
});
test('simultaneous paid and expiry notifications retain sold stock when payment commits first',async()=>{
  const store=dbFixture(),stripe=stripeFixture();try{
    const {deps,cookie}=await initialize(store,stripe);assert.equal((await receiveTestCheckout(request(cookie),deps)).status,200);
    const paid={...stripe.session,status:'complete',payment_status:'paid'};
    const expired={...stripe.session,status:'expired',payment_status:'unpaid'};
    const webhookDeps={env,openStore:async()=>store};
    const responses=await Promise.all([receiveTestWebhook(eventRequest('checkout.session.completed',paid),webhookDeps),receiveTestWebhook(eventRequest('checkout.session.expired',expired),webhookDeps)]);
    assert.equal(responses[0].status,200);
    assert([200,503].includes(responses[1].status));
    assert.deepEqual({...store.db.prepare("SELECT available,reserved,sold FROM stock WHERE sku='the-steel'").get()},{available:20,reserved:0,sold:1});
    assert.equal(store.db.prepare('SELECT count(*) n FROM orders').get().n,1);
  }finally{store.close();}
});
test('paid after release is recorded once for review, never fulfilled or allocated again',async()=>{
  const store=dbFixture(),stripe=stripeFixture();try{
    const {deps,cookie}=await initialize(store,stripe);assert.equal((await receiveTestCheckout(request(cookie),deps)).status,200);
    const expired={...stripe.session,status:'expired',payment_status:'unpaid'};
    const paid={...stripe.session,status:'complete',payment_status:'paid'};
    const webhookDeps={env,openStore:async()=>store};
    assert.equal((await receiveTestWebhook(eventRequest('checkout.session.expired',expired),webhookDeps)).status,200);
    store.setFailConflict(true);
    assert.equal((await receiveTestWebhook(eventRequest('checkout.session.completed',paid),webhookDeps)).status,503);
    assert.equal(store.db.prepare('SELECT count(*) n FROM conflicts').get().n,0);
    assert.equal(store.db.prepare('SELECT status FROM reservations').get().status,'released');
    store.setFailConflict(false);
    const first=await receiveTestWebhook(eventRequest('checkout.session.completed',paid),webhookDeps);assert.equal(first.status,200);
    assert.equal((await receiveTestWebhook(eventRequest('checkout.session.completed',paid),webhookDeps)).status,200);
    stripe.session.status='complete';stripe.session.payment_status='paid';
    assert.equal((await reconcileWithTestStripe(stripe.session.metadata.reservation_id,{store,secretKey:env.GUA_TEST_STRIPE_KEY,accountId:env.GUA_TEST_STRIPE_ACCOUNT_ID,fetchImpl:stripe.fetchImpl})).status,'manual_review');
    assert.equal(store.db.prepare('SELECT count(*) n FROM conflicts').get().n,1);
    assert.equal(store.db.prepare('SELECT status FROM reservations').get().status,'payment_review');
    assert.equal(store.db.prepare('SELECT count(*) n FROM orders').get().n,0);assert.equal(store.db.prepare('SELECT count(*) n FROM outbox').get().n,0);
    assert.deepEqual({...store.db.prepare("SELECT available,reserved,sold FROM stock WHERE sku='the-steel'").get()},{available:21,reserved:0,sold:0});
  }finally{store.close();}
});
test('reconciliation discovers paid-after-release even without a paid webhook',async()=>{
  const store=dbFixture(),stripe=stripeFixture();try{
    const {deps,cookie}=await initialize(store,stripe);assert.equal((await receiveTestCheckout(request(cookie),deps)).status,200);
    const expired={...stripe.session,status:'expired',payment_status:'unpaid'};
    assert.equal((await receiveTestWebhook(eventRequest('checkout.session.expired',expired),{env,openStore:async()=>store})).status,200);
    stripe.session.status='complete';stripe.session.payment_status='paid';
    const outcome=await reconcileWithTestStripe(stripe.session.metadata.reservation_id,{store,secretKey:env.GUA_TEST_STRIPE_KEY,accountId:env.GUA_TEST_STRIPE_ACCOUNT_ID,fetchImpl:stripe.fetchImpl});
    assert.equal(outcome.status,'manual_review');assert.equal(store.db.prepare('SELECT count(*) n FROM conflicts').get().n,1);
    assert.equal(store.db.prepare('SELECT count(*) n FROM orders').get().n,0);
  }finally{store.close();}
});
