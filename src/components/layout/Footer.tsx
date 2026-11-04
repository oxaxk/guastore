import './Footer.css';
import { Link } from 'react-router-dom';

const shopLinks = [
  { path: '/shop/product/the-steel', label: 'The Steel' },
  { path: '/shop/product/the-jade', label: 'Xiu Jade' },
];

const infoLinks = [
  { path: '/how-to', label: 'How To' },
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
              <span className="footer__wordmark">GUA SHA</span>
            </Link>
            <p className="footer__tagline">
              Gua Sha für dein Ritual
            </p>
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
          <p className="footer__payment">Kundenservice: <a href="mailto:info@guasha-shop.de">info@guasha-shop.de</a></p>
        </div>
      </div>
    </footer>
  );
}
