import '../StaticPage.css';
export default function AGB() {
  return (
    <div className="static-page">
      <div className="container">
        <h1>Allgemeine Geschäftsbedingungen</h1>
        <div className="legal-content">
        <h2>§ 1 Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für Bestellungen und Verträge über Produkte von GUA SHOP mit
          Verbraucherinnen und Verbrauchern sowie Unternehmerinnen und Unternehmern.
        </p>

        <h2>§ 2 Vertragspartner</h2>
        <p>
          Der Kaufvertrag kommt mit dem im Impressum genannten Anbieter von GUA SHOP zustande.
        </p>

        <h2>§ 3 Vertragsschluss</h2>
        <p>
          Die Darstellung der Produkte ist kein rechtlich bindendes Angebot, sondern eine unverbindliche
          Produktpräsentation. Mit dem Absenden der zahlungspflichtigen Bestellung im Stripe-Checkout geben Sie ein
          verbindliches Angebot zum Kauf der im Checkout aufgeführten Waren ab. Der Vertrag kommt zustande, wenn wir die
          Bestellung durch eine Bestellbestätigung per E-Mail annehmen oder die Ware versenden.
        </p>

        <h2>§ 4 Preise und Zahlung</h2>
        <p>
          Alle im Shop angegebenen Preise sind Endpreise. Versandkosten innerhalb Deutschlands werden im Warenkorb und
          unmittelbar vor Abgabe der Bestellung ausgewiesen. Die Zahlung erfolgt über die im Stripe-Checkout angebotenen
          Zahlungsarten. Die Belastung richtet sich nach der dort ausgewählten Zahlungsart.
        </p>

        <h2>§ 5 Lieferung und Versand</h2>
        <p>
          Der Versand erfolgt derzeit nur innerhalb Deutschlands an die im Checkout angegebene Lieferadresse. Die
          Lieferzeit beträgt in der Regel 2–4 Werktage. Die Versandkosten stehen auf der Seite „Versand“ und werden vor
          Abgabe der Bestellung angezeigt. Sollte ein Produkt ausnahmsweise nicht verfügbar sein, informieren wir Sie
          unverzüglich per E-Mail und erstatten bereits erhaltene Zahlungen.
        </p>

        <h2>§ 6 Eigentumsvorbehalt</h2>
        <p>
          Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.
        </p>

        <h2>§ 7 Widerrufsrecht</h2>
        <p>
          Verbraucherinnen und Verbraucher haben grundsätzlich ein gesetzliches Widerrufsrecht. Die Einzelheiten ergeben
          sich aus unserer separaten Widerrufsbelehrung.
        </p>

        <h2>§ 8 Gewährleistung</h2>
        <p>
          Es gelten die gesetzlichen Mängelhaftungsrechte.
        </p>

        <h2>§ 9 Haftung</h2>
        <p>
          Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder
          Gesundheit. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den typischen,
          vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung ausgeschlossen, soweit gesetzlich zulässig.
        </p>

        <h2>§ 10 Schlussbestimmungen</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit dem keine zwingenden
          gesetzlichen Verbraucherschutzvorschriften entgegenstehen. Sollten einzelne Bestimmungen dieser AGB ganz oder
          teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
        </div>
      </div>
    </div>
  );
}
