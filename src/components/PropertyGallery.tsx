import { useEffect, useRef, useState, ViewTransition } from 'react';
import type { KeyboardEvent } from 'react';
import './PropertyGallery.css';
import Photo from './Photo';
import { photoSrc } from '../utils/photos';

interface GalleryProps {
  photos: string[];
  title: string;
  // Foto que se pone si una no carga
  fallback: string;
  // Nombre de la transición de la foto de portada (la misma que en el anuncio, para que "vuele" hasta aquí)
  transitionName: string;
  badge?: string;
}

// Fotos que se ven a la vez en el mosaico del ordenador. El resto, en la galería a pantalla completa
const MOSAIC = 5;

// Galería de la ficha: en el ordenador, un mosaico con la portada grande; en el móvil, un carrusel que se
// pasa con el dedo. Cualquier foto abre el visor a pantalla completa.
function PropertyGallery({ photos, title, fallback, transitionName, badge }: GalleryProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const total = photos.length;

  // Carrusel del móvil: el contador sigue a la foto que se está viendo
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const index = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
    if (index !== current) setCurrent(index);
  }

  return (
    <div className="gallery" data-count={Math.min(total, MOSAIC)}>
      <div className="gallery-grid" onScroll={handleScroll}>
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            className="gallery-item"
            onClick={() => setOpen(i)}
            aria-label={total > 1 ? `Ver la foto ${i + 1} de ${total} a pantalla completa` : 'Ver la foto a pantalla completa'}
          >
            {i === 0 ? (
              <ViewTransition name={transitionName} share="morph" default="none">
                <Photo src={src} fallback={fallback} alt={title} width={1200} height={800} fetchPriority="high" sizes="(max-width: 900px) 100vw, 60vw" />
              </ViewTransition>
            ) : (
              <Photo src={src} fallback={fallback} pixels={800} alt="" width={800} height={600} loading="lazy" sizes="(max-width: 900px) 100vw, 22vw" />
            )}
          </button>
        ))}
      </div>

      {badge && <span className="gallery-badge">{badge}</span>}
      {total > 1 && (
        <>
          <span className="gallery-count" aria-hidden="true">
            {current + 1} / {total}
          </span>
          <button type="button" className="gallery-all" onClick={() => setOpen(0)}>
            Ver las {total} fotos
          </button>
        </>
      )}

      {open !== null && <Lightbox photos={photos} start={open} title={title} fallback={fallback} onClose={() => setOpen(null)} />}
    </div>
  );
}

// Visor a pantalla completa: flechas del teclado, deslizar con el dedo, miniaturas y Esc para cerrar.
// Es un <dialog>: el foco se queda dentro mientras está abierto y vuelve a la foto al cerrarlo
function Lightbox({ photos, start, title, fallback, onClose }: { photos: string[]; start: number; title: string; fallback: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const [index, setIndex] = useState(start);
  const total = photos.length;

  // Se abre al montarse y se cierra al desmontarse (al cerrar, el foco vuelve a la foto que lo abrió).
  // No se escucha el evento "close" del <dialog>: en desarrollo React monta dos veces y ese evento,
  // que llega tarde, cerraría el visor nada más abrirlo. Esc se recoge con "cancel"
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
      previous?.focus?.();
    };
  }, []);

  // La anterior y la siguiente se cargan ya, para que el paso de una a otra sea inmediato.
  // La miniatura de la foto actual se mantiene a la vista
  useEffect(() => {
    for (const i of [index + 1, index - 1]) {
      const img = new Image();
      img.src = photoSrc(photos[(i + total) % total], 1600);
    }
    const thumb = thumbsRef.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [index, photos, total]);

  function go(delta: number) {
    setIndex((i) => (i + delta + total) % total);
  }

  function close() {
    onClose();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={`Fotos de ${title}`}
      onKeyDown={handleKeyDown}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="lightbox-top">
        <p className="lightbox-count" aria-live="polite">
          {index + 1} / {total}
        </p>
        <p className="lightbox-title">{title}</p>
        <button type="button" className="lightbox-close" onClick={close}>
          Cerrar
        </button>
      </div>

      <div
        className="lightbox-stage"
        onClick={(e) => {
          // Un toque fuera de la foto cierra el visor
          if (e.target === e.currentTarget) close();
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40 && total > 1) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <Photo
          key={photos[index]}
          src={photos[index]}
          fallback={fallback}
          pixels={1600}
          sizes="100vw"
          alt={total > 1 ? `${title}, foto ${index + 1} de ${total}` : title}
        />
        {total > 1 && (
          <>
            <button type="button" className="lightbox-nav lightbox-prev" onClick={() => go(-1)} aria-label="Foto anterior">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" className="lightbox-nav lightbox-next" onClick={() => go(1)} aria-label="Foto siguiente">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="lightbox-thumbs" ref={thumbsRef}>
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === index ? 'is-active' : ''}
              aria-label={`Foto ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
            >
              <Photo src={src} fallback={fallback} pixels={240} alt="" loading="lazy" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </dialog>
  );
}

export default PropertyGallery;
