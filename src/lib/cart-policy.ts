import { mockProducts } from '../data/mockData';
import type { Product } from '../types/shopify';
import { cataloguePrice, isCatalogueStone } from './commerce';

export const MAX_CART_QUANTITY = 20;
export const MAX_CART_LINES = 20;
export const MAX_CART_STORAGE_BYTES = 20000;
export interface SafeCartItem {
  id: string; variantId: string; title: string; variantTitle: string;
  price: number; compareAtPrice?: number; quantity: number; image: string; handle: string;
}

export function normalizeCartEntry(input: unknown, catalogue: readonly Product[] = mockProducts): SafeCartItem | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const item = input as Record<string, unknown>;
  for (const name of ['id', 'variantId', 'title', 'variantTitle', 'image', 'handle']) {
    if (typeof item[name] !== 'string' || (item[name] as string).length > 512) return null;
  }
  if (!Number.isSafeInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > MAX_CART_QUANTITY) return null;
  if (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0 || item.price > 10000) return null;
  const product = catalogue.find(p => p.handle === item.handle && p.id === item.id && p.availableForSale);
  const variant = product?.variants.find(v => v.id === item.variantId && v.availableForSale);
  if (!product || !variant) return null;
  const price = cataloguePrice(product.handle, variant.price);
  if (!Number.isFinite(price) || price < 0 || price > 10000) return null;
  // Browser storage is untrusted: never render its title, price or image URL.
  return { id: product.id, variantId: variant.id, title: product.title, variantTitle: variant.title,
    price, compareAtPrice: isCatalogueStone(product.handle) ? undefined : variant.compareAtPrice,
    quantity: Number(item.quantity), image: variant.image || product.image || '/placeholder.svg', handle: product.handle };
}

export function normalizeCart(input: unknown, catalogue: readonly Product[] = mockProducts): SafeCartItem[] {
  if (!Array.isArray(input) || input.length > MAX_CART_LINES) return [];
  const items: SafeCartItem[] = [];
  for (const raw of input) {
    const item = normalizeCartEntry(raw, catalogue); if (!item) continue;
    const existing = items.find(i => i.variantId === item.variantId);
    if (existing) existing.quantity = Math.min(MAX_CART_QUANTITY, existing.quantity + item.quantity);
    else items.push(item);
  }
  return items;
}

export function parseStoredCart(stored: string | null): SafeCartItem[] {
  if (!stored || new TextEncoder().encode(stored).length > MAX_CART_STORAGE_BYTES) return [];
  try { return normalizeCart(JSON.parse(stored)); } catch { return []; }
}
