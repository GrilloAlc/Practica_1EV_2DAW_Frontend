// Símbolo de CataHome: una C de estilo Bodoni que abraza un tejado.
// La C toma el color de --logo-c y el tejado el de --logo-roof (por defecto, el color del texto).
// Son formas rellenas (sin máscaras ni trazos), las mismas que public/favicon.svg y public/brand/.
// El lienzo está recortado al contorno de la figura para que encaje como primera letra del logotipo.
function BrandSymbol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="23.92 18 208.16 216" aria-hidden="true" focusable="false">
      {/* La C: arco exterior, corte vertical en las puntas y hueco elíptico. Debajo, los dos remates */}
      <path
        fill="var(--logo-c, currentColor)"
        d="M194.44 37.94A108 108 0 1 0 194.44 214.06L194.44 190.37A62.53 93.79 0 1 1 194.44 61.63ZM194.44 30.32H207.71V72.95H194.44ZM194.44 179.05H207.71V221.68H194.44Z"
      />
      {/* El tejado: dentro de la C sin tocarla, asomando por su abertura */}
      <path fill="var(--logo-roof, currentColor)" d="M99.97 148.05L166.02 81.99L232.08 148.05L207.97 172.16L166.02 130.22L124.08 172.16Z" />
    </svg>
  );
}

export default BrandSymbol;
