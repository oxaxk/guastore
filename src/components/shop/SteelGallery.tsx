import { useEffect, useRef, useState } from 'react';
import { Expand, X } from 'lucide-react';
import './SteelGallery.css';

const photographs = [
  { src: '/img/steel/the-steel-matched-v3.png', label: 'Gesamtansicht', alt: 'The Steel mit spiegelpolierter Vorderseite, asymmetrischer Kontur und feiner Gravur', note: 'Produktansicht' },
  { src: '/img/steel/the-steel-rounded-edge.webp', label: 'Kantendetail', alt: 'Nahansicht der weich gerundeten, polierten Edelstahlkante', note: 'Kante im Detail' },
] as const;

export default function SteelGallery() {
  const [selection, setSelection] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photo = photographs[selection];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const restoreScroll = () => { document.body.style.overflow = ''; };
    dialog.addEventListener('close', restoreScroll);
    return () => { dialog.removeEventListener('close', restoreScroll); restoreScroll(); };
  }, []);

  return (
    <div className="steel-gallery">
      <div className="steel-gallery__stage">
          <button className="steel-gallery__image-button" type="button" aria-label={`${photo.label} vergrößern`} onClick={() => { dialogRef.current?.showModal(); document.body.style.overflow = 'hidden'; }}>
            <img key={photo.src} src={photo.src} alt={photo.alt} width={1254} height={1254} loading="eager" />
            <span className="steel-gallery__expand"><Expand size={17} aria-hidden="true" /></span>
          </button>
        <span className="steel-gallery__caption">{photo.note}</span>
      </div>
      <div className="steel-gallery__choices" aria-label="Produktansichten">
        {photographs.map((item, index) => (
          <button type="button" key={item.src} aria-pressed={selection === index} onClick={() => setSelection(index)}>
            <img src={item.src} alt="" width="80" height="80" loading="lazy" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <dialog className="steel-gallery__lightbox" ref={dialogRef} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
        <button className="steel-gallery__close" type="button" aria-label="Vergrößerung schließen" onClick={() => dialogRef.current?.close()}><X size={24} /></button>
        <img src={photo.src} alt={photo.alt} />
        <p>{photo.note}</p>
      </dialog>
    </div>
  );
}
