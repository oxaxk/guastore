import './StaticPage.css';

export default function Contact() {
  return (
    <div className="static-page">
      <div className="container">
        <h1>Kontakt</h1>
        <p className="lead">Fragen zu Produkten, Anwendung oder einer Bestellung? Schreib uns direkt – wir melden uns zeitnah zurück.</p>
        <p>
          <a className="btn btn--primary btn--lg" href="mailto:info@guasha-shop.de?subject=Anfrage%20GUA%20SHOP">
            info@guasha-shop.de
          </a>
        </p>
        <p>Für Fragen zu einer Bestellung nenne bitte die Bestellnummer und die beim Checkout verwendete E-Mail-Adresse. Bestellungen und Zahlungen werden sicher über unseren Checkout abgewickelt.</p>
      </div>
    </div>
  );
}
