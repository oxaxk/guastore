// Explicit test-only reconciliation. Callers must provide authenticated Stripe
// retrieval functions and a transactional store; this module exposes no route.
export async function reconcileTestReservation(reservationId, { store, accountId, getStripeAccount, retrieveStripeSession }) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(reservationId || '') || !/^acct_[A-Za-z0-9]+$/.test(accountId || '') ||
      !store || typeof getStripeAccount !== 'function' || typeof retrieveStripeSession !== 'function') throw new Error('RECONCILIATION_NOT_CONFIGURED');
  const reservation = await store.getReservation(reservationId);
  if (!reservation) return { status: 'not_found' };
  if (reservation.status === 'paid') return { status: 'paid' };
  if (reservation.status === 'payment_review') return { status: 'manual_review' };
  if (reservation.status !== 'reserved' && reservation.status !== 'released') return { status: 'manual_review' };
  const sessionId = reservation.stripeSessionId;
  // An absent session ID is an unknown outcome, not evidence that Stripe created nothing.
  if (!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId || '')) return { status: 'manual_review' };
  const account = await getStripeAccount();
  if (account?.id !== accountId) throw new Error('WRONG_STRIPE_ACCOUNT');
  const session = await retrieveStripeSession(sessionId);
  if (session?.id !== sessionId || session.livemode !== false || session.mode !== 'payment' ||
      session.metadata?.reservation_id !== reservationId || session.currency !== reservation.currency ||
      !Number.isSafeInteger(reservation.totalCents) || session.amount_total !== reservation.totalCents) throw new Error('SESSION_MISMATCH');
  if (session.status === 'complete' && session.payment_status === 'paid') {
    const outcome = await store.markPaid(reservationId, sessionId, session.customer_details?.email || session.customer_email || null);
    return { status: outcome === 'manual_review' ? 'manual_review' : 'paid' };
  }
  if (session.status === 'expired' && session.payment_status === 'unpaid') {
    if (reservation.status === 'released') return { status:'released' };
    await store.releaseAfterVerifiedExpiry(reservationId, sessionId);
    return { status: 'released' };
  }
  return { status: 'pending' };
}
