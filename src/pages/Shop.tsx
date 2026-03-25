import './Shop.css';
import { useState } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { mockProducts, mockCollections } from '@/data/mockData';

export default function Shop() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const withCardOverrides = (product: any) => {
    const titleLc = String(product?.title ?? '').toLowerCase();
    const isSteel = titleLc.includes('edelstahl');
    const isJade = titleLc.includes('jade');
    const isRose = titleLc.includes('rosenquarz') || titleLc.includes('rose') || titleLc.includes('rosa');

    const imageOverride = isSteel
      ? '/img/guasteal.png'
      : isJade
        ? '/img/guagreen.png'
        : isRose
          ? '/img/guarosa.png'
          : undefined;

    const priceOverride = isSteel ? 11.95 : isJade ? 9.95 : isRose ? 11.95 : undefined;
    const compareAtOverride = isSteel ? 15.9 : isJade ? 12.9 : isRose ? 15.95 : undefined;

    if (!imageOverride && priceOverride == null && compareAtOverride == null && !isRose) return product;

    return {
      ...product,
      image: imageOverride ?? product.image,
      images: imageOverride ? [imageOverride] : product.images,
      price: priceOverride ?? product.price,
      compareAtPrice: compareAtOverride ?? product.compareAtPrice,
      // mirror the Home behaviour: Rosenquarz is forced sold out
      availableForSale: isRose ? false : product.availableForSale,
      soldOut: isRose ? true : product.soldOut,
      isSoldOut: isRose ? true : product.isSoldOut,
      quantityAvailable: isRose ? 0 : product.quantityAvailable,
      inventoryQuantity: isRose ? 0 : product.inventoryQuantity,
    };
  };

  const isEbookProduct = (p: any) => {
    const t = String(p?.title ?? '').toLowerCase();
    const h = String(p?.handle ?? '').toLowerCase();
    return (
      Boolean(p?.tags?.includes('ebook')) ||
      t.includes('ebook') ||
      t.includes('e-book') ||
      t.includes('massage guide') ||
      t.includes('guide') ||
      h.includes('ebook') ||
      h.includes('e-book')
    );
  };

  const baseProducts = (activeFilter === 'all'
    ? mockProducts
    : mockProducts.filter((p: any) => p.tags.includes(activeFilter))
  ).filter((p: any) => !isEbookProduct(p));

  const productsWithOverrides = baseProducts.map(withCardOverrides);

  const filteredProducts = (() => {
    if (sortBy === 'price-asc') {
      return [...productsWithOverrides].sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
    }
    if (sortBy === 'price-desc') {
      return [...productsWithOverrides].sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0));
    }
    if (sortBy === 'new') {
      return [...productsWithOverrides].sort((a: any, b: any) => {
        const aNew = Boolean(a.tags?.includes('new'));
        const bNew = Boolean(b.tags?.includes('new'));
        return Number(bNew) - Number(aNew);
      });
    }
    // popular = keep incoming order
    return productsWithOverrides;
  })();

  return (
    <div className="shop-page">
      <div className="container">
        <div className="shop-page__header">
          <h1>Shop</h1>
          <p>Entdecke unsere hochwertigen Gua Sha Tools und Selfcare Produkte</p>
        </div>

        <div className="shop-page__filters">
          <div className="shop-page__chips">
            <button className={`chip ${activeFilter === 'all' ? 'chip--active' : ''}`} onClick={() => setActiveFilter('all')}>Alle</button>
            {mockCollections.map(c => (
              <button key={c.handle} className={`chip ${activeFilter === c.handle ? 'chip--active' : ''}`} onClick={() => setActiveFilter(c.handle)}>{c.title}</button>
            ))}
          </div>
          <select className="input shop-page__sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="popular">Beliebtheit</option>
            <option value="new">Neueste</option>
            <option value="price-asc">Preis aufsteigend</option>
            <option value="price-desc">Preis absteigend</option>
          </select>
        </div>

        <div className="shop-page__grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
