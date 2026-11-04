export const CATALOG = Object.freeze({
  'the-steel': Object.freeze({ name: 'The Steel', unitAmount: 1290, initialStock: 21 }),
  'the-jade': Object.freeze({ name: 'Xiu Jade', unitAmount: 990, initialStock: 80 }),
});

export function validateCheckoutCart(input, stock) {
  if (!stock || typeof stock !== 'object') throw new Error('STOCK_UNAVAILABLE');
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(key => key !== 'items') || !Array.isArray(input.items) ||
      input.items.length < 1 || input.items.length > 2) throw new Error('INVALID_CART');
  const quantities = Object.create(null);
  for (const item of input.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
        Object.keys(item).sort().join(',') !== 'quantity,sku' ||
        typeof item.sku !== 'string' || !Object.hasOwn(CATALOG, item.sku) ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
        Object.hasOwn(quantities, item.sku)) throw new Error('INVALID_CART');
    quantities[item.sku] = item.quantity;
  }
  const normalized = Object.entries(quantities).map(([sku, quantity]) => {
    const product = CATALOG[sku];
    if (quantity > product.initialStock) throw new Error('OUT_OF_STOCK');
    if (!Number.isSafeInteger(stock[sku]) || quantity > stock[sku]) throw new Error('OUT_OF_STOCK');
    return { sku, quantity, name: product.name, unitAmount: product.unitAmount };
  });
  const stoneCount = normalized.reduce((total, item) => total + item.quantity, 0);
  const subtotalCents = normalized.reduce((total, item) => total + item.unitAmount * item.quantity, 0);
  const shippingCents = stoneCount === 1 ? 199 : 0;
  return { items: normalized, stoneCount, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}
