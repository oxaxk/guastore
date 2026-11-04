import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileTestReservation } from './checkout-reconciliation.mjs';

const reservation = { stripeSessionId:'cs_test_123', status:'reserved', currency:'eur', totalCents:1489 };
const session = { id:'cs_test_123', livemode:false, mode:'payment', metadata:{reservation_id:'r1'}, currency:'eur', amount_total:1489, status:'expired', payment_status:'unpaid' };
function fixture(overrides={}) {
  let state='reserved', writes=0;
  const store = { get writes(){return writes;}, get state(){return state;}, async getReservation(){return {...reservation,status:state,...overrides.reservation};},
    async markPaid(){if(state==='paid')return false;if(state!=='reserved')throw Error('STATE');state='paid';writes++;return true;},
    async releaseAfterVerifiedExpiry(){if(state==='released')return false;if(state!=='reserved')throw Error('STATE');state='released';writes++;return true;} };
  return { store, accountId:'acct_test', getStripeAccount:async()=>({id:'acct_test'}), retrieveStripeSession:async()=>({...session,...overrides.session}) };
}
test('verified expired sessions release only once under simultaneous reconciliation', async () => {
  const ctx=fixture();
  const results=await Promise.all([reconcileTestReservation('r1',ctx),reconcileTestReservation('r1',ctx)]);
  assert.deepEqual(results,[{status:'released'},{status:'released'}]);
  assert.equal(ctx.store.writes,1);
});
test('paid session records payment and repeated checks are idempotent', async () => {
  const ctx=fixture({session:{status:'complete',payment_status:'paid'}});
  assert.equal((await reconcileTestReservation('r1',ctx)).status,'paid');
  assert.equal((await reconcileTestReservation('r1',ctx)).status,'paid');
  assert.equal(ctx.store.writes,1);
});
test('unknown session and unsettled payment never release stock', async () => {
  const unknown=fixture({reservation:{stripeSessionId:null}});
  unknown.getStripeAccount=async()=>{throw Error('must not query');};
  assert.equal((await reconcileTestReservation('r1',unknown)).status,'manual_review');
  const pending=fixture({session:{status:'complete',payment_status:'unpaid'}});
  assert.equal((await reconcileTestReservation('r1',pending)).status,'pending');
  assert.equal(pending.store.writes,0);
});
test('incorrect Stripe account, mismatched data, live sessions and retrieval failures fail closed', async () => {
  const wrong=fixture();wrong.getStripeAccount=async()=>({id:'acct_other'});
  await assert.rejects(()=>reconcileTestReservation('r1',wrong),/WRONG_STRIPE_ACCOUNT/);
  for(const mutation of [{livemode:true},{amount_total:1},{metadata:{reservation_id:'foreign'}},{currency:'usd'},{id:'cs_test_other'}]) {
    const ctx=fixture({session:mutation});await assert.rejects(()=>reconcileTestReservation('r1',ctx),/SESSION_MISMATCH/);assert.equal(ctx.store.writes,0);
  }
  const failure=fixture();failure.retrieveStripeSession=async()=>{throw Error('timeout');};
  await assert.rejects(()=>reconcileTestReservation('r1',failure),/timeout/);assert.equal(failure.store.writes,0);
});
test('a concurrent paid transition cannot release its stock', async () => {
  const ctx=fixture();
  ctx.retrieveStripeSession=async()=>{await ctx.store.markPaid();return session;};
  await assert.rejects(()=>reconcileTestReservation('r1',ctx),/STATE/);
  assert.equal(ctx.store.state,'paid');assert.equal(ctx.store.writes,1);
});
