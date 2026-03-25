import './Header.css';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/compare', label: 'Compare' },
  { path: '/how-to', label: 'How To' },
  { path: '/faq', label: 'FAQ' },
  { path: '/club', label: 'Club' },
  { path: '/about', label: 'About' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="header__container">
        <div className="header__center">
          <Link to="/" className="header__logo">
            <img
              src="/img/guablack.png"
              alt="GUA SHOP Logo"
              className="header__logo-main header__logo-image"
            />
            <span className="header__logo-subtitle">Premium Gua Sha Tools</span>
          </Link>
        </div>

        <div className="header__actions">
          <button
            className="header__cart-btn"
            onClick={openCart}
            aria-label={`Warenkorb mit ${itemCount} Artikeln`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {itemCount > 0 && (
              <span className="header__cart-badge">{itemCount}</span>
            )}
          </button>

          <button
            type="button"
            className="header__search-btn"
            aria-label="Produkte suchen"
            onClick={() => {
              navigate('/shop?search=1');
              window.dispatchEvent(new CustomEvent('shop:openSearch'));
            }}
          >
            <svg className="header__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <button
            className="header__menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menü öffnen"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`header__menu-icon ${isMobileMenuOpen ? 'header__menu-icon--open' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`header__mobile-overlay ${isMobileMenuOpen ? 'header__mobile-overlay--open' : ''}`}>
        <nav className="header__mobile-nav">
          {navLinks.map((link, index) => (
            <Link
              key={link.path}
              to={link.path}
              className="header__mobile-link"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
