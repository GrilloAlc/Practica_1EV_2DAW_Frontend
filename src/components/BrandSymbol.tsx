import { useId } from 'react';

// Símbolo de CataHome: una C de estilo Bodoni que abraza un tejado.
// La C toma el color de --logo-c y el tejado el de --logo-roof (por defecto, el color del texto).
// Las mismas formas están en public/favicon.svg y en public/brand/.
function BrandSymbol({ className }: { className?: string }) {
  const maskId = useId();

  return (
    <svg className={className} viewBox="4.6 3.6 24.8 24.8" aria-hidden="true" focusable="false">
      <defs>
        {/* Recorta la abertura de la C, por donde sale el tejado */}
        <mask id={maskId}>
          <rect x="0" y="0" width="32" height="32" fill="#fff" />
          <path d="M21 10.4L32 5.2v21.6l-11-5.2zM24.5 4h8v24h-8z" fill="#000" />
        </mask>
      </defs>
      <g fill="var(--logo-c, currentColor)">
        <path
          mask={`url(#${maskId})`}
          fillRule="evenodd"
          d="M16.6 4.6a11.4 11.4 0 1 0 0 22.8a11.4 11.4 0 1 0 0-22.8zM18.4 6.1a6.6 9.9 0 1 0 0 19.8a6.6 9.9 0 1 0 0-19.8z"
        />
        {/* Remates de las puntas */}
        <path d="M23.2 5.9h1.3v5.2h-1.3zM23.2 20.9h1.3v5.2h-1.3z" />
      </g>
      {/* Tejado: centrado dentro de la C y asomando por su abertura */}
      <path
        d="M12.2 20.2L19 13.4l6.8 6.8"
        fill="none"
        stroke="var(--logo-roof, currentColor)"
        strokeWidth="3.2"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}

export default BrandSymbol;
