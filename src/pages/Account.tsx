import { Link } from 'react-router-dom';
import './StaticPage.css';

export default function Account() {
  return <div className="static-page"><div className="container">
    <h1>Dein Konto</h1>
    <div className="content-block">
      <h2>Das Kundenkonto wird eingerichtet</h2>
      <p>Anmeldung, Registrierung und Bestellübersicht sind noch nicht verfügbar.</p>
      <p>Bei Fragen zu deiner Bestellung erreichst du uns über die Kontaktseite.</p>
      <Link className="btn btn--secondary" to="/contact">Kontakt</Link>
    </div>
  </div></div>;
}
