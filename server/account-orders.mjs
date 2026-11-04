// Server-only read boundary. auth.authenticate must verify the actual request using
// the configured identity provider; no principal is ever accepted from the client.
export async function listCustomerOrders(request, { auth, orders, now = () => Date.now() } = {}) {
  if (!auth || typeof auth.authenticate !== 'function' || !orders || typeof orders.findByOwner !== 'function') {
    return { status: 503, body: { error: 'ACCOUNT_UNAVAILABLE' } };
  }
  let session;
  try { session = await auth.authenticate(request); } catch { return { status: 401, body: { error: 'UNAUTHENTICATED' } }; }
  if (!session || session.verified !== true || typeof session.subject !== 'string' || !session.subject ||
      !Number.isFinite(session.expiresAt) || session.expiresAt <= now()) {
    return { status: 401, body: { error: 'UNAUTHENTICATED' } };
  }
  try {
    const records = await orders.findByOwner(session.subject);
    if (!Array.isArray(records) || records.some(order => order.ownerId !== session.subject)) {
      return { status: 503, body: { error: 'ORDERS_UNAVAILABLE' } };
    }
    return { status: 200, body: { orders: records.map(({ id, createdAt, status, totalCents, currency }) => ({ id, createdAt, status, totalCents, currency })) } };
  } catch { return { status: 503, body: { error: 'ORDERS_UNAVAILABLE' } }; }
}
