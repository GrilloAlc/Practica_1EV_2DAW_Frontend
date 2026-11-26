import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Properties.css';
import '../components/Pagination.css';
import PropertyCard from '../components/PropertyCard';
import { PropertyListSkeleton } from '../components/Skeleton';
import { getProperties, PROPERTIES_PER_PAGE } from '../api/properties';
import type { PropertyFilters } from '../api/properties';
import { getErrorMessage } from '../api/client';
import { PROPERTY_TYPES } from '../utils/labels';
import type { Property } from '../types';

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
};

// Resultados ya cargados por búsqueda. Al volver atrás desde una ficha se pintan al momento
// y la foto puede volver a su sitio en el listado.
const resultsCache = new Map<string, Property[]>();

function Properties() {
  // Los filtros aplicados se guardan en la URL
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');
  const [showFilters, setShowFilters] = useState(false);

  const cacheKey = searchParams.toString();
  const [results, setResults] = useState<Property[] | null>(resultsCache.get(cacheKey) || null);
  const [error, setError] = useState('');

  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    async function loadProperties() {
      try {
        const list = await getProperties({
          status: searchParams.get('status') || undefined,
          type: searchParams.get('type') || undefined,
          city: searchParams.get('city') || undefined,
          priceMin: searchParams.get('priceMin') || undefined,
          priceMax: searchParams.get('priceMax') || undefined,
          ...(SORTS[searchParams.get('sort') || 'newest'] || SORTS.newest),
          page: Number(searchParams.get('page')) || 1,
        });
        resultsCache.set(searchParams.toString(), list);
        setResults(list);
        setError('');
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadProperties();
  }, [searchParams]);

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

  function applyFilters(e: SyntheticEvent) {
    e.preventDefault();
    changeUrl({ status, type, city, priceMin, priceMax, page: '' });
    setShowFilters(false);
  }

  function changeOperation(value: string) {
    setStatus(value);
    changeUrl({ status: value, page: '' });
  }

  function clearFilters() {
    setStatus('');
    setType('');
    setCity('');
    setPriceMin('');
    setPriceMax('');
    setSearchParams({});
  }

  // El backend también devuelve las desactivadas: al público solo se le enseñan las activas
  const properties = (results || []).filter((p) => p.isActive);
  // Si llegan 50, puede haber más en la página siguiente
  const hasNextPage = (results || []).length === PROPERTIES_PER_PAGE;

  const appliedCity = searchParams.get('city');
  let heading = 'Casas en venta y alquiler';
  if (status === 'En venta') heading = 'Casas en venta';
  if (status === 'Disponible para alquilar') heading = 'Casas en alquiler';
  if (appliedCity) heading += ' en ' + appliedCity;

  return (
    <main className="page">
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
              onClick={() => changeOperation(op.value)}
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
          {results === null ? 'Buscando…' : properties.length === 1 ? '1 casa' : `${properties.length} casas`}
        </p>
        <label className="properties-sort">
          Ordenar por
          <select value={sort} onChange={(e) => changeUrl({ sort: e.target.value, page: '' })}>
            <option value="newest">Más recientes</option>
            <option value="price_asc">Más baratas</option>
            <option value="price_desc">Más caras</option>
          </select>
        </label>
      </div>

      <div className="properties-layout">
        <form id="properties-filters" className={showFilters ? 'properties-filters is-open' : 'properties-filters'} onSubmit={applyFilters}>
          <div className="properties-filters-head">
            <h2>Filtrar</h2>
            <button type="button" className="link-button" onClick={clearFilters}>Quitar filtros</button>
          </div>

          <label className="field">
            Ciudad
            <input placeholder="Por ejemplo: Madrid" value={city} onChange={(e) => setCity(e.target.value)} />
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
              Precio desde
              <input type="number" min="0" step="1000" inputMode="numeric" placeholder="0 €" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
            </label>
            <label className="field">
              Precio hasta
              <input type="number" min="0" step="1000" inputMode="numeric" placeholder="Sin límite" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
            </label>
          </div>
          <button type="submit" className="btn properties-apply">Ver resultados</button>
        </form>

        <section>
          {error && <p className="field-error">{error}</p>}

          {results === null && !error && <PropertyListSkeleton />}

          {results !== null && properties.length === 0 && (
            <div className="empty table-box">
              <strong>Ninguna casa coincide con tu búsqueda</strong>
              Amplía el precio, cambia de ciudad o <button type="button" className="link-button" onClick={clearFilters}>quita todos los filtros</button>.
            </div>
          )}

          {properties.length > 0 && (
            <div className="properties-list">
              {properties.map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
            </div>
          )}

          {(page > 1 || hasNextPage) && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => changeUrl({ page: page === 2 ? '' : String(page - 1) })}>Anterior</button>
              <span className="pagination-current">Página {page}</span>
              <button disabled={!hasNextPage} onClick={() => changeUrl({ page: String(page + 1) })}>Siguiente</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Properties;
