import '../StaticPage.css';
import { formatPrice, SHIPPING_DE_CENTS, FREE_SHIPPING_STONE_COUNT } from '@/lib/commerce';
export default function Versand() {
  return (
    <div className="static-page"><div className="container">
      <h1>Versand & Lieferung</h1>
      <div className="legal-content">
        <h2>Versandkosten</h2>
        <p>
          Innerhalb Deutschlands berechnen wir für einen Stein {formatPrice(SHIPPING_DE_CENTS / 100)} Versandkosten.
          Ab {FREE_SHIPPING_STONE_COUNT} Steinen pro Bestellung liefern wir innerhalb Deutschlands versandkostenfrei.
          Edelstahl und Xiu Jade können dabei kombiniert werden. Entscheidend ist die Stückzahl, nicht der Bestellwert.
        </p>

        <h2>Lieferzeiten</h2>
        <p>
          Die Lieferzeit innerhalb Deutschlands beträgt in der Regel 2–4 Werktage. Sie beginnt nach erfolgreicher
          Zahlung. An Sonn- und Feiertagen erfolgt keine Zustellung.
        </p>

        <h2>Versandpartner</h2>
        <p>
          Der Versand erfolgt innerhalb Deutschlands mit einem geeigneten Versanddienstleister. Den konkret eingesetzten
          Versandpartner teilen wir mit der Versandbestätigung mit.
        </p>

        <h2>Hinweise zur Verfügbarkeit</h2>
        <p>
          Sollte ein Produkt vorübergehend nicht verfügbar sein oder sich der Versand verzögern, informieren wir Sie
          schnellstmöglich per E-Mail.
        </p>
      </div>
    </div></div>
  );
}
