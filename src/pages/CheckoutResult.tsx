import { Link, useLocation } from 'react-router-dom';
import './StaticPage.css';

export default function CheckoutResult({ cancelled = false }: { cancelled?: boolean }) {
  const query = new URLSearchParams(useLocation().search);
  const hasSession = /^cs_test_[A-Za-z0-9_]+$/.test(query.get('session_id') || '');
  return (
    <main className="static-page">
      <div className="container static-page__container">
        <p className="static-page__eyebrow">GUA SHOP</p>
        <h1>{cancelled ? 'Checkout abgebrochen' : 'Zahlung wird bestätigt'}</h1>
        <p>{cancelled
          ? 'Es wurde keine Bestellung abgeschlossen. Dein Warenkorb bleibt erhalten.'
          : hasSession
            ? 'Stripe verarbeitet die Zahlung. Sobald sie bestätigt ist, speichern wir die Bestellung und senden die Bestätigung per E-Mail.'
            : 'Der Zahlungsstatus wird sicher über Stripe geprüft. Eine Bestätigung folgt per E-Mail.'}</p>
        <Link className="btn btn--primary" to={cancelled ? '/shop' : '/'}>{cancelled ? 'Zurück zum Shop' : 'Zur Startseite'}</Link>
      </div>
    </main>
  );
}
