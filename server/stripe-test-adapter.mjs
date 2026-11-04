import { postTestSession } from './stripe-test-post.mjs';
export function checkoutSessionParams(cart, origin) {
  if (!origin || !/^https:\/\/[a-z0-9.-]+$/i.test(origin)) throw new Error('INVALID_ORIGIN');
  const params = new URLSearchParams({
    mode: 'payment',
    'shipping_address_collection[allowed_countries][0]': 'DE',
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    integration_identifier: 'gua_shop_checkout_xkqmdvpa',
  });
  cart.items.forEach((item, index) => {
    params.set(`line_items[${index}][price_data][currency]`, 'eur');
    params.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
    params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
    params.set(`line_items[${index}][quantity]`, String(item.quantity));
  });
  if (cart.shippingCents) {
    params.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    params.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(cart.shippingCents));
    params.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
    params.set('shipping_options[0][shipping_rate_data][display_name]', 'Versand Deutschland');
  } else {
    params.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    params.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '0');
    params.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
    params.set('shipping_options[0][shipping_rate_data][display_name]', 'Versandkostenfrei');
  }
  return params;
}

export async function createTestCheckoutSession(cart, { secretKey, origin, fetchImpl = fetch, reservationId, timeoutMs }) {
  if (typeof secretKey !== 'string' || !/^(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+$/.test(secretKey) || !/^[a-zA-Z0-9_-]{1,100}$/.test(reservationId || '')) throw new Error('TEST_CHECKOUT_NOT_CONFIGURED');
  const sessionPrefix = secretKey.includes('_live_') ? 'cs_live_' : 'cs_test_';
  const params = checkoutSessionParams(cart, origin);
  params.set('metadata[reservation_id]', reservationId);
  const session = await postTestSession({secretKey,body:params,idempotencyKey:`gua-checkout-${reservationId}`,fetchImpl,timeoutMs});
  if (typeof session?.id !== 'string' || !session.id.startsWith(sessionPrefix) ||
      typeof session.url !== 'string' || !session.url.startsWith('https://checkout.stripe.com/')) {
    throw new Error('INVALID_STRIPE_SESSION');
  }
  return { id: session.id, url: session.url };
}
