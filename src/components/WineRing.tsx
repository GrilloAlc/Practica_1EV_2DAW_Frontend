import { useId } from 'react';

// Anillo de copa de vino: la marca que deja una copa sobre el mantel.
// Es decorativo (aria-hidden). El filtro deforma un poco el borde para que no sea un círculo perfecto.
function WineRing({ className }: { className?: string }) {
  const filterId = useId();

  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`} fill="none" stroke="currentColor">
        {/* Velo de vino dentro del anillo */}
        <ellipse cx="100" cy="100" rx="80" ry="77" fill="currentColor" fillOpacity="0.035" stroke="none" />
        {/* Borde principal: más marcado y con cortes, como al apoyar la copa */}
        <ellipse
          cx="100"
          cy="100"
          rx="82"
          ry="79"
          strokeWidth="5"
          strokeOpacity="0.75"
          strokeLinecap="round"
          strokeDasharray="190 9 70 5 230"
          transform="rotate(-24 100 100)"
        />
        {/* Segundo borde, más fino, de cuando la copa se movió un poco */}
        <ellipse
          cx="104"
          cy="97"
          rx="79"
          ry="77"
          strokeWidth="1.6"
          strokeOpacity="0.4"
          strokeDasharray="150 40 90 220"
          transform="rotate(40 100 100)"
        />
      </g>
      {/* Dos gotas caídas */}
      <circle cx="184" cy="146" r="3.4" fill="currentColor" fillOpacity="0.55" />
      <circle cx="171" cy="166" r="1.8" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}

export default WineRing;
