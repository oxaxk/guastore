import "../StaticPage.css";

export default function Impressum() {
  return (
    <div className="static-page">
      <div className="container">
        <h1>Impressum</h1>

        <div className="legal-content">
          <h2>Angaben gemäß § 5 DDG</h2>
          <p>
            Onur Arda Küçük<br />
            handelnd unter GUA SHOP<br />
            Saalmannstraße 9<br />
            13403 Berlin<br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>
            E-Mail: info@guasha-shop.de<br />
            Telefon: +49 155 11207431
          </p>

          <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            Onur Arda Küçük<br />
            Saalmannstraße 9<br />
            13403 Berlin
          </p>

          <h2>Haftung für Inhalte und Links</h2>
          <p>
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung
            für externe Links. Für den Inhalt verlinkter Seiten sind ausschließlich
            deren Betreiber verantwortlich.
          </p>
        </div>
      </div>
    </div>
  );
}
