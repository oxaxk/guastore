import type { Product, Collection } from '@/types/shopify';
import { JADE_PRICE_CENTS, STEEL_PRICE_CENTS } from '@/lib/commerce';

// Mock product images (using placeholder)
const placeholderImage = 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=600&h=600&fit=crop';
const placeholderImage3 = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop';
const placeholderImage4 = 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=600&fit=crop';

export const mockProducts: Product[] = [
  {
    id: 'gid://shopify/Product/1',
    handle: 'the-steel',
    title: 'The Steel',
    description:
      'Spiegelpolierter Edelstahl, weich gerundete Kanten und eine sanft gewölbte, asymmetrische Form. Für kontrollierte Bewegungen in deiner täglichen Gesichtspflege.',
    price: STEEL_PRICE_CENTS / 100,
    currency: 'EUR',
    image: '/img/steel/the-steel-matched-v3.png',
    images: ['/img/steel/the-steel-studio.webp', '/img/steel/the-steel-rounded-edge.webp'],
    variants: [
      {
        id: 'gid://shopify/ProductVariant/1',
        title: 'Standard',
        price: STEEL_PRICE_CENTS / 100,
        availableForSale: true,
        options: [{ name: 'Size', value: 'Standard' }],
      },
    ],
    options: [{ id: '1', name: 'Size', values: ['Standard'] }],
    tags: ['gua-sha', 'the-steel'],
    vendor: 'GUA SHOP',
    availableForSale: true,
  },
  {
    id: 'gid://shopify/Product/2',
    handle: 'the-jade',
    title: 'Xiu Jade',
    description:
      'Xiu Jade Gua Sha mit sanft kühlendem Hautgefühl – für ruhige Abendroutinen und ein bewusstes, traditionelles Ritual.',
    price: JADE_PRICE_CENTS / 100,
    currency: 'EUR',
    image: '/img/guagreen.png',
    images: ['/img/guagreen.png'],
    variants: [
      {
        id: 'gid://shopify/ProductVariant/2',
        title: 'Standard',
        price: JADE_PRICE_CENTS / 100,
        availableForSale: true,
        options: [{ name: 'Size', value: 'Standard' }],
      },
    ],
    options: [{ id: '2', name: 'Size', values: ['Standard'] }],
    tags: ['gua-sha', 'the-jade'],
    vendor: 'GUA SHOP',
    availableForSale: true,
  },
  {
    id: 'gid://shopify/Product/3',
    handle: 'the-rose',
    title: 'The Rose',
    description:
      'The Rose ist derzeit ausverkauft.',
    price: 39.9,
    currency: 'EUR',
    image: placeholderImage4,
    images: [placeholderImage4, placeholderImage3],
    variants: [
      {
        id: 'gid://shopify/ProductVariant/3',
        title: 'Standard',
        price: 39.9,
        availableForSale: false,
        options: [{ name: 'Size', value: 'Standard' }],
      },
    ],
    options: [{ id: '3', name: 'Size', values: ['Standard'] }],
    tags: ['gua-sha', 'coming-soon', 'the-rose'],
    vendor: 'GUA SHOP',
    availableForSale: false,
  },
];

export const mockCollections: Collection[] = [
  {
    id: 'gid://shopify/Collection/1',
    handle: 'gua-sha',
    title: 'Gua Sha',
    description: 'Kuratierte Gua Sha Tools mit klarer Materialwahl, eigenem Hautgefühl und bewusstem Ritual-Fokus – mit The Steel, Xiu Jade und The Rose als kommende Preview.',
    image: placeholderImage,
  },
];

export const getProductsByCollection = (collectionHandle: string): Product[] => {
  const tagMap: Record<string, string[]> = {
    'gua-sha': ['gua-sha'],
  };
  
  const tags = tagMap[collectionHandle] || [];
  if (tags.length === 0) return [];
  
  return mockProducts.filter(product =>
    product.availableForSale && product.tags.some(tag => tags.includes(tag))
  );
};
