import { useEffect, useId, useState } from 'react';
import './AddressSearch.css';
import { formatAddress, searchAddresses } from '../utils/address';
import type { FoundAddress } from '../utils/address';

// Campo de búsqueda con sugerencias de direcciones reales mientras se escribe
function AddressSearch({ onSelect }: { onSelect: (address: FoundAddress) => void }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoundAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Espera a que se deje de escribir 300 ms antes de buscar
  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await searchAddresses(text, controller.signal);
        // Quita las repetidas (la misma dirección puede venir varias veces)
        const unique = list.filter((a, i) => list.findIndex((b) => formatAddress(b) === formatAddress(a)) === i);
        // Primero las de la ciudad que se ha escrito ("... Barcelona")
        const lower = text.toLowerCase();
        unique.sort((a, b) => Number(lower.includes(b.city.toLowerCase())) - Number(lower.includes(a.city.toLowerCase())));
        setResults(unique.slice(0, 6));
        setActive(-1);
        setOpen(true);
        setError('');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('No se han podido buscar direcciones. Revisa la conexión e inténtalo de nuevo.');
        }
      }
      setSearching(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(address: FoundAddress) {
    onSelect(address);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((active + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active <= 0 ? results.length - 1 : active - 1);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showList = open && query.trim().length >= 3;

  return (
    <div className="address-search">
      <label className="field" htmlFor={`${id}-input`}>
        Buscar dirección
        <input
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-option-${active}` : undefined}
          autoComplete="off"
          placeholder="Calle y número, por ejemplo: Calle Mayor 10, Madrid"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <span className="field-help">
          {searching ? 'Buscando…' : 'Escribe al menos 3 letras y elige la dirección de la lista.'}
        </span>
      </label>

      {error && <p className="field-error" role="alert">{error}</p>}

      {showList && (
        <ul id={`${id}-list`} role="listbox" className="address-search-list">
          {results.length === 0 && !searching ? (
            <li className="address-search-empty">No se encuentra esa dirección en España. Prueba con la calle y la ciudad.</li>
          ) : (
            results.map((a, i) => (
              <li
                key={`${a.lat},${a.lng},${i}`}
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'is-active' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(a);
                }}
              >
                <strong>{a.street}{a.number ? ' ' + a.number : ''}</strong>
                <span>{a.postalCode} {a.city} ({a.province})</span>
              </li>
            ))
          )}
        </ul>
      )}

      <p className="address-search-credit">
        Direcciones de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
      </p>
    </div>
  );
}

export default AddressSearch;
