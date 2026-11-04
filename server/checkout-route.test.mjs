import test from 'node:test';
import assert from 'node:assert/strict';
import { receiveTestCheckout } from '../api/checkout-test.mjs';

const env = { GUA_TEST_MODE: 'enabled', VERCEL_ENV: 'preview', GUA_TEST_ORIGIN: 'https://preview.example', GUA_TEST_MONGO_URI: 'mongodb://unused', GUA_TEST_STRIPE_KEY: 'rk_test_dummy', GUA_TEST_STRIPE_ACCOUNT_ID: 'acct_test', GUA_TEST_COOKIE_SECRET: 's'.repeat(48) };
const cart = { items: [{ sku: 'the-steel', quantity: 1 }] };
function request(body = cart, cookie, origin = env.GUA_TEST_ORIGIN) {
  return new Request(`${env.GUA_TEST_ORIGIN}/api/checkout-test`, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
}
function fakeStore() {
  const records = new Map(); let reserves = 0;
  return { get reserves() { return reserves; }, consumeCheckoutRate:async()=>true, getReservation: async id => records.get(id), available: async () => ({ 'the-steel': 20, 'the-jade': 80 }),
    reserve: async (id, c) => { const prior = records.get(id); if (prior) { if (prior.cartHash !== JSON.stringify(c.items)) throw new Error('RESERVATION_CONFLICT'); return prior; } reserves++; const value = { status: 'reserved', items: c.items, totalCents: c.totalCents, cartHash: JSON.stringify(c.items), stripeSessionId: null }; records.set(id, value); return value; },
    attachSession: async (id, sessionId) => { records.get(id).stripeSessionId = sessionId; } };
}
test('production and cross-origin requests are denied; forged cookies cannot access a store', async () => {
  let calls = 0; const store=fakeStore(); const openStore = async () => { calls++; return store; };
  assert.equal((await receiveTestCheckout(request(), { env: { ...env, VERCEL_ENV: 'production' }, openStore })).status, 503);
  assert.equal((await receiveTestCheckout(request(cart, null, 'https://evil.example'), { env, openStore })).status, 403);
  assert.equal((await receiveTestCheckout(request(cart, '__Host-gua_test_checkout=foreign'), { env, openStore })).status, 403);
  const initial = await receiveTestCheckout(request(), { env, openStore });
  const cookie = initial.headers.get('set-cookie').split(';')[0];
  const parts = cookie.split('.');
  const changed = parts[0].endsWith('A') ? 'B' : 'A';
  const forged = `${parts[0].slice(0, -1)}${changed}.${parts[1]}.${parts[2]}`;
  assert.equal((await receiveTestCheckout(request(cart, forged), { env, openStore })).status, 403);
  const wrongAccount = async () => Response.json({ id: 'acct_other' });
  assert.equal((await receiveTestCheckout(request(cart, cookie), { env, openStore, fetchImpl: wrongAccount })).status, 503);
  assert.equal(store.reserves, 0);
});
test('timeout retry preserves reservation and idempotency; duplicate resumes same session', async () => {
  const store = fakeStore(); const keys = []; let calls = 0;
  const fetchImpl = async (_url, options) => {
    if (_url.endsWith('/v1/account')) return Response.json({ id: 'acct_test' });
    if (options.method === 'GET') return Response.json({ id: 'cs_test_order', status: 'open', url: 'https://checkout.stripe.com/c/pay/cs_test_order' });
    keys.push(options.headers['Idempotency-Key']); calls++;
    assert.equal(options.body.get('line_items[0][price_data][unit_amount]'), '699');
    assert.equal(options.body.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '199');
    if (calls === 1) throw new Error('TIMEOUT');
    return Response.json({ id: 'cs_test_order', url: 'https://checkout.stripe.com/c/pay/cs_test_order' });
  };
  const deps = { env, openStore: async () => store, fetchImpl };
  const init = await receiveTestCheckout(request(), deps);
  assert.equal(init.status, 202);
  const cookie = init.headers.get('set-cookie').split(';')[0];
  assert.match(init.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal((await receiveTestCheckout(request(cart, cookie), deps)).status, 503);
  assert.equal((await receiveTestCheckout(request(cart, cookie), deps)).status, 200);
  assert.equal((await receiveTestCheckout(request(cart, cookie), deps)).status, 200);
  assert.equal((await receiveTestCheckout(request({ items: [{ sku: 'the-jade', quantity: 1 }] }, cookie), deps)).status, 409);
  assert.equal(store.reserves, 1);
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
});

test('handler bounds account reads before making a reservation', async () => {
  const store=fakeStore();const deps={env,timeoutMs:15,openStore:async()=>store,fetchImpl:async()=>new Response(new ReadableStream({pull(){return new Promise(()=>{});}}))};
  const first=await receiveTestCheckout(request(),deps);const cookie=first.headers.get('set-cookie').split(';')[0];
  assert.equal((await receiveTestCheckout(request(cart,cookie),deps)).status,503);assert.equal(store.reserves,0);
});
test('handler preserves a reservation when Stripe POST body stalls after possible creation', async () => {
  const store=fakeStore();const keys=[];let posts=0;
  const fetchImpl=async(url,options)=>{
    if(url.endsWith('/v1/account'))return Response.json({id:'acct_test'});
    if(options.method==='GET')return Response.json({id:'cs_test_order',status:'open',url:'https://checkout.stripe.com/c/pay/cs_test_order'});
    assert.equal(options.redirect,'error');keys.push(options.headers['Idempotency-Key']);posts++;
    if(posts===1)return new Response(new ReadableStream({pull(){return new Promise(()=>{});}}));
    return Response.json({id:'cs_test_order',url:'https://checkout.stripe.com/c/pay/cs_test_order'});
  };
  const deps={env,openStore:async()=>store,fetchImpl,timeoutMs:15};
  const first=await receiveTestCheckout(request(),deps);const cookie=first.headers.get('set-cookie').split(';')[0];
  assert.equal((await receiveTestCheckout(request(cart,cookie),deps)).status,503);
  assert.equal((await receiveTestCheckout(request(cart,cookie),deps)).status,200);
  assert.equal((await receiveTestCheckout(request(cart,cookie),deps)).status,200);
  assert.equal(store.reserves,1);assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
});
test('handler bounds stalled session-resume reads without creating another session', async () => {
  const store=fakeStore();let posts=0;
  const fetchImpl=async(url,options)=>{
    if(url.endsWith('/v1/account'))return Response.json({id:'acct_test'});
    if(options.method==='POST'){posts++;return Response.json({id:'cs_test_order',url:'https://checkout.stripe.com/c/pay/cs_test_order'});}
    return new Response(new ReadableStream({pull(){return new Promise(()=>{});}}));
  };
  const deps={env,openStore:async()=>store,fetchImpl,timeoutMs:15};
  const first=await receiveTestCheckout(request(),deps);const cookie=first.headers.get('set-cookie').split(';')[0];
  assert.equal((await receiveTestCheckout(request(cart,cookie),deps)).status,200);
  assert.equal((await receiveTestCheckout(request(cart,cookie),deps)).status,503);
  assert.equal(store.reserves,1);assert.equal(posts,1);
});
test('rate limit and unavailable limiter deny before Stripe calls',async()=>{
  let calls=0;const store=fakeStore();store.consumeCheckoutRate=async()=>false;
  const deps={env,openStore:async()=>store,fetchImpl:async()=>{calls++;throw Error();}};
  assert.equal((await receiveTestCheckout(request(),deps)).status,429);assert.equal(calls,0);
  store.consumeCheckoutRate=async()=>{throw Error('db down');};
  assert.equal((await receiveTestCheckout(request(),deps)).status,503);assert.equal(calls,0);assert.equal(store.reserves,0);
});
