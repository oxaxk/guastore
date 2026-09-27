# GUA SHOP Design System

## Direction

Poliertes Material trifft auf ruhige Hautpflege: kühles Metall, mineralisches Jadegrün und ein zurückhaltender Rosé-Akzent. Die Oberfläche bleibt hell und neutral, damit Produktfotos und Inhaltsstoffe die Aufmerksamkeit tragen.

## Typography

- Display: `Manrope` in 600–800 für klare, moderne Produktnamen und Navigationshierarchie.
- Text: `Source Sans 3` in 400–600 für lesbare Anleitungen, Konto- und Checkout-Flows.
- Keine Display-Serifenschrift, kein Mono als Dekoration.

## Color Roles

- Ink: tiefes, leicht kühles Anthrazit.
- Surface: neutrales Weiß und kühles Off-White, kein Beige-Grundton.
- Steel: gedämpftes Blau-Grau.
- Jade: mineralisches Grün für Material-/Statusakzente.
- Rose: zurückhaltender Rosé-Akzent, nur für Rose-Quartz-Produkte.
- Success, warning und error immer zusätzlich mit Text/Icon.

## Components

- Produktkarten: große feste Bildfläche, echte Preis- und Bestandszustände, keine Fake-Badges.
- Buttons: eine primäre Aktion pro Ansicht, 44px Mindesthöhe.
- Konto: linke Navigation, Bestellstatus als verständliche Timeline statt Daten-Dekoration.
- Checkout: progressive Offenlegung, eindeutige Lieferkosten vor Zahlungsfreigabe.

## Motion

150–250ms, nur opacity/transform. Produktwechsel als Crossfade. Alle Animationen respektieren `prefers-reduced-motion`.
