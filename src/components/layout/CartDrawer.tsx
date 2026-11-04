import './CartDrawer.css';
import { useCart } from '@/context/CartContext';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/commerce';
import { useEffect, useRef, useState } from 'react';
import { MAX_CART_QUANTITY } from '@/lib/cart-policy';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, shipping, total, stoneCount } = useCart();
  const drawerRef = useRef<HTMLElement>(null);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'loading' | 'error' | 'unavailable'>('idle');
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeCart(); }
      if (event.key !== 'Tab' || !drawer) return;
      const nodes = [...drawer.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [isOpen, closeCart]);
  const startCheckout = async () => {
    if (checkoutState === 'loading') return;
    setCheckoutState('loading');
    const checkoutItems = items
      .filter(item => item.handle === 'the-steel' || item.handle === 'the-jade')
      .map(item => ({ sku: item.handle, quantity: item.quantity }));
    try {
      const request = () => fetch('/api/checkout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: checkoutItems }),
      });
      let response = await request();
      if (response.status === 202) response = await request();
      const body = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (response.status === 503 && body?.error === 'NOT_CONFIGURED') {
        setCheckoutState('unavailable');
        return;
      }
      if (!response.ok || typeof body?.url !== 'string' || !body.url.startsWith('https://checkout.stripe.com/')) throw new Error('CHECKOUT_FAILED');
      window.location.assign(body.url);
    } catch {
      setCheckoutState('error');
    }
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
        ref={drawerRef}
        hidden={!isOpen}
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
                          aria-label={`Menge von ${item.title} verringern, aktuell ${item.quantity}`}
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= MAX_CART_QUANTITY}
                          aria-label={`Menge von ${item.title} erhöhen, aktuell ${item.quantity}`}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="cart-item__remove"
                        onClick={() => removeItem(item.variantId)}
                        aria-label={`${item.title} aus dem Warenkorb entfernen`}
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
              <div className="cart-drawer__shipping">
                <span>Versand (Deutschland)</span>
                <span>{shipping === 0 ? 'Kostenlos' : formatPrice(shipping)}</span>
              </div>
              <div className="cart-drawer__total" aria-live="polite">
                <span>Gesamtsumme</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <p className="cart-drawer__note">
                {stoneCount >= 2 ? 'Ab 2 Steinen ist dein Versand innerhalb Deutschlands kostenlos.' : 'Noch einen Stein hinzufügen und innerhalb Deutschlands Versandkosten sparen.'}
              </p>
              <button className="btn btn--primary btn--full btn--lg" type="button" onClick={startCheckout} disabled={checkoutState === 'loading' || checkoutState === 'unavailable'}>
                {checkoutState === 'loading' ? 'Sicherer Checkout wird geöffnet …' : checkoutState === 'unavailable' ? 'Checkout noch nicht freigeschaltet' : 'Sicher mit Stripe bezahlen'}
              </button>
              {checkoutState === 'error' && <p className="cart-drawer__error" role="alert">Checkout derzeit nicht erreichbar. Bitte versuche es gleich erneut.</p>}
              {checkoutState === 'unavailable' && <p className="cart-drawer__error" role="alert">Online-Zahlungen sind noch nicht freigeschaltet. Es wurde keine Bestellung angelegt.</p>}
              <p className="cart-drawer__note">Du wirst zum sicheren Stripe-Checkout weitergeleitet. Die Bestellung wird erst nach bestätigter Zahlung verarbeitet.</p>
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
