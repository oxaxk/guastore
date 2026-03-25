import type { Product, Collection } from '@/types/shopify';

// Mock product images (using placeholder)
const placeholderImage = 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=600&h=600&fit=crop';
const placeholderImage2 = 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=600&fit=crop';
const placeholderImage3 = 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop';
const placeholderImage4 = 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=600&fit=crop';

export const mockProducts: Product[] = [
  {
    id: 'gid://shopify/Product/1',
    handle: 'the-steel',
    title: 'The Steel',
    description:
      'Kuratierter Gua Sha aus poliertem, massivem Edelstahl – kühl auf der Haut, präzise in der Anwendung und ideal für definierte Konturen, klare Linien und ein modernes, minimalistisches Ritual.',
    price: 44.9,
    currency: 'EUR',
    image: placeholderImage,
    images: [placeholderImage, placeholderImage2],
    variants: [
      {
        id: 'gid://shopify/ProductVariant/1',
        title: 'Standard',
        price: 44.9,
        availableForSale: true,
        options: [{ name: 'Size', value: 'Standard' }],
      },
    ],
    options: [{ id: '1', name: 'Size', values: ['Standard'] }],
    tags: ['bestseller', 'gua-sha', 'the-steel'],
    vendor: 'GUA SHOP',
    availableForSale: true,
  },
  {
    id: 'gid://shopify/Product/2',
    handle: 'the-jade',
    title: 'The Jade',
    description:
      'Klassischer Jade Gua Sha mit sanft kühlendem Hautgefühl – ideal für ruhige Abendroutinen, empfindlichere Hauttypen und alle, die ein weicheres, traditionelleres Ritual bevorzugen.',
    price: 34.9,
    currency: 'EUR',
    image: placeholderImage2,
    images: [placeholderImage2, placeholderImage],
    variants: [
      {
        id: 'gid://shopify/ProductVariant/2',
        title: 'Standard',
        price: 34.9,
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
    title: 'The Rose (Coming Soon)',
    description:
      'The Rose erweitert die Kollektion als kommende Preview – ein kuratiertes Rosenquarz-Tool für sanfte Routinen, ruhige Facial Massage und ein weiches, bewusstes Ritual. Bald verfügbar.',
    price: 39.9,
    compareAtPrice: 49.9,
    currency: 'EUR',
    image: placeholderImage4,
    images: [placeholderImage4, placeholderImage3],
    variants: [
      {
        id: 'gid://shopify/ProductVariant/3',
        title: 'Standard',
        price: 39.9,
        compareAtPrice: 49.9,
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
    description: 'Kuratierte Gua Sha Tools mit klarer Materialwahl, eigenem Hautgefühl und bewusstem Ritual-Fokus – mit The Steel, The Jade und The Rose als kommende Preview.',
    image: placeholderImage,
  },
  {
    id: 'gid://shopify/Collection/3',
    handle: 'bestseller',
    title: 'Bestseller',
    description: 'Produkte mit klarem Einstieg in die Welt von GUA SHOP – bewusst kuratiert, reduziert und stark für moderne Selfcare-Routinen.',
    image: placeholderImage2,
  },
];

export const getProductsByCollection = (collectionHandle: string): Product[] => {
  const tagMap: Record<string, string[]> = {
    'gua-sha': ['gua-sha'],
    bestseller: ['bestseller'],
  };
  
  const tags = tagMap[collectionHandle] || [];
  if (tags.length === 0) return mockProducts;
  
  return mockProducts.filter(product => 
    product.tags.some(tag => tags.includes(tag))
  );
};
