# GUA SHOP: Commerce-Rebuild

## Zielarchitektur

Der bisherige Vite-Storefront-Client mit Shopify-API wird durch eine serverfähige Anwendung ersetzt. Der Shop besitzt eigene Datenmodelle und Admin-Workflows für Katalog, Varianten, Bestände, Bestellungen, Versand, Retouren und Kundenkonto. Shopify wird vollständig entfernt.

## Umsetzung in Reihenfolge

1. **Fundament** – Next.js-App-Router, Datenzugriffsschicht, serverseitige Sessions, Rollen `customer`, `support`, `admin`, sichere Validierung und Audit-Log.
2. **Commerce-Kern** – Produkte, Varianten, Lagerbewegungen, Warenkorb, Entwürfe für Bestellungen, Lieferadressen und Versandregeln. Bestand wird beim Checkout reserviert, nicht bloß im Browser gezählt.
3. **Bezahlung** – Stripe Checkout plus signierte Webhooks. Erst nach erfolgreicher Zahlung wird eine Bestellung bestätigt und Lagerbestand abgebucht. Keine echte Zahlungsfreigabe vor E2E-Test mit den korrekten Preisen.
4. **Fulfillment und Retouren** – Versandstatus, Tracking-Link, Teillieferung, Rückgabeantrag, Freigabe/Ablehnung und Rückerstattungs-Workflow. Keine automatische Rückerstattung ohne Admin-Freigabe.
5. **Kundenkonto** – Profil, Adressen, Bestellhistorie, Rechnungs-/Versandstatus, Retouren und Supportanfrage. Kein Marketing-Dashboard.
6. **Admin** – Produktpflege, Bestand, Bestellungen, Versand, Retouren und Inhaltsstatus. Zugang nur über serverseitige Rolle.
7. **SEO und Inhalte** – SSR-Metadaten, Canonicals, XML-Sitemap, robots, Product/Breadcrumb/FAQ-JSON-LD, Wissenshub mit material- und anwendungsbezogenen Seiten ohne medizinische Versprechen.
8. **Release** – automatisierte Tests, Responsive-/a11y-QA, Preview, Produktionsdeploy, reale Checkout- und Webhook-Prüfung in Testmodus.

## Datenmodelle

`Product`, `ProductVariant`, `InventoryMovement`, `Cart`, `Order`, `OrderItem`, `Shipment`, `ReturnRequest`, `Customer`, `Address`, `SupportTicket`, `AuditEvent`.

## Release-Gates

- Keine Shopify-Schlüssel oder Storefront-Aufrufe im ausgelieferten Bundle.
- Keine Fake-Bestände, Fake-Bewertungen oder künstliche Angebotsfristen.
- Keine Aktivierung echter Zahlungen, Retouren oder Versandlabels ohne Test-E2E und explizite Zahlungsfreigabe.
- Datenbank, Auth und Stripe-Schlüssel müssen als serverseitige Produktionssecrets konfiguriert sein; sie gehören nie ins Frontend oder Repository.
