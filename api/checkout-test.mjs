import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { openTestStore } from '../server/test-store.mjs';
import { startTestCheckout } from '../server/checkout-orchestrator.mjs';
import { issueResumeToken, resumeTestCheckout } from '../server/checkout-resume.mjs';
import { validateCheckoutCart } from '../server/checkout-policy.mjs';
import { createTestStripeReader } from '../server/stripe-test-reader.mjs';

const COOKIE = '__Host-gua_test_checkout';
const TTL_SECONDS = 1800;
const MAX_BODY = 8192;
const sign = (payload, secret) => createHmac('sha256', secret).update(`gua-checkout-cookie-v1.${payload}`).digest();
function issueCookie(secret, now) {
  const payload = `${randomBytes(32).toString('base64url')}.${now + TTL_SECONDS}`;
  return `${payload}.${sign(payload, secret).toString('base64url')}`;
}
function verifyCookie(value, secret, now) {
  if (typeof value !== 'string' || value.length > 200) throw new Error('INVALID_COOKIE');
  const parts = value.split('.');
  if (parts.length !== 3 || !/^[A-Za-z0-9_-]{43}$/.test(parts[0]) || !/^\d{1,12}$/.test(parts[1]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[2])) throw new Error('INVALID_COOKIE');
  const expiry = Number(parts[1]);
  const supplied = Buffer.from(parts[2], 'base64url');
  const expected = sign(`${parts[0]}.${parts[1]}`, secret);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected) || expiry <= now || expiry > now + TTL_SECONDS) throw new Error('INVALID_COOKIE');
  return parts[0];
}
function getCookie(header) {
  const entries = (header || '').split(';').map(piece => piece.trim()).filter(piece => piece.startsWith(`${COOKIE}=`));
  if (entries.length > 1) throw new Error('INVALID_COOKIE');
  return entries.length ? entries[0].slice(COOKIE.length + 1) : null;
}
async function readJson(request) {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY)) throw new Error('INVALID_BODY');
  if (!request.body) throw new Error('INVALID_BODY');
  const reader = request.body.getReader();
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new Error('INVALID_BODY'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
}
function sameItems(left, right) {
  const normalize = items => items.map(({ sku, quantity }) => ({ sku, quantity })).sort((a, b) => a.sku.localeCompare(b.sku));
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

export async function receiveTestCheckout(request, { env = process.env, openStore = openTestStore, fetchImpl = fetch, timeoutMs = 5000, now = () => Math.floor(Date.now() / 1000), runtimeMode = 'test' } = {}) {
  const response = (status, body, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
  if (request.method !== 'POST') return response(405, { error: 'METHOD_NOT_ALLOWED' });
  let origin;
  try { const url = new URL(env.GUA_TEST_ORIGIN); if (url.protocol !== 'https:' || url.origin !== env.GUA_TEST_ORIGIN) throw new Error(); origin = url.origin; }
  catch { return response(503, { error: 'NOT_CONFIGURED' }); }
  const live = runtimeMode === 'live';
  if (env.GUA_TEST_MODE !== 'enabled' || (!live && env.VERCEL_ENV !== 'preview') || (live && env.VERCEL_ENV !== 'production') || !env.GUA_TEST_MONGO_URI || !/^acct_[A-Za-z0-9]+$/.test(env.GUA_TEST_STRIPE_ACCOUNT_ID || '') ||
      !(live ? /^(sk|rk)_live_[A-Za-z0-9]+$/ : /^(sk|rk)_test_[A-Za-z0-9]+$/).test(env.GUA_TEST_STRIPE_KEY || '') ||
      typeof env.GUA_TEST_COOKIE_SECRET !== 'string' || env.GUA_TEST_COOKIE_SECRET.length < 32) return response(503, { error: 'NOT_CONFIGURED' });
  if (request.headers.get('origin') !== origin || new URL(request.url).origin !== origin ||
      !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return response(403, { error: 'REQUEST_DENIED' });
  let body, cookie;
  try { body = await readJson(request); cookie = getCookie(request.headers.get('cookie')); }
  catch { return response(400, { error: 'INVALID_REQUEST' }); }
  let store;
  try {
    store = await openStore(env.GUA_TEST_MONGO_URI);
    if (!(await store.consumeCheckoutRate('global', null, now()))) return response(429, {error:'RATE_LIMITED'}, {'Retry-After':'60'});
  } catch { return response(503, {error:'RATE_LIMIT_UNAVAILABLE'}); }
  if (!cookie) {
    // First response establishes an HttpOnly retry identity before any stock is reserved.
    const token = issueCookie(env.GUA_TEST_COOKIE_SECRET, now());
    return response(202, { status: 'READY_TO_RETRY' }, { 'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${TTL_SECONDS}; Secure; HttpOnly; SameSite=Strict` });
  }
  let reservationId;
  try { reservationId = verifyCookie(cookie, env.GUA_TEST_COOKIE_SECRET, now()); }
  catch { return response(403, { error: 'INVALID_CHECKOUT_SESSION' }); }
  try {
    if (!(await store.consumeCheckoutRate('session', reservationId, now()))) return response(429, {error:'RATE_LIMITED'}, {'Retry-After':'900'});
  } catch { return response(503, {error:'RATE_LIMIT_UNAVAILABLE'}); }
  try {
    const stripe = createTestStripeReader({ secretKey:env.GUA_TEST_STRIPE_KEY, accountId:env.GUA_TEST_STRIPE_ACCOUNT_ID, fetchImpl, timeoutMs });
    await stripe.getStripeAccount();
    const previous = await store.getReservation(reservationId);
    if (previous?.stripeSessionId) {
      if (previous.status !== 'reserved') return response(409, { error: 'CHECKOUT_CLOSED' });
      const available = await store.available();
      for (const item of previous.items) available[item.sku] = (available[item.sku] || 0) + item.quantity;
      const cart = validateCheckoutCart(body, available);
      if (!sameItems(cart.items, previous.items) || cart.totalCents !== previous.totalCents) return response(409, { error: 'CART_CHANGED' });
      const token = issueResumeToken(reservationId, previous.stripeSessionId, env.GUA_TEST_COOKIE_SECRET);
      const session = await resumeTestCheckout(token, { secret: env.GUA_TEST_COOKIE_SECRET, store, retrieveSession: stripe.retrieveStripeSession });
      return response(200, { url: session.url });
    }
    const session = await startTestCheckout(body, { store, reservationId, origin, secretKey: env.GUA_TEST_STRIPE_KEY, fetchImpl, timeoutMs });
    return response(200, { url: session.url });
  } catch (error) {
    if (['INVALID_CART', 'OUT_OF_STOCK', 'RESERVATION_CONFLICT', 'RESERVATION_TERMINAL'].includes(error?.message)) return response(409, { error: 'CART_UNAVAILABLE' });
    // On unknown Stripe outcomes keep the reservation; retry uses the same cookie and idempotency key.
    return response(503, { error: 'RETRY_LATER' });
  }
}
export default { fetch(request) { return receiveTestCheckout(request); } };
