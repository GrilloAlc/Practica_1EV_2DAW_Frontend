import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import './MortgageCalculator.css';

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });

// Cuota mensual con el sistema francés (cuota fija)
function monthlyPayment(loan: number, yearlyRate: number, years: number) {
  const months = years * 12;
  const rate = yearlyRate / 100 / 12;
  if (rate === 0) return loan / months;
  return (loan * rate) / (1 - Math.pow(1 + rate, -months));
}

function MortgageCalculator({ price }: { price: number }) {
  const id = useId();
  const [downPercent, setDownPercent] = useState(20);
  const [years, setYears] = useState(30);
  const [rateText, setRateText] = useState('3');

  const rate = Math.min(Math.max(Number(rateText.replace(',', '.')) || 0, 0), 15);
  const downPayment = Math.round((price * downPercent) / 100);
  const loan = price - downPayment;
  const payment = monthlyPayment(loan, rate, years);
  const totalInterest = Math.max(payment * years * 12 - loan, 0);
  const loanShare = loan + totalInterest > 0 ? (loan / (loan + totalInterest)) * 100 : 100;

  return (
    <section className="mortgage" aria-labelledby={`${id}-title`}>
      <div className="mortgage-head">
        <h2 id={`${id}-title`}>Calcula tu hipoteca</h2>
        <p>Mueve los valores para ver cuánto pagarías al mes.</p>
      </div>

      <div className="mortgage-grid">
        <div className="mortgage-inputs">
          <div className="mortgage-field">
            <div className="mortgage-label">
              <label htmlFor={`${id}-down`}>Ahorro que aportas</label>
              <output htmlFor={`${id}-down`}>{downPercent} % · {euros.format(downPayment)}</output>
            </div>
            <input
              id={`${id}-down`}
              type="range"
              min="10"
              max="60"
              step="5"
              value={downPercent}
              onChange={(e) => setDownPercent(Number(e.target.value))}
              style={{ '--fill': `${((downPercent - 10) / 50) * 100}%` } as CSSProperties}
            />
          </div>

          <div className="mortgage-field">
            <div className="mortgage-label">
              <label htmlFor={`${id}-years`}>Plazo</label>
              <output htmlFor={`${id}-years`}>{years} años</output>
            </div>
            <input
              id={`${id}-years`}
              type="range"
              min="5"
              max="40"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              style={{ '--fill': `${((years - 5) / 35) * 100}%` } as CSSProperties}
            />
          </div>

          <div className="mortgage-field">
            <label htmlFor={`${id}-rate`} className="mortgage-label">Interés anual (TIN)</label>
            <div className="mortgage-rate">
              <input
                id={`${id}-rate`}
                type="text"
                inputMode="decimal"
                value={rateText}
                onChange={(e) => setRateText(e.target.value)}
                aria-describedby={`${id}-rate-help`}
              />
              <span>%</span>
            </div>
            <span id={`${id}-rate-help`} className="field-help">Hoy suele estar entre el 2 % y el 4 %.</span>
          </div>
        </div>

        <div className="mortgage-result">
          <p className="mortgage-result-label">Cuota mensual</p>
          <p className="mortgage-result-value" aria-live="polite">{euros.format(payment)}</p>

          <div className="mortgage-bar" aria-hidden="true">
            <span style={{ width: `${loanShare}%` }} />
          </div>
          <dl className="mortgage-breakdown">
            <div>
              <dt><span className="mortgage-dot mortgage-dot-loan" />Te prestan</dt>
              <dd>{euros.format(loan)}</dd>
            </div>
            <div>
              <dt><span className="mortgage-dot mortgage-dot-interest" />Pagas de intereses</dt>
              <dd>{euros.format(totalInterest)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="mortgage-note">
        Es una estimación. Además del ahorro, cuenta con unos {euros.format(price * 0.1)} para impuestos y gastos de compra.
      </p>
    </section>
  );
}

export default MortgageCalculator;
