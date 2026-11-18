import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Properties.css';
import PropertyCard from '../components/PropertyCard';
import Pagination from '../components/Pagination';
import { getProperties } from '../api/properties';
import { getErrorMessage } from '../api/client';
import { PROPERTY_STATUSES, PROPERTY_TYPES } from '../utils/labels';
import type { Property } from '../types';

const PER_PAGE = 6;

function Properties() {
  // Los filtros aplicados se guardan en la URL
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    async function loadProperties() {
      try {
        const params = Object.fromEntries(searchParams);
        const result = await getProperties({ ...params, limit: PER_PAGE });
        setProperties(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setError('');
      } catch (err) {
        setError(getErrorMessage(err));
      }
      setLoading(false);
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
    changeUrl({ search, status, type, city, minPrice, maxPrice, page: '' });
  }

  function clearFilters() {
    setSearch('');
    setStatus('');
    setType('');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  }

  return (
    <main className="page">
      <p className="breadcrumb"><Link to="/">Inicio</Link> / Propiedades</p>

      <div className="page-header">
        <div>
          <h1 className="page-title">Propiedades</h1>
          <p className="page-subtitle">{total} resultados encontrados</p>
        </div>
        <label className="properties-sort">
          Ordenar
          <select value={sort} onChange={(e) => changeUrl({ sort: e.target.value, page: '' })}>
            <option value="newest">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </label>
      </div>

      <div className="properties-layout">
        <form className="properties-filters" onSubmit={applyFilters}>
          <div className="properties-filters-head">
            <strong>Filtros</strong>
            <button type="button" className="link-button" onClick={clearFilters}>Limpiar</button>
          </div>

          <label className="field">
            Buscar
            <input type="search" placeholder="Título o descripción" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label className="field">
            Estado
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos</option>
              {PROPERTY_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Tipo de propiedad
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label className="field">
              Precio mín.
              <input type="number" min="0" placeholder="Mín." value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </label>
            <label className="field">
              Precio máx.
              <input type="number" min="0" placeholder="Máx." value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </label>
          </div>
          <label className="field">
            Ciudad
            <input placeholder="Todas" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <button type="submit" className="btn properties-apply">Aplicar filtros</button>
        </form>

        <section>
          {loading && <p>Cargando...</p>}
          {error && <p className="field-error">{error}</p>}

          {!loading && !error && properties.length === 0 && (
            <div className="empty table-box">
              <strong>No hay propiedades con esos filtros</strong>
              Prueba a cambiar los filtros o pulsa en Limpiar.
            </div>
          )}

          {properties.length > 0 && (
            <>
              <div className="properties-grid">
                {properties.map((p) => (
                  <PropertyCard key={p._id} property={p} />
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => changeUrl({ page: String(p) })} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Properties;
