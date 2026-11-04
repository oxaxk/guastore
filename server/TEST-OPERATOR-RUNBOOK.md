# GUA SHOP: Testbetrieb und Konfliktprüfung

Interne Betriebsanleitung; kein öffentlicher Endpunkt, keine Zugangsdaten und keine Kundendaten in diese Datei schreiben. Stand 03.11.2026. Der aktuelle Shop bietet im Frontend eine E-Mail-Anfrage; der Checkout ist ausschließlich für eine isolierte Preview vorgesehen und in Produktion gesperrt.

## Voraussetzungen vor einem echten Sandbox-Test

1. Separates GUA-Test-Stripe-Konto und isolierte transaktionsfähige MongoDB als Testsystem eindeutig identifizieren. Keine RHODIDE-Produktionsdaten verwenden. Die im Chat offengelegten Testschlüssel nach dem abgestimmten sicheren Verfahren widerrufen/ersetzen; keine Schlüssel in Chat, Logs oder Repository eingeben.
2. Preview-Origin als exakten HTTPS-Ursprung festlegen. Geschützte Umgebungsvariablen für Preview konfigurieren: `GUA_TEST_MODE`, `VERCEL_ENV`, `GUA_TEST_ORIGIN`, `GUA_TEST_MONGO_URI`, `GUA_TEST_STRIPE_ACCOUNT_ID`, `GUA_TEST_STRIPE_KEY`, `GUA_TEST_COOKIE_SECRET`, `GUA_TEST_STRIPE_WEBHOOK_SECRET`. Werte nicht anzeigen oder protokollieren. Eine kontrollierte Stripe-Testversion für API und Webhook auswählen und festschreiben: der aktuelle REST-Code sendet **noch keinen Stripe-Version-Header**; Webhook-Version separat konfigurieren und mit Fixtures und echtem Sandbox-Ereignis testen.
3. DB-Benutzer nur für Testdaten freigeben, Replica-Set-Transaktionen, atomare Zähler und TTL-Indexrecht verifizieren. Die Inventardokumente müssen initial explizit mit bestätigten Testmengen und notwendigen Zählerfeldern existieren. `_id`-Eindeutigkeit schützt Reservierungen, Bestellungen, Outbox und Konflikte. Test- und Livebestand strikt trennen. Ein vorausschauend erstellter TTL-Index auf `checkout_rate_limits.expiresAt` muss der Implementierung `expireAfterSeconds: 0` entsprechen.
4. Vertrauenswürdige WAF-/Ingress-Grenzen und Überwachung vor der Datenbank konfigurieren: die lokalen globalen 60/min und 12/15 min pro signiertem Cookie sind kein personenbezogener Missbrauchsschutz, können legitime Nutzer aussperren und zählen keine ungültigen Bodys vor dem DB-Aufruf. Zeitabweichung, TTL-Verhalten, Parallelität und Ausfälle gegen echte getrennte Mongo-Instanzen prüfen.
5. Stripe-Signatur, Konto, Modus, Summen, Versand, Duplikate, verlorene Antworten, Webhookzustellung und Bestandsübergänge Ende zu Ende testen. Die Browser-Anbindung, ein geschützter Abgleich-Auslöser und ein Mailtransport sind derzeit nicht eingerichtet. Keine Funktion als aktiv bezeichnen, bevor sie tatsächlich bereitgestellt und geprüft ist.

## Lese- und Betriebsablauf für `payment_conflicts`

Eine gültig zugeordnete Testzahlung nach bereits freigegebener Reservierung wird transaktional in `payment_conflicts` gespeichert. Felder: `_id` (Checkout-Session-ID), `reservationId`, `status: manual_review`, `reason: paid_after_release`, `amountCents`, `currency`, `createdAt`. Die Reservierung erhält `payment_review`. Es entstehen dadurch keine neue Bestandsreservierung, Bestellung, Fulfillmentfreigabe, Outbox-Mail oder automatische Erstattung. Es wird keine Empfänger-E-Mail in diesem Konfliktdatensatz benötigt.

Ein Webhook erhält erst dann eine erfolgreiche Bestätigung für diesen Konflikt, wenn die Speicherung und der Statuswechsel in der Datenbanktransaktion erfolgreich abgeschlossen sind. Bei Speicherfehler wird nicht bestätigt und die Zustellung darf erneut erfolgen. Duplikate verwenden dieselbe Session-ID; tatsächliche Mongo-Parallelität, Commit-Verhalten und Wiederanlauf sind vor dem Einsatz noch separat zu testen.

Für lesende Einsicht und Alarmierung ist ein eigener, nachweislich authentifizierter und autorisierter Betreiberzugang nötig. Diesen gibt es aktuell nicht: keine neue öffentliche Adminroute, keine Freigabe anhand einer bloßen E-Mail-Adresse. Sobald ein solches System existiert, nach `status`, Alter und Grund filtern; aus der gesicherten, kontogebundenen Stripe-Testabfrage und den Snapshot-Daten den Zahlungs- und Bestellstatus vergleichen. Bis zur menschlichen Entscheidung den Fall offen lassen. Über eine spätere Korrektur, Rückzahlung oder Fulfillmententscheidung entscheidet der berechtigte Betreiber im dokumentierten Prozess; dieses Paket implementiert keine solche Aktion.

## Beobachtbarkeit und Fehlerbehandlung

Alarme für neue und alte `manual_review`-Fälle, dauerhaft reservierten Bestand ohne bekannte Session-ID, `unknown`/`blocked`-Outboxeinträge, Fehlerquoten, Rate-Limits und Webhook-Retrys sind noch nicht verbunden. Unbekannten POST-Ausgang nicht als fehlgeschlagene Stripe-Erstellung interpretieren; dieselbe Idempotenzidentität nur innerhalb des dafür nachgewiesenen Stripe-Vertrags verwenden. Ohne belegten Zustand oder nach unklarem Zeitfenster manuell prüfen; Bestand nicht automatisch freigeben. E-Mail-Inhalt und Vertragsschluss müssen rechtlich zum späteren echten Checkout passen.

## Primärquellen

- MongoDB Node-Treiber, `findOneAndUpdate` und Rückgabe: https://www.mongodb.com/docs/drivers/node/v6.x/crud/compound-operations/
- MongoDB Transaktionen und Replikatvoraussetzungen: https://www.mongodb.com/docs/manual/core/transactions-production-consideration/
- MongoDB TTL-Indizes: https://www.mongodb.com/docs/manual/core/index-ttl/
- Stripe Webhook-Reihenfolge und Duplikate: https://docs.stripe.com/webhooks
- Stripe API-Versionierung: https://docs.stripe.com/api/versioning
- Vercel Node-Funktionen: https://vercel.com/docs/functions/runtimes/node-js
