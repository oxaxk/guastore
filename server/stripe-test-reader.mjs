import { reconcileTestReservation } from './checkout-reconciliation.mjs';

const MAX_BYTES = 262144;
const STRIPE_ORIGIN = 'https://api.stripe.com';

// Private server-side adapter. No endpoint, scheduler, credentials or provider calls are created here.
export function createTestStripeReader({ secretKey, accountId, fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  if (!/^(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+$/.test(secretKey || '') || !/^acct_[A-Za-z0-9]+$/.test(accountId || '') ||
      typeof fetchImpl !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000) throw new Error('TEST_READER_NOT_CONFIGURED');
  const sessionPrefix = secretKey.includes('_live_') ? 'cs_live_' : 'cs_test_';

  async function get(path) {
    const controller = new AbortController();
    let timer;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetchImpl(`${STRIPE_ORIGIN}${path}`, { method:'GET', redirect:'error', headers:{ Authorization:`Bearer ${secretKey}`, Accept:'application/json' }, signal:controller.signal });
          if (!response.ok) throw new Error('STRIPE_READ_FAILED');
          const length = response.headers.get('content-length');
          if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) throw new Error('STRIPE_READ_FAILED');
          if (!response.body) throw new Error('STRIPE_READ_FAILED');
          const reader = response.body.getReader(); let size = 0; const chunks = [];
          try {
            for (;;) {
              const { done, value } = await reader.read(); if (done) break;
              size += value.byteLength; if (size > MAX_BYTES) { await reader.cancel(); throw new Error('STRIPE_READ_FAILED'); }
              chunks.push(Buffer.from(value));
            }
          } finally { reader.releaseLock(); }
          let body; try { body=JSON.parse(Buffer.concat(chunks,size).toString('utf8')); } catch { throw new Error('STRIPE_READ_FAILED'); }
          if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('STRIPE_READ_FAILED');
          return body;
        })(),
        new Promise((_,reject)=>{ timer=setTimeout(()=>{ controller.abort(); reject(new Error('STRIPE_READ_TIMEOUT')); },timeoutMs); }),
      ]);
    } catch (error) {
      if (error?.message === 'STRIPE_READ_TIMEOUT') throw error;
      throw new Error('STRIPE_READ_FAILED');
    } finally { clearTimeout(timer); controller.abort(); }
  }

  return {
    async getStripeAccount() {
      const account = await get('/v1/account');
      if (account.id !== accountId) throw new Error('WRONG_STRIPE_ACCOUNT');
      return { id:account.id };
    },
    async retrieveStripeSession(sessionId) {
      if (typeof sessionId !== 'string' || !sessionId.startsWith(sessionPrefix) || !/^cs_(?:test|live)_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error('INVALID_TEST_SESSION');
      return get(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
    },
  };
}

// An authenticated caller must supply a validated reservation ID and isolated test store.
export async function reconcileWithTestStripe(reservationId, { store, secretKey, accountId, fetchImpl, timeoutMs } = {}) {
  const reader = createTestStripeReader({ secretKey, accountId, fetchImpl, timeoutMs });
  return reconcileTestReservation(reservationId, { store, accountId, ...reader });
}
