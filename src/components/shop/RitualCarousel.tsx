import { useRef, useState } from 'react';
import './RitualCarousel.css';

const steps = [
  { title: 'Nacken', description: 'Stein flach ansetzen und von der Schulterbasis zum Haaransatz streichen. Sanft wiederholen.', image: 'a' },
  { title: 'Hals', description: 'An der Halsseite flach anlegen und von der Schulterbasis zum Kiefer streichen. Leichter Druck.', image: 'b' },
  { title: 'Kieferlinie', description: 'Von der Kinnmitte entlang der Kieferlinie bis zum Ohr ausstreichen. Beide Seiten wiederholen.', image: 'c' },
  { title: 'Wangen & Augen', description: 'Unter dem Auge von der Nasenwurzel nach außen streichen. Langsam und sehr sanft.', image: 'd' },
];

export default function RitualCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const go = (index: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, index));
    const item = track.current?.children[next] as HTMLElement | undefined;
    item?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest', inline: 'start' });
    setActive(next);
  };
  return <div className="ritual-carousel">
    <div className="ritual-carousel__track" ref={track} tabIndex={0} aria-label="Vier Schritte der Gua-Sha-Anwendung" onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); } }} onScroll={() => {
      const cards = Array.from(track.current?.children ?? []) as HTMLElement[];
      const left = track.current?.scrollLeft ?? 0;
      const nearest = cards.reduce((best, card, index) => Math.abs(card.offsetLeft - cards[0].offsetLeft - left) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - left) ? index : best, 0);
      setActive(nearest);
    }}>
      {steps.map((step, index) => <article className="ritual-carousel__card" key={step.title}>
        <img src={`/img/${step.image}.png`} alt="" loading="eager" />
        <div><span className="ritual-carousel__number">{String(index + 1).padStart(2, '0')} / 04</span><h3>{step.title}</h3><p>{step.description}</p></div>
      </article>)}
    </div>
    <div className="ritual-carousel__controls"><button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Vorheriger Schritt">←</button><span aria-live="polite">Schritt {active + 1} von 4</span><button type="button" onClick={() => go(active + 1)} disabled={active === 3} aria-label="Nächster Schritt">→</button></div>
  </div>;
}
