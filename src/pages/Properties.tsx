import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Properties.css';
import PropertyCard from '../components/PropertyCard';
import Pagination from '../components/Pagination';
import { properties } from '../data/properties';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PER_PAGE = 6;
const emptyFilters = { operacion: '', tipo: '', ciudad: '', precioMin: '', precioMax: '', habitaciones: '' };

function Properties() {
  // Si venimos del buscador del Home, la dirección trae los filtros: /propiedades?operacion=Venta&ciudad=Madrid
  // params.get('operacion') devuelve el valor, o null si no viene en la dirección (por eso el || '')
  const [params] = useSearchParams();
  const startFilters = {
    operacion: params.get('operacion') || '',
    tipo: params.get('tipo') || '',
    ciudad: params.get('ciudad') || '',
    precioMin: params.get('precioMin') || '',
    precioMax: params.get('precioMax') || '',
    habitaciones: params.get('habitaciones') || '',
  };

  const [filters, setFilters] = useState(startFilters); // lo que hay escrito en el formulario
  const [applied, setApplied] = useState(startFilters); // los filtros que ya se han aplicado
  const [sort, setSort] = useState('recientes');
  const [page, setPage] = useState(1);

  function handleChange(e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function applyFilters() {
    setApplied(filters);
    setPage(1);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    setPage(1);
  }

  // Un filtro vacío ('') no filtra nada
  const result = properties
    .filter((p) => p.active)
    .filter((p) => !applied.operacion || p.operation === applied.operacion)
    .filter((p) => !applied.tipo || p.type === applied.tipo)
    .filter((p) => !applied.ciudad || p.city === applied.ciudad)
    .filter((p) => !applied.precioMin || p.price >= Number(applied.precioMin))
    .filter((p) => !applied.precioMax || p.price <= Number(applied.precioMax))
    .filter((p) => !applied.habitaciones || p.rooms >= Number(applied.habitaciones));

  if (sort === 'precio-asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'precio-desc') result.sort((a, b) => b.price - a.price);

  const totalPages = Math.max(1, Math.ceil(result.length / PER_PAGE));
  const visible = result.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <Navbar />
      <main className="page">
        <p className="breadcrumb"><Link to="/">Inicio</Link> / Propiedades</p>

        <div className="page-header">
          <div>
            <h1 className="page-title">Propiedades</h1>
            <p className="page-subtitle">{result.length} resultados encontrados</p>
          </div>
          <label className="properties-sort">
            Ordenar
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
            </select>
          </label>
        </div>

        <div className="properties-layout">
          <aside className="properties-filters">
            <div className="properties-filters-head">
              <strong>Filtros</strong>
              <button className="link-button" onClick={clearFilters}>Limpiar</button>
            </div>

            <label className="field">
              Operación
              <select name="operacion" value={filters.operacion} onChange={handleChange}>
                <option value="">Todas</option>
                <option value="Venta">Comprar</option>
                <option value="Alquiler">Alquilar</option>
              </select>
            </label>
            <label className="field">
              Tipo de propiedad
              <select name="tipo" value={filters.tipo} onChange={handleChange}>
                <option value="">Todos</option>
                <option value="Piso">Piso</option>
                <option value="Casa">Casa</option>
              </select>
            </label>
            <div className="form-row">
              <label className="field">
                Precio mín.
                <input type="number" name="precioMin" min="0" placeholder="Mín." value={filters.precioMin} onChange={handleChange} />
              </label>
              <label className="field">
                Precio máx.
                <input type="number" name="precioMax" min="0" placeholder="Máx." value={filters.precioMax} onChange={handleChange} />
              </label>
            </div>
            <label className="field">
              Habitaciones
              <select name="habitaciones" value={filters.habitaciones} onChange={handleChange}>
                <option value="">Cualquiera</option>
                <option value="1">1 o más</option>
                <option value="2">2 o más</option>
                <option value="3">3 o más</option>
                <option value="4">4 o más</option>
              </select>
            </label>
            <label className="field">
              Ciudad
              <select name="ciudad" value={filters.ciudad} onChange={handleChange}>
                <option value="">Todas</option>
                <option value="Madrid">Madrid</option>
                <option value="Barcelona">Barcelona</option>
                <option value="Valencia">Valencia</option>
              </select>
            </label>
            <button className="btn properties-apply" onClick={applyFilters}>Aplicar filtros</button>
          </aside>

          <section>
            {visible.length === 0 ? (
              <div className="empty table-box">
                <strong>No hay propiedades con esos filtros</strong>
                Prueba a cambiar los filtros o pulsa en Limpiar.
              </div>
            ) : (
              <>
                <div className="properties-grid">
                  {visible.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Properties;
