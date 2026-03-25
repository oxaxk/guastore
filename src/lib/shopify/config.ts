// Shopify Storefront API Configuration
// Set these in your environment variables

export const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN || 'your-store.myshopify.com';
export const SHOPIFY_STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '';

export const SHOPIFY_API_VERSION = '2024-01';

export const getStorefrontApiUrl = () => 
  `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

export const getStorefrontHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
});

// Check if Shopify is properly configured
export const isShopifyConfigured = () => 
  SHOPIFY_STOREFRONT_TOKEN !== '' && 
  SHOPIFY_DOMAIN !== 'your-store.myshopify.com';
