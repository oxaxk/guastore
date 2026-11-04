/** Shared local catalogue / Germany shipping policy. Amounts are calculated in cents. */
export const STEEL_PRICE_CENTS = 699;
export const JADE_PRICE_CENTS = 599;
export const SHIPPING_DE_CENTS = 199;
export const FREE_SHIPPING_STONE_COUNT = 2;
export const SHIPPING_DE_COPY = '1,99 € Versand in Deutschland · ab 2 Steinen versandkostenfrei';

export function isCatalogueStone(handle: string) {
  return handle === 'the-steel' || handle === 'the-jade';
}

export function cataloguePrice(handle: string, fallback: number) {
  if (handle === 'the-steel') return STEEL_PRICE_CENTS / 100;
  if (handle === 'the-jade') return JADE_PRICE_CENTS / 100;
  return fallback;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function calculateCart(items: ReadonlyArray<{ handle: string; price: number; quantity: number }>) {
  let subtotalCents = 0;
  let stoneCount = 0;
  for (const item of items) {
    const price = cataloguePrice(item.handle, item.price);
    const quantity = Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20 && Number.isFinite(price) && price >= 0 && price <= 10000 ? item.quantity : 0;
    subtotalCents += Math.round(price * 100) * quantity || 0;
    if (isCatalogueStone(item.handle)) stoneCount += quantity;
  }
  const shippingCents = stoneCount > 0 && stoneCount < FREE_SHIPPING_STONE_COUNT ? SHIPPING_DE_CENTS : 0;
  return { subtotal: subtotalCents / 100, shipping: shippingCents / 100, total: (subtotalCents + shippingCents) / 100, stoneCount };
}
