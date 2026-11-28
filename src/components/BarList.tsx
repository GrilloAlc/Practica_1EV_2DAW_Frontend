import { Link } from 'react-router-dom';
import { formatNumber } from '../utils/labels';
import './BarList.css';

export interface BarItem {
  label: string;
  value: number;
  // Texto pequeño debajo del nombre ("3 abiertos")
  detail?: string;
  // Si existe, el nombre es un enlace (por ejemplo, a la lista filtrada)
  to?: string;
}

// Gráfico de barras horizontales de una sola serie: nombre a la izquierda, barra en vino y la cifra al final.
// Cada barra es proporcional al valor más alto; las cifras van siempre escritas, así no depende del color.
// Es una lista (<ul>) con texto real: los lectores de pantalla la leen como "Abiertos, 12 de 40"
function BarList({ items, total, label }: { items: BarItem[]; total?: number; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);

  return (
    <ul className="bar-list" aria-label={label}>
      {items.map((item) => {
        const share = sum ? Math.round((item.value / sum) * 100) : 0;
        return (
          <li key={item.label} className="bar-list-item" title={`${item.label}: ${formatNumber(item.value)}${sum ? ` (${share} %)` : ''}`}>
            <span className="bar-list-name">
              {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
              {item.detail && <small>{item.detail}</small>}
            </span>
            <span className="bar-list-track" aria-hidden="true">
              <span className="bar-list-bar" style={{ width: `${(item.value / max) * 100}%` }} />
            </span>
            <span className="bar-list-value">
              {formatNumber(item.value)}
              {sum > 0 && <small>{share} %</small>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default BarList;
