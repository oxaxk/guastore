import './ProductDetail.css';
import { useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { mockProducts } from '@/data/mockData';
import SteelGallery from '@/components/shop/SteelGallery';
import { cataloguePrice, formatPrice, SHIPPING_DE_COPY } from '@/lib/commerce';
import { MAX_CART_QUANTITY } from '@/lib/cart-policy';

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [activeImage, setActiveImage] = useState(0);

  const product = mockProducts.find(p => p.handle === handle);
  if (!product) return <div className="container section"><h1>Produkt nicht gefunden</h1><Link to="/shop">Zurück zum Shop</Link></div>;

  const titleLc = product.title.toLowerCase();
  const isSteel = product.handle === 'the-steel' || titleLc.includes('edelstahl');
  const isJade = product.handle === 'the-jade' || titleLc.includes('xiu jade');
  const isRose = product.handle === 'the-rose' || titleLc.includes('rosenquarz') || titleLc.includes('rose') || titleLc.includes('rosa');
  const materialTheme = isSteel ? 'steel' : isJade ? 'jade' : isRose ? 'rose' : 'default';
  const materialLabel = isSteel ? '304 Edelstahl' : isJade ? 'Xiu Jade' : isRose ? 'Rosenquarz' : 'Gua Sha Tool';
  const materialNote = isSteel
    ? 'Spiegelpoliert · rund geschliffen'
    : isJade
      ? 'Individuelle Optik · jedes Stück einzigartig'
      : isRose
        ? 'Glatt polierte Naturstein-Oberfläche'
        : 'Für deine Pflegeroutine';

  const imageOverride = isSteel
    ? '/img/steel/the-steel-matched-v3.png'
    : isJade
      ? '/img/guagreen.png'
      : isRose
        ? '/img/guarosa.png'
        : undefined;

  const priceOverride = cataloguePrice(product.handle, product.price);
  const compareAtOverride = undefined;

  // Home forces Rosenquarz sold-out — mirror that behaviour on the PDP for consistency
  const forcedSoldOut = isRose;

  const displayImages = imageOverride
    ? [imageOverride]
    : (product.images?.length ? product.images : [product.image]);

  const p = product as typeof product & {
    soldOut?: boolean;
    isSoldOut?: boolean;
    quantityAvailable?: number;
    inventoryQuantity?: number;
  };
  const primaryVariant = product.variants?.[0];

  const isSoldOut =
    forcedSoldOut ||
    Boolean(p?.soldOut) ||
    Boolean(p?.isSoldOut) ||
    Boolean(p?.availableForSale === false) ||
    Number(p?.quantityAvailable ?? p?.inventoryQuantity ?? 1) <= 0;

  const displayPrice: number = (priceOverride ?? primaryVariant?.price ?? product.price) as number;
  const displayCompareAt: number | undefined = (isSteel || isJade ? undefined : compareAtOverride ?? primaryVariant?.compareAtPrice ?? product.compareAtPrice ?? undefined) as
    | number
    | undefined;

  const isOnSale = Boolean(displayCompareAt && displayCompareAt > displayPrice);

  const isDigitalProduct = (() => {
    const t = product.title.toLowerCase();
    return t.includes('ebook') || t.includes('e-book') || t.includes('guide') || product.tags?.includes('ebook');
  })();

  type TabKey = 'details' | 'anwendung' | 'pflege' | 'versand';

  const getTabContent = (productTitle: string): Record<TabKey, ReactNode> => {
    const title = productTitle.toLowerCase();
    const isEbook = title.includes('ebook') || title.includes('e-book') || title.includes('guide');

    if (isEbook) {
      return {
        details: (
          <ul className="tab-list">
            <li>Digitaler Massage-Guide (PDF) mit Schritt-für-Schritt-Anleitungen für Gesicht und Hals.</li>
            <li>Illustrationen zu typischen Gua-Sha-Griffen und Routinen.</li>
            <li>Geeignet für Einsteiger:innen und Fortgeschrittene.</li>
          </ul>
        ),
        anwendung: (
          <ul className="tab-list">
            <li>Nach dem Kauf erhältst du einen Download-Link per E-Mail.</li>
            <li>PDF auf Smartphone, Tablet oder Laptop öffnen.</li>
            <li>Massage-Routinen Schritt für Schritt nach den Abbildungen durchführen.</li>
          </ul>
        ),
        pflege:
          'Speichere das PDF lokal auf deinen Geräten oder in deiner Cloud. Für den privaten Gebrauch bestimmt, bitte nicht weiterverkaufen oder öffentlich verbreiten.',
        versand:
          'Kein physischer Versand – du erhältst sofort nach Abschluss der Bestellung einen Download-Link per E-Mail.',
      };
    }

    const physicalShipping =
      `${SHIPPING_DE_COPY}. Edelstahl und Xiu Jade können kombiniert werden. Die Lieferzeit innerhalb Deutschlands beträgt in der Regel 2–4 Werktage.`;

    if (isSteel) {
      return {
        details: (
          <ul className="tab-list">
            <li>Spiegelpolierter Edelstahl mit glatter Vorder- und Rückseite.</li>
            <li>Dünnes Profil mit umlaufend weich gerundeter Kante.</li>
            <li>Asymmetrische Kontur mit zwei Rundungen und sanfter Mulde.</li>
            <li>Dezente Gua-Sha-Gravur auf der Vorderseite.</li>
          </ul>
        ),
        anwendung: (
          <ul className="tab-list">
            <li>Haut reinigen und ein Gesichtsöl oder Serum auftragen.</li>
            <li>Am Nacken starten und mit sanftem Druck nach oben Richtung Haaransatz streichen.</li>
            <li>Von der Kinnmitte entlang der Kieferlinie zu den Ohren arbeiten.</li>
            <li>Unter den Augen vom inneren Augenwinkel sanft nach außen streichen.</li>
            <li>Zum Abschluss mit langen Zügen von der Stirnmitte nach außen massieren.</li>
          </ul>
        ),
        pflege:
          'Nach jeder Anwendung mit mildem Reinigungsmittel und lauwarmem Wasser reinigen, anschließend sorgfältig abtrocknen. Nicht in der Spülmaschine reinigen, um die Politur zu schützen.',
        versand: physicalShipping,
      };
    }

    if (isJade) {
      return {
        details: (
          <ul className="tab-list">
            <li>Produktbezeichnung: Xiu Jade.</li>
            <li>Farbton und Optik können von Stück zu Stück abweichen.</li>
            <li>Sanft kühlendes Gefühl auf der Haut – ideal für Morgen- und Abendroutine.</li>
          </ul>
        ),
        anwendung: (
          <ul className="tab-list">
            <li>Haut mit Öl, Serum oder Creme vorbereiten.</li>
            <li>Vom Kinn zur Ohr-Partie in ruhigen Zügen streichen.</li>
            <li>Wangen von der Nase zu den Schläfen ausstreichen.</li>
            <li>Hals immer von oben nach unten in Richtung Schlüsselbein ausleiten.</li>
          </ul>
        ),
        pflege:
          'Mit einem weichen Tuch und wenig milder Seife reinigen, danach gut trocknen. Nicht fallen lassen und vor starken Temperaturschwankungen schützen, da Naturstein brechen kann.',
        versand: physicalShipping,
      };
    }

    if (isRose) {
      return {
        details: (
          <ul className="tab-list">
            <li>Produktbezeichnung: The Rose.</li>
            <li>Glatt polierte Oberfläche für besonders sanfte Anwendungen.</li>
            <li>Für ein ruhiges Pflegeritual.</li>
          </ul>
        ),
        anwendung: (
          <ul className="tab-list">
            <li>Den Stein kurz im Kühlschrank kühlen (nicht ins Eisfach legen).</li>
            <li>Mit Pflegeprodukt auf der Haut vom Gesichtszentrum nach außen streichen.</li>
            <li>Sanft entlang der Augenpartie arbeiten, ohne zu stark zu drücken.</li>
            <li>Zum Abschluss den Hals in langen Zügen Richtung Schlüsselbein massieren.</li>
          </ul>
        ),
        pflege:
          'Nach der Anwendung mit einem weichen, leicht angefeuchteten Tuch abwischen und trocknen lassen. Vor Stürzen, harten Oberflächen und sehr heißem Wasser schützen.',
        versand: physicalShipping,
      };
    }

    // Fallback für weitere Produkte
    return {
      details: (
        <ul className="tab-list">
          <li>Sorgfältig verarbeitete Materialien für angenehme Haptik.</li>
          <li>Form und Gewicht sind auf eine entspannte Anwendung ausgelegt.</li>
          <li>Jedes Produkt wird vor dem Versand einzeln kontrolliert.</li>
        </ul>
      ),
      anwendung: (
        <ul className="tab-list">
          <li>Hinweise in der Produktbeschreibung und ggf. in der beiliegenden Karte beachten.</li>
          <li>Mit wenig Druck starten und die Hautreaktion beobachten.</li>
          <li>Anwendung bei Irritationen unterbrechen.</li>
        </ul>
      ),
      pflege:
        'Nach der Nutzung gemäß den Hinweisen reinigen und trocken lagern. Direkte Hitze und aggressive Reinigungsmittel vermeiden, um die Oberfläche zu schützen.',
      versand: physicalShipping,
    };
  };

  const tabContent = getTabContent(product.title);

  const handleAddToCart = () => {
    if (isSoldOut) return;
    const variant = product.variants?.[0];
    if (!variant) return;
    addItem(
      {
        id: product.id,
        variantId: variant.id,
        title: product.title,
        variantTitle: variant.title,
        price: displayPrice,
        compareAtPrice: displayCompareAt,
        image: imageOverride ?? product.image,
        handle: product.handle,
      },
      quantity
    );
  };

  return (
    <div className={`product-detail product-detail--${materialTheme}`}>
      <div className="container">
        <nav className="breadcrumb"><Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{product.title}</span></nav>
        <div className="product-detail__grid">
          <div className="product-detail__gallery">
            {isSteel ? <SteelGallery /> : <>
            <div className="product-detail__main-image">
              <div className="product-detail__material-label">{materialLabel}</div>
              <img src={displayImages[activeImage] || displayImages[0]} alt={`${product.title} – ${materialLabel}`} />
              <div className="product-detail__material-note">{materialNote}</div>
            </div>
            {displayImages.length > 1 && (
              <div className="product-detail__thumbs">
                {displayImages.map((img, i) => (
                  <button
                    key={i}
                    className={`product-detail__thumb ${i === activeImage ? 'active' : ''}`}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Bild ${i + 1} von ${product.title} anzeigen`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
            </>}
          </div>
          <div className="product-detail__info">
            <p className="product-detail__eyebrow">GUA SHOP · {materialLabel}</p>
            <h1>{product.title}</h1>
            {isSoldOut && <div className="product-detail__soldout">Ausverkauft</div>}
            {!isRose && <div className="product-detail__price">
              <span className="current">{formatPrice(displayPrice)}</span>
              {isOnSale && displayCompareAt && <span className="compare">{formatPrice(displayCompareAt)}</span>}
            </div>}
            {!isDigitalProduct && !isRose && <p className="product-detail__shipping"><Link to="/legal/versand">{SHIPPING_DE_COPY}</Link></p>}
            <p className="product-detail__desc">{product.description}</p>
            <div className="product-detail__actions">
              {!isDigitalProduct && !isRose && (
                <div className="quantity-selector">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Menge verringern">−</button>
                  <span aria-live="polite">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(Math.min(MAX_CART_QUANTITY, quantity + 1))} disabled={quantity >= MAX_CART_QUANTITY} aria-label="Menge erhöhen">+</button>
                </div>
              )}
              <button
                className={`btn btn--primary btn--lg ${isSoldOut ? 'product-detail__cta--soldout' : ''}`}
                type="button"
                onClick={handleAddToCart}
                disabled={isSoldOut}
                aria-disabled={isSoldOut}
              >
                {isSoldOut ? 'Ausverkauft' : isDigitalProduct ? 'Download kaufen' : 'In den Warenkorb'}
              </button>
            </div>
            <div className="product-detail__tabs">
              <div className="tab-buttons">
                {(['details', 'anwendung', 'pflege', 'versand'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={activeTab === tab ? 'active' : ''}
                    onClick={() => setActiveTab(tab)}
                    aria-pressed={activeTab === tab}
                  >
                    {tab === 'details' && 'Details'}
                    {tab === 'anwendung' && 'Anwendung'}
                    {tab === 'pflege' && 'Pflege'}
                    {tab === 'versand' && 'Versand'}
                  </button>
                ))}
              </div>
              <div className="tab-content">
                {tabContent[activeTab]}
              </div>
            </div>
            {!isDigitalProduct && (isSteel || isJade) && (
              <section className="product-detail__safety" aria-labelledby="product-safety-title">
                <h2 id="product-safety-title">Produktsicherheit</h2>
                <p><strong>Hinweise:</strong> Nur mit sanftem Druck auf gereinigter Haut mit Öl oder Serum anwenden. Nicht auf verletzter oder gereizter Haut verwenden. Bei Irritation die Anwendung abbrechen. Nach Gebrauch reinigen und trocken lagern. Kein Medizinprodukt.</p>
              </section>
            )}
          </div>
        </div>
        {isSteel && <section className="steel-craft" aria-labelledby="steel-craft-heading">
          <img src="/img/steel/the-steel-rounded-edge.webp" width="1254" height="1254" alt="Gerundeter Rand des spiegelpolierten Edelstahl Gua Sha in Nahaufnahme" loading="lazy" />
          <div>
            <h2 id="steel-craft-heading">Spiegelpoliert.<br />Rund bis zum Rand.</h2>
            <p>Die glatte Fläche geht weich in die Kante über. Licht wandert als heller Reflex über das Metall und macht die feine Rundung sichtbar.</p>
            <ul>
              <li><strong>Weiche Übergänge</strong><span>Rund geschliffene Seiten entlang der gesamten Kontur.</span></li>
              <li><strong>Schlankes Profil</strong><span>Eine flache Form, die sich beim Anlegen gut kontrollieren lässt.</span></li>
              <li><strong>Echter Metallcharakter</strong><span>Die polierte Oberfläche spiegelt ihre Umgebung – von hellem Silber bis zu dunklen Reflexen.</span></li>
            </ul>
          </div>
        </section>}
      </div>
    </div>
  );
}
