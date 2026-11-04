import { validateCheckoutCart } from './checkout-policy.mjs';
import { createTestCheckoutSession } from './stripe-test-adapter.mjs';

// Only call from a trusted server route. The request body contains items only;
// origin, secret key, reservation ID and storage are server-owned inputs.
export async function startTestCheckout(body, { store, reservationId, origin, secretKey, fetchImpl, timeoutMs }) {
  if (!store || !reservationId) throw new Error('CHECKOUT_NOT_CONFIGURED');
  const previous = await store.getReservation(reservationId);
  if (previous && previous.status !== 'reserved') throw new Error('RESERVATION_TERMINAL');
  const available = await store.available();
  if (previous) for (const item of previous.items) available[item.sku] += item.quantity;
  const cart = validateCheckoutCart(body, available);
  const reservation = await store.reserve(reservationId, cart);
  if (reservation.status !== 'reserved') throw new Error('RESERVATION_TERMINAL');
  if (reservation.stripeSessionId) throw new Error('SESSION_ALREADY_CREATED');
  // A timeout here has an unknown Stripe outcome. Keep the stock reserved;
  // retry with the same ID and Stripe Idempotency-Key, never release on timeout.
  const session = await createTestCheckoutSession(cart, { origin, secretKey, fetchImpl, reservationId, timeoutMs });
  await store.attachSession(reservationId, session.id);
  return session;
}
