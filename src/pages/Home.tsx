import './Home.css';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/shop/ProductCard';
import RitualCarousel from '@/components/shop/RitualCarousel';
import { mockProducts, mockCollections } from '@/data/mockData';
import { cataloguePrice, formatPrice, JADE_PRICE_CENTS, STEEL_PRICE_CENTS, SHIPPING_DE_COPY } from '@/lib/commerce';

const benefits = [
  {
    icon: '01',
    title: 'Sauberer Schliff, keine scharfen Kanten',
    description:
      'Jedes Tool hat glatt polierte Kanten, die über die Haut gleiten – statt zu kratzen oder hängen zu bleiben.',
  },
  {
    icon: '02',
    title: 'Gewicht für kontrollierte Züge',
    description:
      'Edelstahl bringt mehr Gewicht, Xiu Jade und Rosenquarz sind etwas leichter – für ruhige, kontrollierte Bewegungen.',
  },
  {
    icon: '03',
    title: 'Fokus auf Gesicht, Hals und Kiefer',
    description:
      'Formen und Radien sind auf Gesicht, Kieferlinie und Nacken ausgelegt – keine zehn Tools, die alles und nichts können.',
  },
  {
    icon: '04',
    title: 'Pflege und Hygiene klar geregelt',
    description:
      'Glatt versiegelte Oberflächen, leicht zu reinigen. Zu jedem Tool gibt es klare Hinweise zu Reinigung und Aufbewahrung.',
  },
];

const ritualSteps = [
  {
    step: 1,
    title: 'Nacken',
    description:
      'Stein flach ansetzen und von der Schulterbasis nach oben zum Haaransatz streichen. Sanft wiederholen.',
  },
  {
    step: 2,
    title: 'Hals',
    description:
      'An der Halsseite flach anlegen und von der Schulterbasis nach oben zum Kiefer streichen. Leichter Druck.',
  },
  {
    step: 3,
    title: 'Kieferlinie',
    description:
      'Von der Kinnmitte entlang der Kieferlinie bis zum Ohr ausstreichen. Beide Seiten wiederholen.',
  },
  {
    step: 4,
    title: 'Wangen & Augen',
    description:
      'Unter dem Auge von der Nasenwurzel nach außen zu den Schläfen streichen. Langsam, sehr sanft.',
  },
];

const heroImages = ['/img/steel/the-steel-matched-v3.png', '/img/guagreen.png', '/img/guarosa.png'];
const HeroProductVisual = ({ index }: { index: number }) => <img className="hero__image-img" src={heroImages[index]} alt={index === 0 ? 'Edelstahl Gua Sha' : index === 1 ? 'Xiu Jade Gua Sha' : 'Rosenquarz Gua Sha'} decoding="async" draggable={false} />;
interface GlowingEffectProps {
  inactiveZone?: number;
  proximity?: number;
  variant?: 'default' | 'white';
  glow?: boolean;
  className?: string;
  disabled?: boolean;
}

const GlowingEffect = memo(
  ({
    inactiveZone = 0.7,
    proximity = 0,
    variant = 'default',
    glow = false,
    className,
    disabled = false,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const targetAngleRef = useRef(0);
    const currentAngleRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    const tick = useCallback(() => {
      const element = containerRef.current;
      if (!element) return;

      const current = currentAngleRef.current;
      const target = targetAngleRef.current;

      const diff = ((target - current + 180) % 360) - 180;
      const next = current + diff * 0.15;

      currentAngleRef.current = next;
      element.style.setProperty('--ge-start', String(next));

      if (Math.abs(diff) > 0.1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    }, []);

    const handleMove = useCallback(
      (e?: PointerEvent | { x: number; y: number }) => {
        const element = containerRef.current;
        if (!element) return;

        const { left, top, width, height, right, bottom } = element.getBoundingClientRect();

        const mouseX = e && 'clientX' in e ? e.clientX : (e?.x ?? lastPosition.current.x);
        const mouseY = e && 'clientY' in e ? e.clientY : (e?.y ?? lastPosition.current.y);

        if (e) lastPosition.current = { x: mouseX, y: mouseY };

        const centerX = left + width * 0.5;
        const centerY = top + height * 0.5;

        const distanceFromCenter = Math.hypot(mouseX - centerX, mouseY - centerY);
        const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

        if (distanceFromCenter < inactiveRadius) {
          element.style.setProperty('--ge-active', '0');
          return;
        }

        const isActive =
          mouseX > left - proximity &&
          mouseX < right + proximity &&
          mouseY > top - proximity &&
          mouseY < bottom + proximity;

        element.style.setProperty('--ge-active', glow ? '1' : isActive ? '1' : '0');
        if (!isActive && !glow) return;

        const targetAngle =
          (180 * Math.atan2(mouseY - centerY, mouseX - centerX)) / Math.PI + 90;

        targetAngleRef.current = targetAngle;

        if (animationFrameRef.current == null) {
          animationFrameRef.current = requestAnimationFrame(tick);
        }
      },
      [inactiveZone, proximity, glow, tick]
    );

    useEffect(() => {
      if (disabled) return;

      const onScroll = () => handleMove();
      const onPointerMove = (e: PointerEvent) => handleMove(e);

      window.addEventListener('scroll', onScroll, { passive: true });
      document.body.addEventListener('pointermove', onPointerMove, { passive: true });

      return () => {
        if (animationFrameRef.current != null) cancelAnimationFrame(animationFrameRef.current);
        window.removeEventListener('scroll', onScroll);
        document.body.removeEventListener('pointermove', onPointerMove);
      };
    }, [handleMove, disabled]);


    const classes = [
      'glowing-effect',
      variant === 'white' ? 'glowing-effect--white' : 'glowing-effect--default',
      disabled ? 'glowing-effect--disabled' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={containerRef} className={classes} aria-hidden="true">
        <div className="glowing-effect__layer" />
      </div>
    );
  }
);

GlowingEffect.displayName = 'GlowingEffect';

export default function Home() {
  const heroStageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame: number | null = null;

    const updateHeroObject = () => {
      frame = null;
      const stage = heroStageRef.current;
      if (!stage) return;

      if (reducedMotion.matches) {
        stage.style.setProperty('--hero-scroll-y', '0px');
        stage.style.setProperty('--hero-scroll-rotate', '0deg');
        return;
      }

      const rect = stage.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = Math.max(-1, Math.min(1, (viewport * 0.52 - rect.top) / viewport));
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      const distance = mobile ? 18 : 44;
      const rotation = mobile ? 1.2 : 2.8;

      stage.style.setProperty('--hero-scroll-y', `${Math.round(progress * distance)}px`);
      stage.style.setProperty('--hero-scroll-rotate', `${(progress * rotation).toFixed(2)}deg`);
    };

    const schedule = () => {
      if (frame == null) frame = window.requestAnimationFrame(updateHeroObject);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reducedMotion.addEventListener('change', schedule);

    return () => {
      if (frame != null) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reducedMotion.removeEventListener('change', schedule);
    };
  }, []);

  const featuredProducts = mockProducts
    .filter((p: any) => {
      const title = String(p?.title ?? '').toLowerCase();
      const handle = String(p?.handle ?? '').toLowerCase();
      const id = String(p?.id ?? '').toLowerCase();
      const hay = `${title} ${handle} ${id}`;
      return !(hay.includes('ebook') || hay.includes('e-book') || hay.includes('e_book') || handle === 'the-rose');
    })
    .slice(0, 3);

  const pickProductHeroImage = (product: any): string | undefined => {
    const title = String(product?.title ?? '').toLowerCase();
    const handle = String(product?.handle ?? '').toLowerCase();
    const id = String(product?.id ?? '').toLowerCase();

    const hay = `${title} ${handle} ${id}`;

    if (hay.includes('edelstahl') || hay.includes('steel') || hay.includes('stainless')) return '/img/steel/the-steel-matched-v3.png';
    if (hay.includes('jade') || hay.includes('green')) return '/img/guagreen.png';
    if (hay.includes('rosen') || hay.includes('quarz') || hay.includes('rose') || hay.includes('rosa')) return '/img/guarosa.png';

    return undefined;
  };

  const withImageOverride = (product: any) => {
    const override = pickProductHeroImage(product);

    const title = String(product?.title ?? '').toLowerCase();
    const handle = String(product?.handle ?? '').toLowerCase();
    const id = String(product?.id ?? '').toLowerCase();
    const hay = `${title} ${handle} ${id}`;

    let cheapPrice: number = cataloguePrice(product.handle, product.price);

    // strike-through "was" price
    let compareAt: any = undefined;

    // Sold out override for rosenquarz
    const isRosenSoldOut =
      hay.includes('rosen') ||
      hay.includes('quarz') ||
      hay.includes('rose') ||
      hay.includes('rosa');

    const base = {
      ...product,
      price: cheapPrice,
      priceAmount: cheapPrice,
      amount: cheapPrice,
      compareAtPrice: compareAt,
      compareAtPriceAmount: compareAt,
      compare_at_price: compareAt,
      originalPrice: compareAt,
      oldPrice: compareAt,
      priceWas: compareAt,
      priceCompare: compareAt,
      availableForSale: isRosenSoldOut ? false : (product as any)?.availableForSale ?? true,
      soldOut: isRosenSoldOut ? true : (product as any)?.soldOut,
      isSoldOut: isRosenSoldOut ? true : (product as any)?.isSoldOut,
      quantityAvailable: isRosenSoldOut ? 0 : (product as any)?.quantityAvailable,
      inventoryQuantity: isRosenSoldOut ? 0 : (product as any)?.inventoryQuantity,
    };

    if (!override) return base;

    return {
      ...base,
      image: override,
      images: Array.isArray(product?.images)
        ? [override, ...product.images.filter(Boolean)]
        : [override],
      featuredImage: override,
      thumbnail: override,
    };
  };
  const heroProductMeta = [
    {
      key: 'edelstahl',
      label: 'Edelstahl Gua Sha',
      href: '/shop/product/the-steel',
      priceDisplay: formatPrice(STEEL_PRICE_CENTS / 100),
    },
    {
      key: 'jade',
      label: 'Xiu Jade Gua Sha',
      href: '/shop/product/the-jade',
      priceDisplay: formatPrice(JADE_PRICE_CENTS / 100),
    },
    {
      key: 'rosenquarz',
      label: 'Rosenquarz Gua Sha',
      href: '/shop/product/the-rose',
      priceDisplay: 'Ausverkauft',
      soldOut: true,
    },
  ];


  const pickHeroPrice = (idx: number) => {
    const meta = heroProductMeta[idx];
    if (!meta) return '';
    if (meta?.soldOut) return '';
    return meta.priceDisplay;
  };
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  useEffect(() => {
    document.documentElement.dataset.stone = ['steel', 'jade', 'rose'][activeHeroSlide];
  }, [activeHeroSlide]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sections = document.querySelectorAll<HTMLElement>('.home > section:not(.hero)');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('section--visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    sections.forEach(section => { section.classList.add('section--reveal'); observer.observe(section); });
    return () => { observer.disconnect(); sections.forEach(section => section.classList.remove('section--reveal', 'section--visible')); };
  }, []);
  const [heroTargetSlide, setHeroTargetSlide] = useState<number | null>(null);
  // Add ref to mirror activeHeroSlide and keep in sync
  const activeHeroSlideRef = useRef(0);
  useEffect(() => {
    activeHeroSlideRef.current = activeHeroSlide;
  }, [activeHeroSlide]);
  const [heroPrevSlide, setHeroPrevSlide] = useState(0);
  const [heroAnimDirection, setHeroAnimDirection] = useState<'next' | 'prev' | null>(null);
  const heroAnimTimeoutRef = useRef<number | null>(null);
  const heroIsAnimatingRef = useRef(false);
  const heroTouchStartXRef = useRef<number | null>(null);
  const [heroAnimPhase, setHeroAnimPhase] = useState<'idle' | 'prep' | 'run'>('idle');
  const heroAnimRafRef = useRef<number | null>(null);
  const heroWheelLockRef = useRef(0);
  const handleHeroWheel = (e: React.WheelEvent) => {
    // Trackpads send horizontal swipe as deltaX.
    const dx = e.deltaX;
    const dy = e.deltaY;
    if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy)) return;

    const now = Date.now();
    if (now - heroWheelLockRef.current < 420) {
      e.preventDefault();
      return;
    }

    heroWheelLockRef.current = now;
    e.preventDefault();

    if (dx > 0) {
      goToHeroSlide('next');
    } else {
      goToHeroSlide('prev');
    }
  };

  const goToHeroSlide = (direction: 'next' | 'prev', selectedIndex?: number) => {
    if (heroIsAnimatingRef.current) return;

    const currentIndex = activeHeroSlideRef.current;
    const lastIndex = heroImages.length - 1;
    const nextIndex = selectedIndex ?? (direction === 'next'
        ? currentIndex === lastIndex
          ? 0
          : currentIndex + 1
        : currentIndex === 0
          ? lastIndex
          : currentIndex - 1);
    if (nextIndex === currentIndex) return;

    setHeroPrevSlide(currentIndex);
    setHeroTargetSlide(nextIndex);
    setHeroAnimDirection(direction);
    setHeroAnimPhase('prep');
    heroIsAnimatingRef.current = true;

    if (heroAnimTimeoutRef.current != null) {
      window.clearTimeout(heroAnimTimeoutRef.current);
    }

    if (heroAnimRafRef.current != null) {
      window.cancelAnimationFrame(heroAnimRafRef.current);
      heroAnimRafRef.current = null;
    }

    heroAnimRafRef.current = window.requestAnimationFrame(() => {
      setHeroAnimPhase('run');
      heroAnimRafRef.current = null;
    });

    heroAnimTimeoutRef.current = window.setTimeout(() => {
      setActiveHeroSlide(nextIndex);
      setHeroTargetSlide(null);
      setHeroAnimDirection(null);
      setHeroAnimPhase('idle');
      heroIsAnimatingRef.current = false;
      heroAnimTimeoutRef.current = null;
    }, 520);
  };

  const handleHeroTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    heroTouchStartXRef.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = (e: React.TouchEvent) => {
    const startX = heroTouchStartXRef.current;
    if (startX == null || !e.changedTouches || e.changedTouches.length === 0) return;

    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;

    const threshold = 40;
    if (diffX > threshold) {
      goToHeroSlide('prev');
    } else if (diffX < -threshold) {
      goToHeroSlide('next');
    }

    heroTouchStartXRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (heroAnimTimeoutRef.current != null) {
        window.clearTimeout(heroAnimTimeoutRef.current);
      }
      if (heroAnimRafRef.current != null) {
        window.cancelAnimationFrame(heroAnimRafRef.current);
      }
    };
  }, []);

  const categories = mockCollections.slice(0, 3);
  const [activeProductSlide, setActiveProductSlide] = useState(0);
  const productsCarouselRef = useRef<HTMLDivElement | null>(null);
  const [activeCategorySlide, setActiveCategorySlide] = useState(0);
  const categoriesCarouselRef = useRef<HTMLDivElement | null>(null);

  const [activeBenefitSlide, setActiveBenefitSlide] = useState(0);
  const benefitsCarouselRef = useRef<HTMLDivElement | null>(null);

  const scrollToProductSlide = (targetIndex: number) => {
    const container = productsCarouselRef.current;
    if (!container) return;

    const maxIndex = featuredProducts.length - 1;
    const clampedIndex = Math.min(Math.max(targetIndex, 0), maxIndex);
    const width = container.clientWidth;

    if (!width) return;

    container.scrollTo({
      left: width * clampedIndex,
      behavior: 'smooth',
    });

    setActiveProductSlide(clampedIndex);
  };

  const handleProductsCarouselScroll = () => {
    const container = productsCarouselRef.current;
    if (!container) return;

    const width = container.clientWidth;
    if (!width) return;

    const index = Math.round(container.scrollLeft / width);
    if (index !== activeProductSlide) {
      setActiveProductSlide(index);
    }
  };

  const scrollToBenefitSlide = (targetIndex: number) => {
    const container = benefitsCarouselRef.current;
    if (!container) return;

    const maxIndex = benefits.length - 1;
    const clampedIndex = Math.min(Math.max(targetIndex, 0), maxIndex);
    const width = container.clientWidth;

    if (!width) return;

    container.scrollTo({
      left: width * clampedIndex,
      behavior: 'smooth',
    });

    setActiveBenefitSlide(clampedIndex);
  };

  const handleBenefitsCarouselScroll = () => {
    const container = benefitsCarouselRef.current;
    if (!container) return;

    const width = container.clientWidth;
    if (!width) return;

    const index = Math.round(container.scrollLeft / width);
    if (index !== activeBenefitSlide) {
      setActiveBenefitSlide(index);
    }
  };

  const scrollToCategorySlide = (targetIndex: number) => {
    const container = categoriesCarouselRef.current;
    if (!container) return;
    const maxIndex = categories.length - 1;
    const clampedIndex = Math.min(Math.max(targetIndex, 0), maxIndex);
    const width = container.clientWidth;
    if (!width) return;
    container.scrollTo({
      left: width * clampedIndex,
      behavior: 'smooth',
    });
    setActiveCategorySlide(clampedIndex);
  };

  const handleCategoriesCarouselScroll = () => {
    const container = categoriesCarouselRef.current;
    if (!container) return;
    const width = container.clientWidth;
    if (!width) return;
    const index = Math.round(container.scrollLeft / width);
    if (index !== activeCategorySlide) {
      setActiveCategorySlide(index);
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero__container">
          <div className="hero__content">
            {/* <span className="hero__eyebrow">Definiere · Jede · Kurve</span> */}
            <h1 className="hero__title">Definiere. Jede. Kurve.</h1>
            <p className="hero__subtitle">
              Drei Materialien, ein ruhiges Ritual. Entdecke Gua Sha für Gesicht und Hals.
            </p>
            <div className="hero__actions">
              <Link to="/shop" className="btn btn--primary btn--lg btn--shimmer" aria-label="Zum Shop">
                Zum Shop
              </Link>
              <Link to="/how-to" className="btn btn--secondary btn--lg btn--shimmer" aria-label="Zur Anleitung">
                Anleitung
              </Link>
            </div>
            <div className="hero__trust">
              {['Edelstahl', 'Xiu Jade', 'Rosenquarz'].map((label, index) => (
                <button key={label} type="button" className="hero__trust-badge hero__trust-badge--link" aria-pressed={activeHeroSlide === index} onClick={() => goToHeroSlide(index > activeHeroSlide ? 'next' : 'prev', index)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="hero__image">
            <div className="hero__image-row">
              <button
                type="button"
                className="hero__image-arrow hero__image-arrow--prev"
                onClick={() => goToHeroSlide('prev')}
                aria-label="Vorheriger Gua-Sha-Stein"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                <svg
                  className="hero__image-arrowIcon"
                  width="28"
                  height="28"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M19 6 L9 16 L19 26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div
                className="hero__image-stage"
                ref={heroStageRef}
                aria-hidden="true"
                onTouchStart={handleHeroTouchStart}
                onTouchEnd={handleHeroTouchEnd}
                onWheel={handleHeroWheel}
              >
                {heroAnimDirection ? (() => {
                  const isNext = heroAnimDirection === 'next';

                  const outgoingFrom = 'translateX(0%)';
                  const outgoingTo = isNext ? 'translateX(-110%)' : 'translateX(110%)';

                  const incomingFrom = isNext ? 'translateX(110%)' : 'translateX(-110%)';
                  const incomingTo = 'translateX(0%)';

                  const shouldRun = heroAnimPhase === 'run';
                  const transition = shouldRun
                    ? 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), filter 520ms cubic-bezier(0.22, 1, 0.36, 1)'
                    : 'none';

                  return (
                    <>
                      <div
                        className="hero__image-slide hero__image-slide--from"
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          transform: shouldRun ? outgoingTo : outgoingFrom,
                          opacity: shouldRun ? 0 : 1,
                          filter: shouldRun ? 'blur(8px)' : 'blur(0px)',
                          transition,
                          willChange: 'transform, opacity, filter',
                          pointerEvents: 'none',
                        }}
                      >
                        <HeroProductVisual index={heroPrevSlide} />
                      </div>

                      <div
                        className="hero__image-slide hero__image-slide--to"
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          transform: shouldRun ? incomingTo : incomingFrom,
                          opacity: shouldRun ? 1 : 0,
                          filter: shouldRun ? 'blur(0px)' : 'blur(8px)',
                          transition,
                          willChange: 'transform, opacity, filter',
                          pointerEvents: 'none',
                        }}
                      >
                        <HeroProductVisual index={heroTargetSlide ?? activeHeroSlide} />
                      </div>
                    </>
                  );
                })() : (
                  <div
                    className="hero__image-slide hero__image-slide--active"
                    style={{ position: 'absolute', inset: 0, transform: 'translateX(0%)', opacity: 1, filter: 'blur(0px)', transition: 'none', willChange: 'auto' }}
                  >
                    <HeroProductVisual index={activeHeroSlide} />
                  </div>
                )}
              </div>
              <button
                type="button"
                className="hero__image-arrow hero__image-arrow--next"
                onClick={() => goToHeroSlide('next')}
                aria-label="Nächster Gua-Sha-Stein"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                <svg
                  className="hero__image-arrowIcon"
                  width="28"
                  height="28"
                  viewBox="0 0 32 32"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M13 6 L23 16 L13 26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="hero__image-meta">
              {(() => {
                const isHeroSoldOut = !!heroProductMeta[activeHeroSlide]?.soldOut;
                return (
                  <Link
                    to={heroProductMeta[activeHeroSlide]?.href ?? '/shop'}
                    className="hero__eyebrow hero__eyebrow--underImage"
                    aria-label={`${heroProductMeta[activeHeroSlide]?.label ?? 'Gua Sha'} – ${pickHeroPrice(activeHeroSlide)}`}
                  >
                    <span
                      className="hero__eyebrowLabel"
                      style={{
                        opacity: heroAnimDirection ? (heroAnimPhase === 'run' ? 0 : 1) : 1,
                        transform: heroAnimDirection ? (heroAnimPhase === 'run' ? 'translateY(2px)' : 'translateY(0)') : 'translateY(0)',
                        transition: 'opacity 220ms ease, transform 220ms ease',
                      }}
                    >
                      {heroProductMeta[activeHeroSlide]?.label ?? 'Gua Sha'}
                    </span>
                    <span
                      className="hero__eyebrowPrice"
                      style={{
                        opacity: heroAnimDirection ? (heroAnimPhase === 'run' ? 0 : 1) : 1,
                        transform: heroAnimDirection ? (heroAnimPhase === 'run' ? 'translateY(2px)' : 'translateY(0)') : 'translateY(0)',
                        transition: 'opacity 220ms ease, transform 220ms ease',
                        color: isHeroSoldOut ? '#4b5563' : undefined,
                      }}
                    >
                      {isHeroSoldOut ? 'Ausverkauft' : pickHeroPrice(activeHeroSlide)}
                    </span>
                  </Link>
                );
              })()}
              {!heroProductMeta[activeHeroSlide]?.soldOut && <p className="hero__shipping">{SHIPPING_DE_COPY}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="section home-products">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Kleine Auswahl. Klare Entscheidung.</h2>
            <p className="section-subtitle">
              Zwei verfügbare Tools mit klarer Materialwahl.
            </p>
          </div>

          <div className="home-products__carousel">
            <button
              type="button"
              className="home-products__arrow home-products__arrow--prev btn--shimmer"
              onClick={() => scrollToProductSlide(activeProductSlide - 1)}
              aria-label="Vorheriges Produkt"
              disabled={activeProductSlide === 0}
            >
              <span aria-hidden="true">‹</span>
            </button>

            <div
              className="home-products__carousel-track"
              ref={productsCarouselRef}
              onScroll={handleProductsCarouselScroll}
            >
              {featuredProducts.map((product) => (
                <div key={product.id} className="home-products__carousel-slide">
                  <ProductCard product={withImageOverride(product)} />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="home-products__arrow home-products__arrow--next btn--shimmer"
              onClick={() => scrollToProductSlide(activeProductSlide + 1)}
              aria-label="Nächstes Produkt"
              disabled={activeProductSlide === featuredProducts.length - 1}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div className="home-products__dots">
            {featuredProducts.map((product, index) => (
              <button
                key={product.id}
                type="button"
                className={
                  index === activeProductSlide
                    ? 'home-products__dot home-products__dot--active'
                    : 'home-products__dot'
                }
                onClick={() => scrollToProductSlide(index)}
                aria-label={`Zu Produkt ${index + 1} wechseln`}
              />
            ))}
          </div>

          <div className="home-products__cta">
            <Link to="/shop" className="btn btn--secondary btn--lg btn--shimmer">
              Alle Produkte
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section benefits">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Was du erwarten kannst</h2>
            <p className="section-subtitle">
              Material, Form und Pflege auf einen Blick.
            </p>
          </div>
          <div className="home-products__carousel benefits__carousel">
            <div
              className="home-products__carousel-track benefits__carousel-track"
              ref={benefitsCarouselRef}
              onScroll={handleBenefitsCarouselScroll}
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="home-products__carousel-slide benefits__carousel-slide">
                  <div
                    className="benefits__card-shell"
                    style={{
                      width: 'min(560px, 86vw)',
                      margin: '0 auto',
                    }}
                  >
                    <div className="benefit-card">
                      <GlowingEffect
                        className="benefit-card__glow"
                        proximity={80}
                        inactiveZone={0.55}
                        disabled={false}
                      />
                      <span className="benefit-card__icon">{benefit.icon}</span>
                      <h3 className="benefit-card__title">{benefit.title}</h3>
                      <p className="benefit-card__description">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="benefits__controls">
            <button
              type="button"
              className="home-products__arrow btn--shimmer"
              onClick={() => scrollToBenefitSlide(activeBenefitSlide - 1)}
              aria-label="Vorheriger Punkt"
              disabled={activeBenefitSlide === 0}
              style={{ position: 'static', transform: 'none', display: 'inline-flex' }}
            >
              <span aria-hidden="true">‹</span>
            </button>

            <div className="home-products__dots benefits__dots">
              {benefits.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={
                    index === activeBenefitSlide
                      ? 'home-products__dot home-products__dot--active'
                      : 'home-products__dot'
                  }
                  onClick={() => scrollToBenefitSlide(index)}
                  aria-label={`Zu Punkt ${index + 1} wechseln`}
                />
              ))}
            </div>

            <button
              type="button"
              className="home-products__arrow btn--shimmer"
              onClick={() => scrollToBenefitSlide(activeBenefitSlide + 1)}
              aria-label="Nächster Punkt"
              disabled={activeBenefitSlide === benefits.length - 1}
              style={{ position: 'static', transform: 'none', display: 'inline-flex' }}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>

      {/* Ritual Teaser Section */}
      <section className="section ritual-teaser">
        <div className="container">
          <div className="ritual-teaser__content">
            <div className="section-header">
              <h2 className="section-title">Dein Ritual, Schritt für Schritt.</h2>
              <p className="section-subtitle">
                Ein klarer Ablauf für Gesicht und Hals, der in wenigen Minuten machbar ist.
              </p>
            </div>
            <RitualCarousel />
            <Link to="/how-to" className="btn btn--primary btn--lg btn--shimmer">
              Anleitung öffnen
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}

      {/* Newsletter Section */}
      <section className="section newsletter">
        <div className="container">
          <div className="newsletter__content">
            <h2 className="newsletter__title">Restocks & kurze Tipps.</h2>
            <p className="newsletter__subtitle">Die Newsletter-Anmeldung ist derzeit nicht verfügbar. Für Produkt- und Bestellfragen erreichst du uns per E-Mail.</p>
            <Link to="/contact" className="btn btn--primary btn--shimmer">Kontakt öffnen</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
