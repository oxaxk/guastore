import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestStripeReader, reconcileWithTestStripe } from './stripe-test-reader.mjs';

const key='rk_'+'test_'+'fakekey123456789';
const accountId='acct_test123';
const opts={secretKey:key,accountId};
const session={id:'cs_test_123',livemode:false,mode:'payment',metadata:{reservation_id:'r1'},currency:'eur',amount_total:1489,status:'expired',payment_status:'unpaid'};
test('rejects missing and malformed configuration before network access', async()=>{
  let calls=0;const fetchImpl=async()=>{calls++;};
  for(const secretKey of ['', 'rk_test_../bad', 'rk_live_../bad']) assert.throws(()=>createTestStripeReader({secretKey,accountId,fetchImpl}),/NOT_CONFIGURED/);
  assert.throws(()=>createTestStripeReader({...opts,timeoutMs:10001,fetchImpl}),/NOT_CONFIGURED/);assert.equal(calls,0);
});
test('only reads expected account and known test session, and wires reconciliation',async()=>{
  const paths=[];let writes=0;
  const fetchImpl=async(url,request)=>{paths.push(new URL(url).pathname);assert.equal(request.method,'GET');assert.equal(request.redirect,'error');return Response.json(url.endsWith('/account')?{id:accountId}:session);};
  const store={getReservation:async()=>({status:'reserved',stripeSessionId:session.id,currency:'eur',totalCents:1489}),releaseAfterVerifiedExpiry:async()=>{writes++;}};
  assert.deepEqual(await reconcileWithTestStripe('r1',{...opts,fetchImpl,store}),{status:'released'});
  assert.deepEqual(paths,['/v1/account','/v1/checkout/sessions/cs_test_123']);assert.equal(writes,1);
  const reader=createTestStripeReader({...opts,fetchImpl});await assert.rejects(()=>reader.retrieveStripeSession('cs_live_bad'),/INVALID_TEST_SESSION/);assert.equal(paths.length,2);
});
test('wrong account, HTTP rate limits, invalid or oversized responses fail closed',async()=>{
  const wrong=createTestStripeReader({...opts,fetchImpl:async()=>Response.json({id:'acct_other'})});await assert.rejects(()=>wrong.getStripeAccount(),/WRONG_STRIPE_ACCOUNT/);
  for(const response of [()=>new Response('{}',{status:429}),()=>new Response('{}',{status:500}),()=>new Response('not json'),()=>new Response('x',{headers:{'content-length':'300000'}}),()=>new Response('x'.repeat(262145))]) {
    const reader=createTestStripeReader({...opts,fetchImpl:async()=>response()});await assert.rejects(()=>reader.getStripeAccount(),/STRIPE_READ_FAILED/);
  }
});
test('timeout aborts even when transport never returns, without leaking transport errors',async()=>{
  const reader=createTestStripeReader({...opts,timeoutMs:15,fetchImpl:()=>new Promise(()=>{})});await assert.rejects(()=>reader.getStripeAccount(),/STRIPE_READ_TIMEOUT/);
  const failing=createTestStripeReader({...opts,fetchImpl:async()=>{throw Error('private transport diagnostic');}});
  await assert.rejects(()=>failing.getStripeAccount(),e=>e.message==='STRIPE_READ_FAILED');
});
test('live-mode Stripe session never causes state changes',async()=>{
  let writes=0;const store={getReservation:async()=>({status:'reserved',stripeSessionId:session.id,currency:'eur',totalCents:1489}),releaseAfterVerifiedExpiry:async()=>{writes++;}};
  const fetchImpl=async url=>Response.json(url.endsWith('/account')?{id:accountId}:{...session,livemode:true});
  await assert.rejects(()=>reconcileWithTestStripe('r1',{...opts,fetchImpl,store}),/SESSION_MISMATCH/);assert.equal(writes,0);
});
