import { useEffect, useId, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Properties.css';
import '../components/Pagination.css';
import PropertyCard from '../components/PropertyCard';
import { PropertyListSkeleton } from '../components/Skeleton';
import { getPropertiesPage } from '../api/properties';
import type { PropertyFilters } from '../api/properties';
import { getErrorMessage } from '../api/client';
import { PROPERTY_TYPES, formatNumber, typePlurals } from '../utils/labels';
import { CITIES, canonicalCity } from '../utils/cities';
import { useSlowLoading } from '../utils/useSlowLoading';
import type { Page, Property } from '../types';

const OPERATIONS = [
  { value: '', label: 'Todas' },
  { value: 'En venta', label: 'Comprar' },
  { value: 'Disponible para alquilar', label: 'Alquilar' },
];

// Orden que se elige en pantalla → parámetros orderBy y orden del backend
const SORTS: Record<string, Pick<PropertyFilters, 'orderBy' | 'orden'>> = {
  newest: { orderBy: 'createdAt', orden: 'desc' },
  price_asc: { orderBy: 'price', orden: 'asc' },
  price_desc: { orderBy: 'price', orden: 'desc' },
  area_desc: { orderBy: 'area', orden: 'desc' },
};

// Resultados ya cargados por búsqueda. Al volver atrás desde una ficha se pintan al momento
// y la foto puede volver a su sitio en el listado.
const resultsCache = new Map<string, Page<Property>>();

// Número de página de la URL: 1 si no hay o no es un número válido
function pageFromUrl(value: string | null) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 1 ? n : 1;
}

function Properties() {
  // Los filtros aplicados se guardan en la URL: así funcionan Atrás, los enlaces del menú y compartir una búsqueda
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const cacheKey = searchParams.toString();
  const [results, setResults] = useState<{ key: string; page: Page<Property> } | null>(() => {
    const cached = resultsCache.get(cacheKey);
    return cached ? { key: cacheKey, page: cached } : null;
  });
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';
  // La ciudad de la URL también se corrige ("malaga" → "Málaga"), por si llega de un enlace escrito a mano
  const appliedCity = canonicalCity(searchParams.get('city') || '');
  const sort = SORTS[searchParams.get('sort') || ''] ? searchParams.get('sort')! : 'newest';
  const page = pageFromUrl(searchParams.get('page'));

  useEffect(() => {
    let current = true;
    getPropertiesPage({
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      city: canonicalCity(searchParams.get('city') || '') || undefined,
      priceMin: searchParams.get('priceMin') || undefined,
      priceMax: searchParams.get('priceMax') || undefined,
      ...(SORTS[searchParams.get('sort') || ''] || SORTS.newest),
      page: pageFromUrl(searchParams.get('page')),
    }).then(
      (res) => {
        if (!current) return;
        resultsCache.set(searchParams.toString(), res);
        setResults({ key: searchParams.toString(), page: res });
        setError(null);
      },
      (err) => {
        if (current) setError({ key: searchParams.toString(), message: getErrorMessage(err) });
      },
    );
    return () => {
      current = false;
    };
  }, [searchParams, attempt]);

  // Mientras llega la búsqueda nueva se dejan los resultados anteriores, algo apagados
  const loading = results?.key !== cacheKey && error?.key !== cacheKey;
  const slow = useSlowLoading(loading && !results, cacheKey);
  const failed = error?.key === cacheKey ? error.message : '';
  const properties = failed ? [] : results?.page.data || [];
  const total = failed ? 0 : results?.page.pagesData.total ?? 0;
  const totalPages = Math.max(1, results?.page.pagesData.totalPages || 1);

  // Cambia solo los valores indicados de la URL (si están vacíos se quitan)
  function changeUrl(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const key in changes) {
      if (changes[key]) {
        params.set(key, changes[key]);
      } else {
        params.delete(key);
      }
    }
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchParams({});
    setShowFilters(false);
  }

  const operationText = status === 'En venta' ? ' en venta' : status === 'Disponible para alquilar' ? ' en alquiler' : '';
  let heading = (typePlurals[type] || 'Casas') + (operationText || ' en venta y alquiler');
  if (appliedCity) heading += ' en ' + appliedCity;

  return (
    <main className="page">
      <title>{`${heading} · CataHome`}</title>
      <p className="breadcrumb"><Link to="/">Inicio</Link> / Casas</p>

      <h1 className="page-title">{heading}</h1>

      <div className="properties-bar">
        <div className="properties-ops" role="radiogroup" aria-label="Operación">
          {OPERATIONS.map((op) => (
            <button
              key={op.label}
              type="button"
              role="radio"
              aria-checked={status === op.value}
              className={status === op.value ? 'properties-op is-active' : 'properties-op'}
              onClick={() => changeUrl({ status: op.value, page: '', priceMin: '', priceMax: '' })}
            >
              {op.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-outline properties-filters-toggle"
          aria-expanded={showFilters}
          aria-controls="properties-filters"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Ocultar filtros' : 'Filtrar'}
        </button>
        <p className="properties-count" aria-live="polite">
          {!results && !failed ? 'Buscando…' : total === 1 ? '1 casa' : `${formatNumber(total)} casas`}
        </p>
        <label className="properties-sort">
          Ordenar por
          <select value={sort} onChange={(e) => changeUrl({ sort: e.target.value === 'newest' ? '' : e.target.value, page: '' })}>
            <option value="newest">Más recientes</option>
            <option value="price_asc">Más baratas</option>
            <option value="price_desc">Más caras</option>
            <option value="area_desc">Más grandes</option>
          </select>
        </label>
      </div>

      <div className="properties-layout">
        {/* El formulario se vuelve a crear cuando cambia la URL (Atrás, enlaces del menú…), así nunca enseña filtros viejos */}
        <FiltersForm
          key={cacheKey}
          open={showFilters}
          rent={status === 'Disponible para alquilar'}
          onApply={(filters) => {
            changeUrl({ ...filters, page: '' });
            setShowFilters(false);
          }}
          onClear={clearFilters}
        />

        <section aria-busy={loading} className={loading && results ? 'properties-results is-loading' : 'properties-results'}>
          {failed && (
            <div className="empty table-box" role="alert">
              <strong>No hemos podido cargar las casas</strong>
              <p>{failed}</p>
              <button type="button" className="btn btn-outline" onClick={() => setAttempt(attempt + 1)}>Volver a intentarlo</button>
            </div>
          )}

          {!results && !failed && (
            <>
              {slow && <p className="notice" role="status">Estamos despertando el servidor. La primera búsqueda del día puede tardar unos segundos.</p>}
              <PropertyListSkeleton />
            </>
          )}

          {results && !failed && properties.length === 0 && (
            page > 1 && total > 0 ? (
              <div className="empty table-box">
                <strong>Esta página no existe</strong>
                Hay {formatNumber(total)} casas en {totalPages} {totalPages === 1 ? 'página' : 'páginas'}.{' '}
                <button type="button" className="link-button" onClick={() => changeUrl({ page: '' })}>Ir a la primera</button>
              </div>
            ) : appliedCity ? (
              <div className="empty table-box">
                <strong>Ahora mismo no hay casas así en {appliedCity}</strong>
                <button type="button" className="link-button" onClick={() => changeUrl({ city: '', page: '' })}>Busca lo mismo en todas las ciudades</button>{' '}
                o <button type="button" className="link-button" onClick={clearFilters}>quita todos los filtros</button>.
              </div>
            ) : (
              <div className="empty table-box">
                <strong>Ninguna casa coincide con tu búsqueda</strong>
                Amplía el precio, cambia de ciudad o <button type="button" className="link-button" onClick={clearFilters}>quita todos los filtros</button>.
              </div>
            )
          )}

          {properties.length > 0 && (
            <div className="properties-list">
              {properties.map((p, i) => (
                <PropertyCard key={p._id} property={p} priority={i < 2} />
              ))}
            </div>
          )}

          {!failed && totalPages > 1 && properties.length > 0 && (
            <nav className="pagination" aria-label="Páginas de resultados">
              <button type="button" disabled={page <= 1} onClick={() => changeUrl({ page: page === 2 ? '' : String(page - 1) })}>Anterior</button>
              <span className="pagination-current">
                Página {page} de {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages} onClick={() => changeUrl({ page: String(page + 1) })}>Siguiente</button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

interface FiltersFormProps {
  open: boolean;
  rent: boolean;
  onApply: (filters: { type: string; city: string; priceMin: string; priceMax: string }) => void;
  onClear: () => void;
}

// Filtros del listado. Empiezan con lo que hay en la URL y se aplican al pulsar "Ver resultados"
function FiltersForm({ open, rent, onApply, onClear }: FiltersFormProps) {
  const [searchParams] = useSearchParams();
  const citiesId = useId();
  const [type, setType] = useState(searchParams.get('type') || '');
  const [city, setCity] = useState(canonicalCity(searchParams.get('city') || ''));
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');
  const [error, setError] = useState('');

  function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) {
      setError('Los precios tienen que ser números positivos.');
      return;
    }
    if (min !== null && max !== null && min > max) {
      setError('El precio "desde" no puede ser mayor que el precio "hasta".');
      return;
    }
    setError('');
    onApply({ type, city: canonicalCity(city), priceMin: min !== null ? String(min) : '', priceMax: max !== null ? String(max) : '' });
  }

  return (
    <form id="properties-filters" className={open ? 'properties-filters is-open' : 'properties-filters'} onSubmit={handleSubmit} noValidate>
      <div className="properties-filters-head">
        <h2>Filtrar</h2>
        <button type="button" className="link-button" onClick={onClear}>Quitar filtros</button>
      </div>

      <label className="field">
        Ciudad
        <input placeholder="Por ejemplo: Madrid" value={city} onChange={(e) => setCity(e.target.value)} list={citiesId} autoComplete="off" />
        <datalist id={citiesId}>
          {CITIES.map((c) => <option key={c} value={c} />)}
        </datalist>
      </label>
      <label className="field">
        Tipo de inmueble
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label className="field">
          {rent ? 'Al mes desde' : 'Precio desde'}
          <input type="number" min="0" step={rent ? 100 : 1000} inputMode="numeric" placeholder="0 €" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
        </label>
        <label className="field">
          {rent ? 'Al mes hasta' : 'Precio hasta'}
          <input type="number" min="0" step={rent ? 100 : 1000} inputMode="numeric" placeholder="Sin límite" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
        </label>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" className="btn properties-apply">Ver resultados</button>
    </form>
  );
}

export default Properties;
