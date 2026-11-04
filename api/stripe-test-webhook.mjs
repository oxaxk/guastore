import { openTestStore } from '../server/test-store.mjs';
import { handleTestWebhook, verifyStripeEvent } from '../server/stripe-webhook-core.mjs';
import { processNextConfirmation } from '../server/confirmation-outbox.mjs';
import { createGmailTransport } from '../server/gmail-transport.mjs';

const MAX_BYTES = 262144;
async function readBounded(request) {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BYTES)) throw new Error('BODY_TOO_LARGE');
  if (!request.body) throw new Error('EMPTY_BODY');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}

export async function receiveTestWebhook(request, { env = process.env, openStore = openTestStore, createTransport = createGmailTransport, runtimeMode = 'test' } = {}) {
  const json = (status, error) => Response.json({ received: status === 200, ...(error ? { error } : {}) }, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return json(405, 'METHOD_NOT_ALLOWED');
  const live = runtimeMode === 'live';
  if (env.GUA_TEST_MODE !== 'enabled' || (!live && env.VERCEL_ENV === 'production') || (live && env.VERCEL_ENV !== 'production') || !env.GUA_TEST_MONGO_URI ||
      !env.GUA_TEST_STRIPE_WEBHOOK_SECRET || !env.GUA_TEST_STRIPE_ACCOUNT_ID?.startsWith('acct_')) return json(503, 'NOT_CONFIGURED');
  let raw;
  const signature = request.headers.get('stripe-signature');
  try {
    raw = await readBounded(request);
    const event = verifyStripeEvent(raw, signature, env.GUA_TEST_STRIPE_WEBHOOK_SECRET);
    if (event.livemode !== live || (event.account && event.account !== env.GUA_TEST_STRIPE_ACCOUNT_ID)) return json(400, 'INVALID_EVENT');
  } catch { return json(400, 'INVALID_EVENT'); }
  try {
    const store = await openStore(env.GUA_TEST_MONGO_URI);
    const result = await handleTestWebhook(raw, signature, { secret: env.GUA_TEST_STRIPE_WEBHOOK_SECRET, accountId: env.GUA_TEST_STRIPE_ACCOUNT_ID, store, livemode: live });
    if (result.status === 200) {
      const transport = await createTransport(env);
      if (transport.configured) await processNextConfirmation({ store, transport });
    }
    return json(result.status, result.status === 200 ? undefined : result.code);
  } catch { return json(503, 'RETRY_LATER'); }
}

export default { fetch(request) { return receiveTestWebhook(request); } };
