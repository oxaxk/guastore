import './CartDrawer.css';
import { useCart } from '@/context/CartContext';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleCheckout = () => {
    window.location.href = '/shop';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`cart-backdrop ${isOpen ? 'cart-backdrop--open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside 
        className={`cart-drawer ${isOpen ? 'cart-drawer--open' : ''}`}
        aria-label="Warenkorb"
        role="dialog"
        aria-modal="true"
      >
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Warenkorb</h2>
          <button 
            className="cart-drawer__close"
            onClick={closeCart}
            aria-label="Warenkorb schließen"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <p>Dein Warenkorb ist leer</p>
            <Link to="/shop" className="btn btn--primary" onClick={closeCart}>
              Shop entdecken
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map(item => (
                <div key={item.variantId} className="cart-item">
                  <Link 
                    to={`/shop/product/${item.handle}`} 
                    className="cart-item__image"
                    onClick={closeCart}
                  >
                    <img src={item.image} alt={item.title} />
                  </Link>
                  <div className="cart-item__details">
                    <Link 
                      to={`/shop/product/${item.handle}`}
                      className="cart-item__title"
                      onClick={closeCart}
                    >
                      {item.title}
                    </Link>
                    {item.variantTitle !== 'Default Title' && (
                      <p className="cart-item__variant">{item.variantTitle}</p>
                    )}
                    <p className="cart-item__price">{formatPrice(item.price)}</p>
                    <div className="cart-item__actions">
                      <div className="cart-item__quantity">
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          aria-label="Menge verringern"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          aria-label="Menge erhöhen"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="cart-item__remove"
                        onClick={() => removeItem(item.variantId)}
                        aria-label="Artikel entfernen"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer__footer">
              <div className="cart-drawer__subtotal">
                <span>Zwischensumme</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="cart-drawer__note">
                Versandkosten und Steuern werden an der Kasse berechnet.
              </p>
              <button 
                className="btn btn--primary btn--full btn--lg"
                onClick={handleCheckout}
              >
                Zur Kasse
              </button>
              <button 
                className="btn btn--ghost btn--full"
                onClick={closeCart}
              >
                Weiter einkaufen
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
