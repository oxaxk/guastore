import './StaticPage.css';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="static-page">
      <div className="container">
        <div className="coming-soon">
          <span>404</span>
          <h2>Seite nicht gefunden</h2>
          <p>Die gesuchte Seite existiert nicht oder wurde verschoben.</p>
          <Link to="/" className="btn btn--primary">Zur Startseite</Link>
        </div>
      </div>
    </div>
  );
}