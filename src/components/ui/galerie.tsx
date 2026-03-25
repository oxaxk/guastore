"use client";

import { useState } from "react";

const images = [
  "/img/1.png",
  "/img/2.png",
  "/img/3.png",
  "/img/4.png",
  "/img/5.png",
  "/img/6.png",
  "/img/7.png",
  "/img/8.png",
  "/img/9.png",
];

export default function GalleryExpand() {
  const [expandedImage, setExpandedImage] = useState(3);

  const getCardWidth = (index: number) =>
    index === expandedImage ? "24rem" : "5rem";

  const maxIndex = images.length;

  const setExpandedSafe = (index: number) => {
    const clamped = Math.max(1, Math.min(maxIndex, index));
    setExpandedImage(clamped);
  };

  const moveExpanded = (delta: number) => {
    const next = ((expandedImage - 1 + delta + maxIndex) % maxIndex) + 1;
    setExpandedImage(next);
  };

  return (
    <section className="myg-expand">
      <style>{`
        .myg-expand {
          width: 100%;
          background: #f5f4f3;
          border-radius: 32px;
          padding: 18px;
          border: 1px solid rgba(15, 23, 42, 0.06);
        }
        .myg-expand__stage {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .myg-expand__row {
          width: 100%;
          max-width: 1120px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .myg-expand__card {
          height: clamp(18rem, 42vw, 24rem);
          width: 5rem;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.10);
          background: #f5f4f3;
          cursor: pointer;
          padding: 0;
          transition: width 500ms ease-in-out, transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
        }
        .myg-expand__card:hover {
          transform: translateY(-2px);
          box-shadow: 0 26px 70px rgba(15, 23, 42, 0.16);
          border-color: rgba(46, 117, 100, 0.35);
        }
        .myg-expand__card:focus { outline: none; }
        .myg-expand__card:focus-visible {
          outline: none;
          box-shadow: 0 26px 70px rgba(15, 23, 42, 0.16), 0 0 0 3px rgba(46, 117, 100, 0.32);
          border-color: rgba(46, 117, 100, 0.55);
        }
        .myg-expand__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        @media (max-width: 900px) {
          .myg-expand { padding: 14px; border-radius: 22px; }
          .myg-expand__row { gap: 8px; justify-content: flex-start; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x proximity; }
          .myg-expand__row::-webkit-scrollbar { display: none; }
          .myg-expand__row { scrollbar-width: none; }
          .myg-expand__card { height: 16rem; border-radius: 18px; scroll-snap-align: start; }
        }
      `}</style>

      <div className="myg-expand__stage">
        <div className="myg-expand__row" role="list">
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              className="myg-expand__card"
              style={{ width: getCardWidth(idx + 1) }}
              aria-label={`GUA SHOP Galerie Bild ${idx + 1}`}
              aria-pressed={expandedImage === idx + 1}
              onMouseEnter={() => setExpandedSafe(idx + 1)}
              onFocus={() => setExpandedSafe(idx + 1)}
              onClick={() => setExpandedSafe(idx + 1)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  moveExpanded(-1);
                }
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  moveExpanded(1);
                }
                if (e.key === "Home") {
                  e.preventDefault();
                  setExpandedSafe(1);
                }
                if (e.key === "End") {
                  e.preventDefault();
                  setExpandedSafe(maxIndex);
                }
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedSafe(idx + 1);
                }
              }}
            >
              <img
                className="myg-expand__img"
                src={src}
                alt={`GUA SHOP Galerie Bild ${idx + 1}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}