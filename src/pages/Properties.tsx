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
import { PROVINCE_NAMES } from '../utils/address';
import RangeSlider from '../components/RangeSlider';
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
      areaMin: searchParams.get('areaMin') || undefined,
      areaMax: searchParams.get('areaMax') || undefined,
      province: searchParams.get('province') || undefined,
      postalCode: searchParams.get('postalCode') || undefined,
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
  else if (searchParams.get('province')) heading += ' en ' + searchParams.get('province');

  return (
    <main className="page">
      <title>{`${heading} · CataHome`}</title>
      <p className="breadcrumb"><Link to="/">Inicio</Link> / Casas</p>

      <h1 className="page-title">{heading}</h1>

      {/* Comprar, Alquilar y Todas ya están en el menú de arriba; aquí se cambia desde el filtro "Operación" */}
      <div className="properties-bar">
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

// Escalas de las barras de precio y superficie. En el extremo derecho no hay límite
interface Scale {
  min: number;
  max: number;
  step: number;
}
const SALE_SCALE: Scale = { min: 0, max: 3_000_000, step: 25_000 };
const RENT_SCALE: Scale = { min: 0, max: 6_000, step: 100 };
const AREA_SCALE: Scale = { min: 0, max: 600, step: 10 };

// Valores de la URL → posición de los tiradores (dentro de la escala)
function rangeFromUrl(from: string | null, to: string | null, scale: Scale): [number, number] {
  const clamp = (v: string | null, fallback: number) => {
    const n = Number(v);
    return v && Number.isFinite(n) ? Math.min(Math.max(n, scale.min), scale.max) : fallback;
  };
  return [clamp(from, scale.min), clamp(to, scale.max)];
}

// Posición de los tiradores → parámetros de la URL. En los extremos no se filtra
function rangeToUrl([low, high]: [number, number], scale: Scale, name: 'price' | 'area') {
  return {
    [name + 'Min']: low > scale.min ? String(low) : '',
    [name + 'Max']: high < scale.max ? String(high) : '',
  } as Record<'priceMin' | 'priceMax' | 'areaMin' | 'areaMax', string>;
}

interface FiltersFormProps {
  open: boolean;
  onApply: (filters: Record<'status' | 'type' | 'city' | 'province' | 'postalCode' | 'priceMin' | 'priceMax' | 'areaMin' | 'areaMax', string>) => void;
  onClear: () => void;
}

// Filtros del listado. Empiezan con lo que hay en la URL y se aplican al pulsar "Ver resultados"
function FiltersForm({ open, onApply, onClear }: FiltersFormProps) {
  const [searchParams] = useSearchParams();
  const citiesId = useId();
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const rent = status === 'Disponible para alquilar';
  const [type, setType] = useState(searchParams.get('type') || '');
  const [city, setCity] = useState(canonicalCity(searchParams.get('city') || ''));
  const prices = rent ? RENT_SCALE : SALE_SCALE;
  const [price, setPrice] = useState(() => rangeFromUrl(searchParams.get('priceMin'), searchParams.get('priceMax'), rent ? RENT_SCALE : SALE_SCALE));
  const [area, setArea] = useState(() => rangeFromUrl(searchParams.get('areaMin'), searchParams.get('areaMax'), AREA_SCALE));
  const [province, setProvince] = useState(searchParams.get('province') || '');
  const [postalCode, setPostalCode] = useState(searchParams.get('postalCode') || '');
  const [error, setError] = useState('');

  function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (postalCode.trim() && !/^\d{5}$/.test(postalCode.trim())) {
      setError('El código postal tiene 5 números, por ejemplo 28013.');
      return;
    }
    setError('');
    onApply({
      status,
      type,
      city: canonicalCity(city),
      province,
      postalCode: postalCode.trim(),
      ...rangeToUrl(price, prices, 'price'),
      ...rangeToUrl(area, AREA_SCALE, 'area'),
    });
  }

  return (
    <form id="properties-filters" className={open ? 'properties-filters is-open' : 'properties-filters'} onSubmit={handleSubmit} noValidate>
      <div className="properties-filters-head">
        <h2>Filtrar</h2>
        <button type="button" className="link-button" onClick={onClear}>Quitar filtros</button>
      </div>

      <label className="field">
        Operación
        <select
          value={status}
          onChange={(e) => {
            // Venta y alquiler tienen escalas de precio distintas: al cambiar, el precio vuelve a "cualquiera"
            const next = e.target.value;
            setStatus(next);
            const scale = next === 'Disponible para alquilar' ? RENT_SCALE : SALE_SCALE;
            setPrice([scale.min, scale.max]);
          }}
        >
          {OPERATIONS.map((op) => (
            <option key={op.label} value={op.value}>{op.label}</option>
          ))}
        </select>
      </label>
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
      <RangeSlider
        label={rent ? 'Precio al mes' : 'Precio'}
        min={prices.min}
        max={prices.max}
        step={prices.step}
        value={price}
        onChange={setPrice}
        format={(n) => formatNumber(n) + ' €'}
      />
      <RangeSlider
        label="Superficie"
        min={AREA_SCALE.min}
        max={AREA_SCALE.max}
        step={AREA_SCALE.step}
        value={area}
        onChange={setArea}
        format={(n) => formatNumber(n) + ' m²'}
      />
      <label className="field">
        Provincia
        <select value={province} onChange={(e) => setProvince(e.target.value)}>
          <option value="">Todas</option>
          {PROVINCE_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      <label className="field">
        Código postal
        <input inputMode="numeric" maxLength={5} placeholder="Por ejemplo: 28013" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))} />
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" className="btn properties-apply">Ver resultados</button>
    </form>
  );
}

export default Properties;
