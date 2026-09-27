import './Home.css';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/shop/ProductCard';
import { mockProducts, mockCollections } from '@/data/mockData';

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
      'Edelstahl bringt mehr Gewicht, Jade und Rosenquarz sind etwas leichter – für ruhige, kontrollierte Bewegungen.',
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

const heroImages = ['/img/guasteal.png', '/img/guagreen.png', '/img/guarosa.png'];
const reviews = [
  {
    name: 'Mara',
    text: 'Der Edelstahl-Gua-Sha liegt stabil in der Hand und bleibt lange kühl. Nutze ihn jeden Morgen gegen Schwellung.',
    rating: 5,
  },
  {
    name: 'Elif',
    text: 'Mit dem Jade-Tool bin ich gut reingekommen. Die Abläufe sind klar erklärt und realistisch im Alltag einplanbar.',
    rating: 5,
  },
  {
    name: 'Laura',
    text:
      'Ein paar Minuten am Abend mit dem Rosenquarz-Gua-Sha lösen merkbar Spannung im Kiefer. Genau dafür wollte ich das Tool.',
    rating: 5,
  },
];

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
      return !(hay.includes('ebook') || hay.includes('e-book') || hay.includes('e_book'));
    })
    .slice(0, 3);

  const pickProductHeroImage = (product: any): string | undefined => {
    const title = String(product?.title ?? '').toLowerCase();
    const handle = String(product?.handle ?? '').toLowerCase();
    const id = String(product?.id ?? '').toLowerCase();

    const hay = `${title} ${handle} ${id}`;

    if (hay.includes('edelstahl') || hay.includes('steel') || hay.includes('stainless')) return '/img/guasteal.png';
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

    // cheap homepage pricing (display + card)
    let cheapPrice: any = product?.price;
    if (hay.includes('edelstahl') || hay.includes('steel') || hay.includes('stainless')) cheapPrice = 11.95;
    if (hay.includes('jade') || hay.includes('green')) cheapPrice = 9.95;
    if (hay.includes('rosen') || hay.includes('quarz') || hay.includes('rose') || hay.includes('rosa')) cheapPrice = 11.95;

    // strike-through "was" price
    let compareAt: any = undefined;
    if (hay.includes('edelstahl') || hay.includes('steel') || hay.includes('stainless')) compareAt = 15.9;
    if (hay.includes('jade') || hay.includes('green')) compareAt = 12.9;
    if (hay.includes('rosen') || hay.includes('quarz') || hay.includes('rose') || hay.includes('rosa')) compareAt = 15.95;

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
      href: '/shop#edelstahl-gua-sha',
      priceDisplay: '11,95 €',
    },
    {
      key: 'jade',
      label: 'Jade Gua Sha',
      href: '/shop#jade-gua-sha',
      priceDisplay: '9,95 €',
    },
    {
      key: 'rosenquarz',
      label: 'Rosenquarz Gua Sha',
      href: '/shop#rosenquarz-gua-sha',
      priceDisplay: '11,95 €',
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
  const heroAutoTimerRef = useRef<number | null>(null);
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

  const goToHeroSlide = (direction: 'next' | 'prev') => {
    if (heroIsAnimatingRef.current) return;

    const currentIndex = activeHeroSlideRef.current;
    const lastIndex = heroImages.length - 1;
    const nextIndex =
      direction === 'next'
        ? currentIndex === lastIndex
          ? 0
          : currentIndex + 1
        : currentIndex === 0
          ? lastIndex
          : currentIndex - 1;

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

  useEffect(() => {
    if (heroAutoTimerRef.current != null) {
      window.clearInterval(heroAutoTimerRef.current);
      heroAutoTimerRef.current = null;
    }

    heroAutoTimerRef.current = window.setInterval(() => {
      if (heroIsAnimatingRef.current) return;
      goToHeroSlide('next');
    }, 4000);

    return () => {
      if (heroAutoTimerRef.current != null) {
        window.clearInterval(heroAutoTimerRef.current);
        heroAutoTimerRef.current = null;
      }
    };
  }, []);

  const categories = mockCollections.slice(0, 3);
  const [activeProductSlide, setActiveProductSlide] = useState(0);
  const productsCarouselRef = useRef<HTMLDivElement | null>(null);
  const [activeCategorySlide, setActiveCategorySlide] = useState(0);
  const [activeReviewSlide, setActiveReviewSlide] = useState(0);
  const categoriesCarouselRef = useRef<HTMLDivElement | null>(null);
  const reviewsCarouselRef = useRef<HTMLDivElement | null>(null);

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

  const scrollToReviewSlide = (targetIndex: number) => {
    const container = reviewsCarouselRef.current;
    if (!container) return;
    const maxIndex = reviews.length - 1;
    const clampedIndex = Math.min(Math.max(targetIndex, 0), maxIndex);
    const width = container.clientWidth;
    if (!width) return;
    container.scrollTo({
      left: width * clampedIndex,
      behavior: 'smooth',
    });
    setActiveReviewSlide(clampedIndex);
  };

  const handleReviewsCarouselScroll = () => {
    const container = reviewsCarouselRef.current;
    if (!container) return;
    const width = container.clientWidth;
    if (!width) return;
    const index = Math.round(container.scrollLeft / width);
    if (index !== activeReviewSlide) {
      setActiveReviewSlide(index);
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
              Blitzschnelle Lieferung in Deutschland. Gua Sha Steine für deine tägliche Gesichtsmassage – für Kiefer, Wangen und Hals.
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
              <Link to="/shop#edelstahl-gua-sha" className="hero__trust-badge hero__trust-badge--link">
                Edelstahl Gua Sha
              </Link>
              <Link to="/shop#jade-gua-sha" className="hero__trust-badge hero__trust-badge--link">
                Jade Gua Sha
              </Link>
              <Link to="/shop#rosenquarz-gua-sha" className="hero__trust-badge hero__trust-badge--link">
                Rosenquarz Gua Sha
              </Link>
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
                        <img
                          className="hero__image-img"
                          src={heroImages[heroPrevSlide]}
                          alt=""
                          decoding="async"
                          draggable={false}
                        />
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
                        <img
                          className="hero__image-img"
                          src={heroImages[heroTargetSlide ?? activeHeroSlide]}
                          alt=""
                          decoding="async"
                          draggable={false}
                        />
                      </div>
                    </>
                  );
                })() : (
                  <div
                    className="hero__image-slide hero__image-slide--active"
                    style={{ position: 'absolute', inset: 0, transform: 'translateX(0%)', opacity: 1, filter: 'blur(0px)', transition: 'none', willChange: 'auto' }}
                  >
                    <img
                      className="hero__image-img"
                      src={heroImages[activeHeroSlide]}
                      alt="Gua Sha Stein"
                      decoding="async"
                      draggable={false}
                    />
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
                      {isHeroSoldOut ? 'Ausverkauft' : `${pickHeroPrice(activeHeroSlide)} inkl. Versand`}
                    </span>
                  </Link>
                );
              })()}
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
              Drei Tools. Alles, was du brauchst – ohne Variantenchaos.
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
              Was unsere Tools realistisch leisten – ohne Filter, ohne Übertreibung.
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
              <h2 className="section-title">4 Schritte. 4 Minuten.</h2>
              <p className="section-subtitle">
                Ein klarer Ablauf für Gesicht und Hals, der in wenigen Minuten machbar ist.
              </p>
            </div>
            <div className="ritual-teaser__steps">
              {ritualSteps.map((item) => {
                const imgName = String.fromCharCode(96 + item.step); // 1->a, 2->b, 3->c, 4->d
                return (
                  <div key={item.step} className="ritual-step">
                    <img
                      className="ritual-step__image"
                      src={`/img/${imgName}.png`}
                      alt={`${item.step}. ${item.title}`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                    <div className="ritual-step__content">
                      <h4 className="ritual-step__title">{item.title}</h4>
                      <p className="ritual-step__description">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/how-to" className="btn btn--primary btn--lg btn--shimmer">
              Anleitung öffnen
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}

      {/* Reviews Section */}
      <section className="section reviews">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Stimmen aus der Praxis</h2>
          </div>
          {/* Desktop-only grid */}
          <div className="reviews__grid reviews__grid--desktop reviews__grid--desktop-only">
            {reviews.map((review, index) => (
              <div key={index} className="review-card review-card--grid">
                <GlowingEffect
                  className="review-card__glow"
                  proximity={90}
                  inactiveZone={0.55}
                  variant="white"
                  disabled={false}
                />
                <div className="review-card__rating">{'★'.repeat(review.rating)}</div>
                <p className="review-card__text">"{review.text}"</p>
                <span className="review-card__author">— {review.name}</span>
              </div>
            ))}
          </div>
          {/* Mobile-only carousel */}
          <div className="reviews__carousel reviews__carousel--mobile reviews__carousel--mobile-only">
            <div className="reviews__carousel-inner home-products__carousel">
              <button
                type="button"
                className="home-products__arrow home-products__arrow--prev reviews__arrow--prev btn--shimmer"
                onClick={() => scrollToReviewSlide(activeReviewSlide - 1)}
                aria-label="Vorherige Bewertung"
                disabled={activeReviewSlide === 0}
              >
                <span aria-hidden="true">‹</span>
              </button>

              <div
                className="home-products__carousel-track reviews__carousel-track"
                ref={reviewsCarouselRef}
                onScroll={handleReviewsCarouselScroll}
              >
                {reviews.map((review, index) => (
                  <div key={index} className="home-products__carousel-slide reviews__carousel-slide">
                    <div className="review-card review-card--carousel">
                      <GlowingEffect
                        className="review-card__glow"
                        proximity={90}
                        inactiveZone={0.55}
                        variant="white"
                        disabled={false}
                      />
                      <div className="review-card__rating">{'★'.repeat(review.rating)}</div>
                      <p className="review-card__text">"{review.text}"</p>
                      <span className="review-card__author">— {review.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="home-products__arrow home-products__arrow--next reviews__arrow--next btn--shimmer"
                onClick={() => scrollToReviewSlide(activeReviewSlide + 1)}
                aria-label="Nächste Bewertung"
                disabled={activeReviewSlide === reviews.length - 1}
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>

            <div className="home-products__dots reviews__dots">
              {reviews.map((review, index) => (
                <button
                  key={index}
                  type="button"
                  className={`
                    home-products__dot
                    ${index === activeReviewSlide ? 'home-products__dot--active' : ''}
                  `.trim()}
                  onClick={() => scrollToReviewSlide(index)}
                  aria-label={`Zu Bewertung ${index + 1} wechseln`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section newsletter">
        <div className="container">
          <div className="newsletter__content">
            <h2 className="newsletter__title">Restocks & kurze Tipps.</h2>
            <p className="newsletter__subtitle">Seltene Mails. Nur wenn es wirklich relevant ist.</p>
            <form className="newsletter__form" onSubmit={(e) => e.preventDefault()}>
              <div className="newsletter__input-group">
                <input
                  type="email"
                  className="input newsletter__input"
                  placeholder="Deine E-Mail-Adresse"
                  required
                />
                <button type="submit" className="btn btn--primary btn--shimmer">
                  Anmelden
                </button>
              </div>
              <label className="checkbox-wrapper newsletter__consent">
                <input type="checkbox" className="checkbox" required />
                <span className="checkbox-label">
                  Ich stimme dem Erhalt des Newsletters zu und habe die{' '}
                  <Link to="/legal/datenschutz">Datenschutzerklärung</Link> gelesen.
                </span>
              </label>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
