# GUA SHOP Security Release — 06.10.2026

Deployment `dpl_5rXhsfLr26Y2tDK6GHNcB59xdjrh`, Projekt **guashop**, Domain https://guasha-shop.de. RHODIDE wurde vorher veröffentlicht und geprüft. Keine PC-Verbindung, keine lokalen Vollbuilds oder laufenden lokalen Modellworker; vollständige Builds in Vercel, begrenzte lokale Prüfungen und ein isolierter Chrome seriell.

## Umgesetzte Schutzmaßnahmen

- Vite 7.3.6, React-Router 7.18.4, Lodash 4.18.1 und passende Plugin-Version; ungenutzten Lovable-Tagger entfernt. Vollständiges aktuelles npm-Audit und Produktionsaudit: **0 bekannte Meldungen**. Die Sicherheitsleitlinien führten zu begrenzten Eingaben, sicheren Browserrichtlinien und fail-closed Release-Gates.
- Dev und Preview standardmäßig 127.0.0.1, strictPort; tatsächlich gebundene Loopback-Adressen geprüft, eigene Testserver anschließend beendet.
- Ignoreregeln für Env, lokale Vercel-Konfiguration, Dependencies und Ausgaben. Staging nur im belegten privaten eigenen Verzeichnis, ohne Env oder Symlinks. Alle hochgeladenen regulären Dateien einschließlich binärer Assets und Source Maps geprüft; Dateien über 32 MiB werden abgelehnt. Bekannte Credential-Signaturen werden ohne Ausgabe des Wertes erkannt; unbekannte öffentliche VITE-Konfiguration und Storefront-Token werden abgelehnt. Automatische Vercel-Metadaten werden vor dem Build entfernt. Keine produktiven Env-Werte ausgelesen oder geändert.
- Warenkorb nur mit gültigen verfügbaren Katalogprodukten, kanonischen Preisen/Titeln/Bildern; keine fremden Tracking-Bilder aus Storage. Begrenzte Mengen und Zeilen, beschränkte UTF-8-Storagegröße, Integer-Cent-Summen. Ungültige persistierte Daten verworfen.
- Erzwungene Script-CSP ohne unsafe-inline/unsafe-eval; object/frame gesperrt, base-uri/form-action eingeschränkt. Browser-Parser-Inline- und Fremdskripte tatsächlich blockiert, reguläres App-Bundle läuft.
- Drawer verborgen, wenn geschlossen; Fokusführung und Escape-Schließen, sichere Mengensteuerung. Defekte Header-/Footer-Links entfernt. Bisher funktionslose Newsletter-Anmeldung ehrlich als nicht verfügbar gekennzeichnet.

## Belege

- 33 Warenkorb-/Preis-/Storage-Fälle PASS; TypeScript ohne Fehler. `scripts/test-cart-security.ts`.
- Synthetische Secrets, private VITE-Variablen, binäre/map/>2MB-Dateien, Größengrenze und Env-/Symlink-Staging PASS. `scripts/test-secret-gate.mjs`, `scripts/test-staging-root.mjs`. Begrenzte lokale Git-Historienprüfung PASS; kein universeller Leak-Nachweis.
- Finaler Cloud-Build READY: Source-Gate 91 Dateien, keine bekannten Signaturen; vollständiger Vite-Build PASS. `output/SECURITY_FINAL_CLOUD_BUILD_20261006.json`.
- Unabhängiger Abschlussreview PASS nach Behebung der konkreten Vorbefunde. Frühere gescheiterte Reviews bleiben erhalten; sie werden nicht nachträglich als bestanden dargestellt. `output/SECURITY_GATE_ACCEPTANCE_REVIEW_20261006.json`.
- Finale Prüfversion: 14 HTTP-/Bundle-Checks, zwölf Chrome-Seiten, vier mobile Ansichten, Bilder/Galerie, Warenkorb, Storage-Manipulation und CSP-Parser-Injection PASS. `output/SECURITY_FINAL_CANDIDATE_HTTP_QA_20261006.json`, `output/SECURITY_FINAL_CANDIDATE_BROWSER_QA_20261006.json`.
- Echte Domain nach Promotion: 14 HTTP-/Bundle-Checks PASS, keine Wartungsseite/503 und kein noindex; Domain-Zuordnung auf das genannte Deployment unabhängig bestätigt. Live-Browserbeleg separat unter `output/SECURITY_LIVE_BROWSER_QA_20261006.json`.

## Preise und tatsächlicher Bestellweg

XIU JADE **5,99 €**, Stahl **6,99 €**. Versand **1,99 €**, ab zwei Steinen kostenlos: ein Stahl **8,98 €**; Stahl + Jade **12,98 €**. Gesamtansicht und Kantendetail bleiben erhalten; kein neuer 3D-Umbau.

Die veröffentlichte Version nutzt **unverbindliche Bestellanfragen per E-Mail**, keinen Online-Bezahlcheckout. QA hat Links/Inhalte geprüft, aber keine E-Mail gesendet, Bestellung oder Zahlung ausgelöst und keine Shopify-Konten/Provider geändert. Eine spätere Zahlungsanbindung braucht serverseitige Preisvalidierung und eigene Freigabe/QA.

## Restgrenzen und Rollback

Bekannte Signaturen sind zusätzliche Leak-Abwehr, keine Garantie gegen beliebige unbekannte Geheimnisformate. Gleichzeitige Änderungen durch denselben lokalen Eigentümer bleiben eine operative TOCTOU-Grenze. Keine Garantie für vollständige Unangreifbarkeit, rechtliche Abmahnsicherheit oder Materialzertifizierung. Benutzeränderungen erhalten; kein Reset/pauschales Commit.

Rollbackziel: vorherige Wartungsveröffentlichung `dpl_6ZXmHnizeGiXwt3m3qXxHVjzjLbd` (würde den Shop wieder offline/503 setzen, nicht versehentlich als Shop-Release verkaufen).
