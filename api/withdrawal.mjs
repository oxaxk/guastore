import { randomUUID } from 'node:crypto';
import { openMongoStore } from '../server/test-store.mjs';
import { createGmailTransport } from '../server/gmail-transport.mjs';

const MAX_BYTES = 8192;
const EMAIL = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;
const REFERENCE = /^cs_(?:test|live)_[A-Za-z0-9_]+$/;

function json(status, body) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function readJson(request) {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BYTES)) throw new Error('INVALID_BODY');
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BYTES) throw new Error('INVALID_BODY');
  return JSON.parse(raw);
}

export async function receiveWithdrawal(request, {
  env = process.env,
  openStore = (uri, database) => openMongoStore(uri, database),
  createTransport = createGmailTransport,
  now = () => new Date(),
  id = () => randomUUID(),
} = {}) {
  if (request.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });
  const mode = env.GUA_MODE === 'live' ? 'live' : env.GUA_MODE === 'test' ? 'test' : null;
  const allowed = mode === 'live' ? env.VERCEL_ENV === 'production' : env.VERCEL_ENV === 'preview';
  if (!mode || !allowed || !env.GUA_MONGO_URI || !env.GUA_ORIGIN) return json(503, { error: 'NOT_CONFIGURED' });
  let origin;
  try { origin = new URL(env.GUA_ORIGIN).origin; } catch { return json(503, { error: 'NOT_CONFIGURED' }); }
  if (request.headers.get('origin') !== origin || request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return json(403, { error: 'FORBIDDEN' });
  }
  let body;
  try { body = await readJson(request); } catch { return json(400, { error: 'INVALID_REQUEST' }); }
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const orderReference = typeof body?.orderReference === 'string' ? body.orderReference.trim() : '';
  if (name.length < 2 || name.length > 120 || !EMAIL.test(email) || !REFERENCE.test(orderReference)) {
    return json(400, { error: 'INVALID_REQUEST' });
  }
  if ((mode === 'live') !== orderReference.startsWith('cs_live_')) return json(400, { error: 'INVALID_REQUEST' });
  try {
    const store = await openStore(env.GUA_MONGO_URI, mode === 'live' ? 'gua_shop' : 'gua_shop_test');
    if (!(await store.authorizeWithdrawal(orderReference, email))) return json(404, { error: 'ORDER_NOT_FOUND' });
    const receivedAt = now();
    const withdrawalId = id();
    await store.recordWithdrawal(withdrawalId, { name, email, orderReference, receivedAt });
    const transport = await createTransport(env);
    if (!transport.configured) {
      await store.settleWithdrawal(withdrawalId, 'confirmation_pending');
      return json(503, { received: true, confirmation: 'pending' });
    }
    const timestamp = receivedAt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'long' });
    const subject = `Eingangsbestätigung Widerruf ${orderReference}`;
    const text = `Hallo ${name},\n\nwir bestätigen den Eingang deines Widerrufs.\n\nBestellreferenz: ${orderReference}\nEingang: ${timestamp}\n\nGUA SHOP`;
    const sent = await transport.send({ to: email, subject, text, html: `<p>Hallo ${name.replace(/[<>&]/g, '')},</p><p>wir bestätigen den Eingang deines Widerrufs.</p><p><strong>Bestellreferenz:</strong> ${orderReference}<br><strong>Eingang:</strong> ${timestamp}</p><p>GUA SHOP</p>` });
    if (sent.status !== 'sent') {
      await store.settleWithdrawal(withdrawalId, 'confirmation_pending');
      return json(503, { received: true, confirmation: 'pending' });
    }
    await store.settleWithdrawal(withdrawalId, 'confirmed', { confirmedAt: now() });
    return json(201, { received: true, confirmed: true, receivedAt: receivedAt.toISOString() });
  } catch {
    return json(503, { error: 'RETRY_LATER' });
  }
}

export default { fetch(request) { return receiveWithdrawal(request); } };
