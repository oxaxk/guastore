# Integrationsprüfung 03.11.2026

- Vercel-Connector: Projekt `guashop` lesbar; letztes vorhandenes Produktionsdeployment ist READY, SSO-Schutz für Vercel-Domains aktiv. Das belegt weder, dass es den lokalen Kandidaten enthält, noch Verkaufsbereitschaft.
- Stripe: Chrome meldet eine offene Seite für GUA SHOP Sandbox im Testmodus. Ein persönlicher Windows-Sicherheitsdialog ist weiterhin offen; Seiteninhalt und Schlüssel wurden nicht eingesehen. Aktueller Sandbox-Zugriff und Webhookzustellung sind nicht nachgewiesen.
- Gmail-Connector: Ein persönliches Google-Konto ist verbunden. Das ist kein Nachweis eines für Shop-Bestellmails konfigurierten und autorisierten Server-Mailtransports.
- MongoDB Atlas und Betreiber-Authentifizierung: Kein angemeldetes Dashboard oder zugeordneter Testzugang bei der aktuellen Browserinventur sichtbar. Eine transaktionsfähige isolierte Testdatenbank ist nicht nachgewiesen.
- Lokaler Test-Runbook beschreibt die noch erforderlichen isolierten Secrets, Mongo-Transaktionen, Stripe-Webhooks, Browseranbindung, Mailtransport und E2E-Prüfung. Kein neuer externer Zustand wurde geändert.

Nächster Schritt: Windows-Sicherheitsdialog durch Kontoinhaber schließen; danach Zugang zu Stripe-Sandbox und isolierter Testdatenbank prüfen. Shop-Mailkonto und Betreiber-Login eindeutig zuordnen und sichere Dienstzugänge konfigurieren. Niemals Zugangsdaten im Chat ablegen. Erst anschließend echten isolierten Testablauf durchführen.

## Erneute Prüfung

- Der Windows-Sicherheitsdialog ist inzwischen nicht mehr in der Fensterliste.
- Der bestehende Stripe-Sandbox-Tab ist weiterhin gelistet. Ein neuer Dashboard-Aufruf zeigte nur eine leere Ladeseite und lief in ein Timeout; der aktuelle Sitzungsinhalt konnte nicht bestätigt werden.
- Der Aufruf von `https://cloud.mongodb.com/` lief in ein Browser-Timeout und blieb leer. Eine Atlas-Anmeldung oder passende Testdatenbank konnte so nicht verifiziert werden.
- `node --test server/*.test.mjs`: 49 bestanden, 0 fehlgeschlagen. Dies sind lokale Tests mit Testdoubles und teilweise SQLite-Fixtures, kein Nachweis für echten Stripe-, MongoDB- oder Mailbetrieb.
