import './StaticPage.css';
import { FormEvent, useState } from 'react';

export default function Contact() {
  const [topic, setTopic] = useState('private');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="static-page">
      <div className="container">
        <h1>Kontakt</h1>
        <p className="lead">Fragen zu Produkten, Materialien, Anwendung oder einer Zusammenarbeit? Schreib uns direkt – wir melden uns zeitnah zurück.</p>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Name *</label>
            <input type="text" className="input" required />
          </div>
          <div className="form-group">
            <label className="label">E-Mail *</label>
            <input type="email" className="input" required />
          </div>
          <div className="form-group">
            <label className="label">Betreff</label>
            <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="private">Privatanfrage</option>
              <option value="studio">Studio / Praxis</option>
              <option value="retail">Einzelhandel / Wholesale</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Nachricht *</label>
            <textarea className="input textarea" required></textarea>
          </div>
          <button type="submit" className="btn btn--primary btn--lg">Nachricht senden</button>
          {submitted && (
            <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
              Danke. Deine Anfrage wurde erfasst. Im Live-Betrieb wird hier als Nächstes das echte Formular-Handling angeschlossen.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}