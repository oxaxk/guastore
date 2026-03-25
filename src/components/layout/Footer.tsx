import './Footer.css';
import { Link } from 'react-router-dom';

const shopLinks = [
  { path: '/shop/the-steel', label: 'The Steel' },
  { path: '/shop/the-jade', label: 'The Jade' },
  { path: '/shop/the-rose', label: 'The Rose (Soon)' },
];

const infoLinks = [
  { path: '/how-to', label: 'How To' },
  { path: '/compare', label: 'Compare' },
  { path: '/faq', label: 'FAQ' },
  { path: '/club', label: 'Club' },
  { path: '/about', label: 'About' },
];

const legalLinks = [
  { path: '/legal/impressum', label: 'Impressum' },
  { path: '/legal/datenschutz', label: 'Datenschutz' },
  { path: '/legal/agb', label: 'AGB' },
  { path: '/legal/widerruf', label: 'Widerrufsrecht' },
  { path: '/legal/versand', label: 'Versand' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__main">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <img
                src="/img/guawhite.png"
                alt="GUA SHOP Logo"
                className="footer__logo-image"
              />
            </Link>
            <p className="footer__tagline">
              Premium Gua Sha Tools & Rituale
            </p>
            <div className="footer__social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.5 14.25c-.5 2.5-1 5-.5 6.75"/>
                  <path d="M12 12a3 3 0 100-6 3 3 0 000 6z"/>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer__links">
            <div className="footer__links-group">
              <h4 className="footer__links-title">Shop</h4>
              <ul className="footer__links-list">
                {shopLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__links-group">
              <h4 className="footer__links-title">Info</h4>
              <ul className="footer__links-list">
                {infoLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__links-group">
              <h4 className="footer__links-title">Rechtliches</h4>
              <ul className="footer__links-list">
                {legalLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © {new Date().getFullYear()} GUA SHOP. Alle Rechte vorbehalten.
          </p>
          <div className="footer__payment">
            <span>Sichere Zahlung mit</span>
            <div className="footer__payment-icons">
              <span>PayPal</span>
              <span>Visa</span>
              <span>Mastercard</span>
              <span>Klarna</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
