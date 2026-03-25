// Shopify types for Storefront API

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyPrice {
  amount: string;
  currencyCode: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyPrice;
  compareAtPrice: ShopifyPrice | null;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  image: ShopifyImage | null;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: ShopifyPrice;
    maxVariantPrice: ShopifyPrice;
  };
  compareAtPriceRange: {
    minVariantPrice: ShopifyPrice;
    maxVariantPrice: ShopifyPrice;
  };
  featuredImage: ShopifyImage | null;
  images: {
    edges: { node: ShopifyImage }[];
  };
  variants: {
    edges: { node: ShopifyProductVariant }[];
  };
  options: {
    id: string;
    name: string;
    values: string[];
  }[];
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  products: {
    edges: { node: ShopifyProduct }[];
  };
}

export interface ShopifyCheckout {
  id: string;
  webUrl: string;
  lineItems: {
    edges: {
      node: {
        id: string;
        title: string;
        quantity: number;
        variant: ShopifyProductVariant;
      };
    }[];
  };
  subtotalPrice: ShopifyPrice;
  totalPrice: ShopifyPrice;
}

// Simplified product type for local use
export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  image?: string;
  images: string[];
  variants: ProductVariant[];
  options: ProductOption[];
  tags: string[];
  vendor: string;
  availableForSale: boolean;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  availableForSale: boolean;
  options: { name: string; value: string }[];
  image?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image?: string;
}
