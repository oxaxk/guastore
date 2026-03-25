import "./StaticPage.css";
import { useEffect, useMemo, useRef, useState } from "react";

export default function HowTo() {
  const steps = useMemo(
    () => [
      {
        step: 1,
        title: "Nacken",
        desc: "Setze den Stein flach am Nacken an und streiche von der Schulterbasis nach oben Richtung Haaransatz. Wiederhole mit sanftem Druck.",
      },
      {
        step: 2,
        title: "Hals",
        desc: "Platziere den Stein flach an der Seite des Halses und streiche sanft von der Schulterbasis nach oben zum Kiefer. Wiederhole mit leichtem Druck.",
      },
      {
        step: 3,
        title: "Kieferlinie",
        desc: "Platziere den Stein an der Kinnmitte und streiche gleichmäßig entlang der Kieferlinie bis zu den Ohren. Wiederhole sanft auf beiden Seiten.",
      },
      {
        step: 4,
        title: "Augenpartie",
        desc: "Lege den Stein flach unter das Auge und streiche vorsichtig von der Nasenwurzel nach außen zu den Schläfen. Führe die Bewegung langsam und sanft aus.",
      },
      {
        step: 5,
        title: "Wangen & Schläfen",
        desc: "Führe den Stein sanft der Linien nach außen zu den Wangen und bis zu den Schläfen. Arbeite in ruhigen Strichen von der Mitte nach außen.",
      },
    ],
    []
  );

  const stepImg = (step: number) => `/img/${String.fromCharCode(96 + step)}.png`;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Desktop grid (multiple cards) vs mobile carousel
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopCols, setDesktopCols] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsDesktop(w >= 1024);
      setDesktopCols(w >= 1280 ? 4 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scrollToIndex = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const max = steps.length - 1;
    const next = Math.min(Math.max(idx, 0), max);
    const width = el.clientWidth;
    el.scrollTo({ left: width * next, behavior: "smooth" });
    setActiveIndex(next);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onScroll = () => {
      const width = el.clientWidth;
      if (!width) return;
      const idx = Math.round(el.scrollLeft / width);
      if (idx !== activeIndex) setActiveIndex(idx);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeIndex]);

  // ONLY the white card width in the carousel (no image changes)
  const carouselCardStyle: React.CSSProperties = {
    width: "min(620px, 86vw)",
    margin: "0 auto",
  };

  return (
    <div className="static-page">
      <div className="container">
        <h1>Konturen, die bleiben.</h1>
        <p className="lead">
          5 Schritte, 4 Minuten: entspannende Gua-Sha-Massage für Nacken, Hals und Gesicht.
        </p>

        {/* Desktop: show multiple cards */}
        {isDesktop ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${desktopCols}, minmax(0, 1fr))`,
              gap: 16,
              alignItems: "stretch",
              maxWidth: 1100,
              marginLeft: "auto",
              marginRight: "auto",
              marginTop: "2rem",
            }}
          >
            {steps.map((s) => (
              <div key={s.step} className="step-card" style={{ margin: 0 }}>
                <img
                  className="step-image"
                  src={stepImg(s.step)}
                  alt={`Schritt ${s.step}: ${s.title}`}
                  loading="lazy"
                  style={{
                    width: "clamp(92px, 10vw, 128px)",
                    height: "clamp(92px, 10vw, 128px)",
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto 14px",
                  }}
                />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Mobile: carousel */
          <div
            style={{
              position: "relative",
              marginTop: "2rem",
            }}
          >
            <button
              type="button"
              aria-label="Vorheriger Schritt"
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              style={{
                position: "absolute",
                left: "-10px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 5,
                width: 44,
                height: 44,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(17,24,39,0.35)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                cursor: activeIndex === 0 ? "not-allowed" : "pointer",
                opacity: activeIndex === 0 ? 0.35 : 1,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>
                ‹
              </span>
            </button>

            <div
              ref={trackRef}
              style={{
                display: "flex",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                gap: "14px",
                padding: "8px 24px",
              }}
            >
              {steps.map((s) => (
                <div
                  key={s.step}
                  style={{
                    flex: "0 0 100%",
                    scrollSnapAlign: "center",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div className="step-card" style={carouselCardStyle}>
                    <img
                      className="step-image"
                      src={stepImg(s.step)}
                      alt={`Schritt ${s.step}: ${s.title}`}
                      loading="lazy"
                      style={{
                        width: "clamp(92px, 10vw, 128px)",
                        height: "clamp(92px, 10vw, 128px)",
                        objectFit: "contain",
                        display: "block",
                        margin: "0 auto 14px",
                      }}
                    />
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              aria-label="Nächster Schritt"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === steps.length - 1}
              style={{
                position: "absolute",
                right: "-10px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 5,
                width: 44,
                height: 44,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(17,24,39,0.35)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                cursor: activeIndex === steps.length - 1 ? "not-allowed" : "pointer",
                opacity: activeIndex === steps.length - 1 ? 0.35 : 1,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>
                ›
              </span>
            </button>

            <div
              aria-hidden="true"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 14,
              }}
            >
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToIndex(idx)}
                  aria-label={`Zu Schritt ${idx + 1} wechseln`}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    border: "none",
                    background:
                      idx === activeIndex
                        ? "rgba(255,255,255,0.92)"
                        : "rgba(255,255,255,0.28)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10" style={{ marginTop: "5rem" }}>
          <h2 className="text-2xl font-semibold">Dein Look in Bewegung</h2>
          <p className="mt-2 text-sm text-white/80">
            Hover über die Karten, um Details hervorzuheben.
          </p>
          <div className="mt-5" style={{ marginTop: "2rem" }}>
          </div>
        </div>
      </div>
    </div>
  );
}