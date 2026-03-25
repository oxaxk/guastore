import './ProductDetail.css';
import { useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { mockProducts } from '@/data/mockData';

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [activeImage, setActiveImage] = useState(0);

  const product = mockProducts.find(p => p.handle === handle);
  if (!product) return <div className="container section"><h1>Produkt nicht gefunden</h1><Link to="/shop">Zurück zum Shop</Link></div>;

  const titleLc = product.title.toLowerCase();
  const isSteel = titleLc.includes('edelstahl');
  const isJade = titleLc.includes('jade');
  const isRose = titleLc.includes('rosenquarz') || titleLc.includes('rose') || titleLc.includes('rosa');

  const imageOverride = isSteel
    ? '/img/guasteal.png'
    : isJade
      ? '/img/guagreen.png'
      : isRose
        ? '/img/guarosa.png'
        : undefined;

  const priceOverride = isSteel ? 11.95 : isJade ? 9.95 : isRose ? 11.95 : undefined;
  const compareAtOverride = isSteel ? 15.9 : isJade ? 12.9 : isRose ? 15.95 : undefined;

  // Home forces Rosenquarz sold-out — mirror that behaviour on the PDP for consistency
  const forcedSoldOut = isRose;

  const displayImages = imageOverride
    ? [imageOverride]
    : (product.images?.length ? product.images : [product.image]);

  const p: any = product as any;
  const primaryVariant = product.variants?.[0];

  const isSoldOut =
    forcedSoldOut ||
    Boolean(p?.soldOut) ||
    Boolean(p?.isSoldOut) ||
    Boolean(p?.availableForSale === false) ||
    Number(p?.quantityAvailable ?? p?.inventoryQuantity ?? 1) <= 0;

  const displayPrice: number = (priceOverride ?? primaryVariant?.price ?? product.price) as number;
  const displayCompareAt: number | undefined = (compareAtOverride ?? primaryVariant?.compareAtPrice ?? product.compareAtPrice ?? undefined) as
    | number
    | undefined;

  const isOnSale = Boolean(displayCompareAt && displayCompareAt > displayPrice);

  const isDigitalProduct = (() => {
    const t = product.title.toLowerCase();
    return t.includes('ebook') || t.includes('e-book') || t.includes('guide') || product.tags?.includes('ebook');
  })();

  const formatPrice = (price: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);

  type TabKey = 'details' | 'anwendung' | 'pflege' | 'versand';

  const getTabContent = (productTitle: string): Record<TabKey, ReactNode> => {
    const title = productTitle.toLowerCase();
    const isSteel = title.includes('edelstahl');
    const isJade = title.includes('jade');
    const isRose = title.includes('rosenquarz');
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
      'Der Versand erfolgt klimaneutral innerhalb Deutschlands in 2–4 Werktagen. Dein Gua Sha wird sicher verpackt in einer schützenden Box geliefert – ideal auch als Geschenk.';

    if (isSteel) {
      return {
        details: (
          <ul className="tab-list">
            <li>Material: 304-Edelstahl, ca. 80 g.</li>
            <li>Oberfläche: extra glatt, kühlend und bruchsicher.</li>
            <li>Form: ergonomische Kanten für Kieferlinie, Wangen und Stirn.</li>
            <li>Ideal zur Aufbewahrung im Kühlschrank für einen Extra-Kühleffekt.</li>
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
            <li>Material: echter Jade-Stein, ca. 60 g.</li>
            <li>Jede Platte ist ein Unikat mit natürlicher Maserung.</li>
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
            <li>Material: Rosenquarz, ca. 70 g.</li>
            <li>Glatt polierte Oberfläche für besonders sanfte Anwendungen.</li>
            <li>Beliebt für beruhigende Abend-Rituale und Lymphdrainage.</li>
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
        image: product.image,
        handle: product.handle,
      },
      quantity
    );
  };

  return (
    <div className="product-detail">
      <div className="container">
        <nav className="breadcrumb"><Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{product.title}</span></nav>
        <div className="product-detail__grid">
          <div className="product-detail__gallery">
            <div className="product-detail__main-image"><img src={displayImages[activeImage] || displayImages[0]} alt={product.title} /></div>
            {displayImages.length > 1 && (
              <div className="product-detail__thumbs">
                {displayImages.map((img, i) => (
                  <button
                    key={i}
                    className={`product-detail__thumb ${i === activeImage ? 'active' : ''}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="product-detail__info">
            <h1>{product.title}</h1>
            {isSoldOut && <div className="product-detail__soldout">Ausverkauft</div>}
            <div className="product-detail__price">
              <span className="current">{formatPrice(displayPrice)}</span>
              {isOnSale && displayCompareAt && <span className="compare">{formatPrice(displayCompareAt)}</span>}
            </div>
            <p className="product-detail__desc">{product.description}</p>
            <div className="product-detail__actions">
              {!isDigitalProduct && (
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
              )}
              <button
                className={`btn btn--primary btn--lg ${isSoldOut ? 'product-detail__cta--soldout' : ''}`}
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
                    className={activeTab === tab ? 'active' : ''}
                    onClick={() => setActiveTab(tab)}
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
          </div>
        </div>
      </div>
    </div>
  );
}