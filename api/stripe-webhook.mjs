import { receiveTestWebhook } from './stripe-test-webhook.mjs';
import { openMongoStore } from '../server/test-store.mjs';

function normalizedEnv(env) {
  const mode = env.GUA_MODE === 'live' ? 'live' : env.GUA_MODE === 'test' ? 'test' : null;
  const allowedEnvironment = mode === 'live' ? env.VERCEL_ENV === 'production' : env.VERCEL_ENV === 'preview';
  if (!mode || !allowedEnvironment) return { GUA_TEST_MODE: 'disabled', VERCEL_ENV: env.VERCEL_ENV };
  return {
    ...env,
    GUA_TEST_MODE: 'enabled',
    GUA_TEST_MONGO_URI: env.GUA_MONGO_URI,
    GUA_TEST_STRIPE_WEBHOOK_SECRET: env.GUA_STRIPE_WEBHOOK_SECRET,
    GUA_TEST_STRIPE_ACCOUNT_ID: env.GUA_STRIPE_ACCOUNT_ID,
    VERCEL_ENV: mode === 'test' ? 'preview' : 'production',
    GUA_RUNTIME_MODE: mode,
  };
}

export function receiveStripeWebhook(request, deps = {}) {
  const source = deps.env || process.env;
  const env = normalizedEnv(source);
  const runtimeMode = env.GUA_RUNTIME_MODE || 'test';
  const openStore = deps.openStore || ((uri) => openMongoStore(uri, runtimeMode === 'live' ? 'gua_shop' : 'gua_shop_test'));
  return receiveTestWebhook(request, { ...deps, env, openStore, runtimeMode });
}

export default { fetch(request) { return receiveStripeWebhook(request); } };
