import './ProductCard.css';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types/shopify';
import { cataloguePrice, formatPrice, isCatalogueStone } from '@/lib/commerce';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const price = cataloguePrice(product.handle, product.price);
  const isOnSale = !isCatalogueStone(product.handle) && product.compareAtPrice && product.compareAtPrice > price;
  const discount = isOnSale 
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0;

  const isNew = product.tags?.includes('new');
  const isDigital = product.tags?.includes('ebook');

  const p: any = product as any;
  const isSoldOut =
    Boolean(p?.soldOut) ||
    Boolean(p?.isSoldOut) ||
    Boolean(p?.availableForSale === false) ||
    Number(p?.quantityAvailable ?? p?.inventoryQuantity ?? 1) <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSoldOut) return;
    const variant = product.variants[0];
    addItem({
      id: product.id,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      price,
      compareAtPrice: isOnSale ? product.compareAtPrice : undefined,
      image: product.image,
      handle: product.handle,
    });
  };

  return (
    <article className="product-card">
      <Link to={`/shop/${product.handle}`} className="product-card__link">
        <div className="product-card__image-wrapper">
          <img 
            src={product.image} 
            alt={product.title}
            className="product-card__image"
            loading="lazy"
          />
          {isOnSale && (
            <span className="badge badge--sale product-card__badge">
              -{discount}%
            </span>
          )}
          {!isOnSale && isNew && (
            <span className="badge badge--new product-card__badge">
              Neu
            </span>
          )}
          {isDigital && (
            <span className="badge badge--digital product-card__badge product-card__badge--secondary">
              Digital
            </span>
          )}
        </div>
        
        <div className="product-card__content">
          <h3 className="product-card__title">{product.title}</h3>
          <p className="product-card__description">
            {product.description.length > 80 ? `${product.description.slice(0, 80)}...` : product.description}
          </p>
          <div className="product-card__price">
            <span className="product-card__price-current">
              {formatPrice(price)}
            </span>
            {isOnSale && (
              <span className="product-card__price-compare">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
        </div>
      </Link>
      
      <div className="product-card__actions">
        <button 
          className={`btn btn--primary btn--sm ${isSoldOut ? 'product-card__cta--soldout' : ''}`}
          onClick={handleAddToCart}
          disabled={isSoldOut}
          aria-disabled={isSoldOut}
        >
          {isSoldOut ? 'Ausverkauft' : 'In den Warenkorb'}
        </button>
        <Link 
          to={`/shop/${product.handle}`}
          className="btn btn--secondary btn--sm"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
