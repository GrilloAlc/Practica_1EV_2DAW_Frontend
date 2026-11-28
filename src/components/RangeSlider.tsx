import { useId } from 'react';
import type { CSSProperties } from 'react';
import './RangeSlider.css';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  // [mínimo, máximo]. En los extremos no se filtra: min = "desde 0" y max = "sin límite"
  value: [number, number];
  onChange: (value: [number, number]) => void;
  // Cómo se escribe cada valor ("250.000 €", "120 m²")
  format: (n: number) => string;
}

// Barra con dos tiradores para elegir un mínimo y un máximo. Son dos <input type="range"> nativos
// superpuestos: se usan con el teclado (flechas, Inicio, Fin) y los lectores de pantalla los leen solos
function RangeSlider({ label, min, max, step, value, onChange, format }: RangeSliderProps) {
  const id = useId();
  const [low, high] = value;
  const percent = (n: number) => ((n - min) / (max - min)) * 100;
  const highText = high >= max ? 'Sin límite' : format(high);

  return (
    <fieldset className="range">
      <legend className="range-label">{label}</legend>
      <p className="range-values" id={id} aria-live="polite">
        <span>{low <= min ? 'Desde 0' : format(low)}</span>
        <span>{highText}</span>
      </p>
      <div className="range-track" style={{ '--from': percent(low) + '%', '--to': percent(high) + '%' } as CSSProperties}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          aria-label={`${label}: mínimo`}
          aria-valuetext={low <= min ? 'Sin mínimo' : format(low)}
          aria-describedby={id}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high - step), high])}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label={`${label}: máximo`}
          aria-valuetext={highText}
          aria-describedby={id}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low + step)])}
        />
      </div>
    </fieldset>
  );
}

export default RangeSlider;
