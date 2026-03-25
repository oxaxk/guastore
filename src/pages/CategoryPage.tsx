import './Shop.css';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '@/components/shop/ProductCard';
import { mockCollections, getProductsByCollection } from '@/data/mockData';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const collection = mockCollections.find(c => c.handle === slug);
  const products = getProductsByCollection(slug || '');

  return (
    <div className="shop-page">
      <div className="container">
        <div className="shop-page__header">
          <h1>{collection?.title || 'Kategorie'}</h1>
          <p>{collection?.description || 'Kuratierte GUA SHOP Produkte in dieser Kategorie.'}</p>
        </div>
        {products.length > 0 ? (
          <div className="shop-page__grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="coming-soon">
            <h2>Aktuell keine Produkte</h2>
            <p>
              Diese Kategorie wird gerade kuratiert. Entdecke bis dahin unsere aktuellen GUA SHOP Essentials.
            </p>
            <Link to="/shop" className="btn btn--primary">Zum Shop</Link>
          </div>
        )}
      </div>
    </div>
  );
}