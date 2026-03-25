import './StaticPage.css';
import { Link } from 'react-router-dom';

export default function Blog() {
  return (
    <div className="static-page">
      <div className="container">
        <h1>Journal</h1>
        <p className="lead">Wissen, Routinen und klare Guides rund um Gua Sha, moderne Selfcare und bewusste Anwendung.</p>
        <div className="coming-soon">
          <h2>Bald verfügbar</h2>
          <p>
            Unser Journal wird in Kürze mit hochwertigen Artikeln, Anwendungs-Guides, Materialvergleichen und Ritual-Insights
            gefüllt. Bis dahin findest du die wichtigsten Grundlagen direkt im Shop und in unseren How-To-Inhalten.
          </p>
          <Link to="/how-to" className="btn btn--primary">Zu den How-To-Inhalten</Link>
        </div>
      </div>
    </div>
  );
}