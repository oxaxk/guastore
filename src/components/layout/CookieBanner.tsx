import './CookieBanner.css';
import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let consent: string | null = null;
    try { consent = localStorage.getItem('cookie-consent'); } catch { /* Storage may be disabled. */ }
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeBanner = () => {
    try { localStorage.setItem('cookie-consent', 'acknowledged'); } catch { /* Dismiss still works for this visit. */ }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Hinweis zur lokalen Speicherung">
      <div className="cookie-banner__content">
        <p className="cookie-banner__text">
          Wir speichern deinen Warenkorb ausschließlich lokal auf deinem Gerät, damit GUA SHOP zuverlässig funktioniert.
          Mehr Informationen findest du in unserer{' '}
          <a href="/legal/datenschutz">Datenschutzerklärung</a>.
        </p>
        <div className="cookie-banner__actions">
          <button className="btn btn--primary" onClick={closeBanner}>Verstanden</button>
        </div>
      </div>
    </div>
  );
}
