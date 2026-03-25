import { getStorefrontApiUrl, getStorefrontHeaders, isShopifyConfigured } from './config';
import {
  GET_ALL_PRODUCTS,
  GET_PRODUCT_BY_HANDLE,
  GET_COLLECTION_BY_HANDLE,
  GET_ALL_COLLECTIONS,
  CREATE_CHECKOUT,
} from './queries';
import type { Product, Collection, ProductVariant, ShopifyProduct, ShopifyCollection } from '@/types/shopify';

// Transform Shopify product to simplified format
function transformProduct(product: ShopifyProduct): Product {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    price: parseFloat(product.priceRange.minVariantPrice.amount),
    compareAtPrice: product.compareAtPriceRange?.minVariantPrice?.amount
      ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
      : undefined,
    currency: product.priceRange.minVariantPrice.currencyCode,
    image: product.featuredImage?.url || '/placeholder.svg',
    images: product.images.edges.map(edge => edge.node.url),
    variants: product.variants.edges.map(edge => ({
      id: edge.node.id,
      title: edge.node.title,
      price: parseFloat(edge.node.price.amount),
      compareAtPrice: edge.node.compareAtPrice
        ? parseFloat(edge.node.compareAtPrice.amount)
        : undefined,
      availableForSale: edge.node.availableForSale,
      options: edge.node.selectedOptions,
      image: edge.node.image?.url,
    })),
    options: product.options,
    tags: product.tags,
    vendor: product.vendor,
    availableForSale: product.availableForSale,
  };
}

function transformCollection(collection: ShopifyCollection): Collection {
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    image: collection.image?.url,
  };
}

// Storefront API fetch helper
async function storefrontFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new Error('Shopify is not configured. Please set VITE_SHOPIFY_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN.');
  }

  const response = await fetch(getStorefrontApiUrl(), {
    method: 'POST',
    headers: getStorefrontHeaders(),
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(', '));
  }

  return json.data;
}

// API Functions
export async function getAllProducts(first = 20): Promise<Product[]> {
  const data = await storefrontFetch<{
    products: { edges: { node: ShopifyProduct }[] };
  }>(GET_ALL_PRODUCTS, { first });

  return data.products.edges.map(edge => transformProduct(edge.node));
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const data = await storefrontFetch<{
    productByHandle: ShopifyProduct | null;
  }>(GET_PRODUCT_BY_HANDLE, { handle });

  return data.productByHandle ? transformProduct(data.productByHandle) : null;
}

export async function getCollectionByHandle(handle: string, first = 20): Promise<{
  collection: Collection;
  products: Product[];
} | null> {
  const data = await storefrontFetch<{
    collectionByHandle: ShopifyCollection | null;
  }>(GET_COLLECTION_BY_HANDLE, { handle, first });

  if (!data.collectionByHandle) return null;

  return {
    collection: transformCollection(data.collectionByHandle),
    products: data.collectionByHandle.products.edges.map(edge => transformProduct(edge.node)),
  };
}

export async function getAllCollections(first = 20): Promise<Collection[]> {
  const data = await storefrontFetch<{
    collections: { edges: { node: ShopifyCollection }[] };
  }>(GET_ALL_COLLECTIONS, { first });

  return data.collections.edges.map(edge => transformCollection(edge.node));
}

export async function createCheckout(lineItems: { variantId: string; quantity: number }[]): Promise<string> {
  const data = await storefrontFetch<{
    checkoutCreate: {
      checkout: { id: string; webUrl: string };
      checkoutUserErrors: { message: string }[];
    };
  }>(CREATE_CHECKOUT, {
    input: { lineItems },
  });

  if (data.checkoutCreate.checkoutUserErrors.length > 0) {
    throw new Error(data.checkoutCreate.checkoutUserErrors.map(e => e.message).join(', '));
  }

  return data.checkoutCreate.checkout.webUrl;
}

// Re-export types
export type { Product, Collection, ProductVariant };
