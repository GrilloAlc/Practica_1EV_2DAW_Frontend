import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroCarousel.css';
import { formatPrice, propertyImage } from '../utils/labels';
import type { Property } from '../types';

const AUTOPLAY_MS = 6000;

// Carrusel de la portada: una casa a pantalla completa cada vez.
// Pasa solo cada 6 segundos, se puede pausar y se para si el ratón o el foco están encima.
// El paso a la siguiente casa lo marca la barra de progreso: cuando termina de llenarse, avanza.
function HeroCarousel({ properties }: { properties: Property[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hovered, setHovered] = useState(false);
  const touchStart = useRef<number | null>(null);
  const total = properties.length;

  if (total === 0) return null;

  const current = properties[index];

  function go(next: number) {
    setIndex((next + total) % total);
  }

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carrusel"
      aria-label="Casas en portada"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="hero-carousel-slides">
        {properties.map((p, i) => (
          <Link
            key={p._id}
            to={`/propiedades/${p._id}`}
            state={{ property: p }}
            className={i === index ? 'hero-carousel-slide is-active' : 'hero-carousel-slide'}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            aria-label={`${p.title}, ${p.address.city}, ${formatPrice(p)}`}
          >
            <img src={propertyImage(p)} alt="" width={1200} height={800} loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} />
          </Link>
        ))}
      </div>

      <div className="hero-carousel-bar">
        <div className="hero-carousel-caption" aria-live={paused ? 'polite' : 'off'}>
          <Link to={`/propiedades/${current._id}`} state={{ property: current }} className="hero-carousel-title">
            {current.title}
          </Link>
          <span className="hero-carousel-place">{current.address.city}</span>
          <span className="hero-carousel-price">{formatPrice(current)}</span>
        </div>

        {total > 1 && (
          <div className="hero-carousel-controls">
            <span className="hero-carousel-count">
              {index + 1} / {total}
            </span>
            <button type="button" onClick={() => go(index - 1)} aria-label="Casa anterior">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Casa siguiente">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
            <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Reanudar el carrusel' : 'Pausar el carrusel'}>
              {paused ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" className="is-fill" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
              )}
            </button>
          </div>
        )}
      </div>

      {total > 1 && (
        <div className="hero-carousel-progress" aria-hidden="true">
          {properties.map((p, i) => (
            <span
              key={p._id}
              className={i === index ? 'is-active' : i < index ? 'is-done' : ''}
              style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: paused || hovered ? 'paused' : 'running' }}
              onAnimationEnd={i === index ? () => go(index + 1) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default HeroCarousel;
