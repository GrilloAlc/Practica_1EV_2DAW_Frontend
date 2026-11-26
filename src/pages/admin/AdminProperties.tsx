import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deactivateProperty, getProperties, reactivateProperty } from '../../api/properties';
import { getErrorMessage } from '../../api/client';
import { formatPrice, propertyImage } from '../../utils/labels';
import type { Property } from '../../types';

function AdminProperties() {
  const [list, setList] = useState<Property[]>([]);
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProperties() {
      try {
        // El backend solo lista las activas: las desactivadas aparecen aquí hasta recargar la página
        setList(await getProperties());
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadProperties();
  }, []);

  async function toggleActive(property: Property) {
    try {
      if (property.isActive) {
        if (!window.confirm(`¿Seguro que quieres desactivar «${property.title}»? Dejará de verse en la web.`)) {
          return;
        }
        await deactivateProperty(property._id);
      } else {
        await reactivateProperty(property._id);
      }
      setList(list.map((p) => (p._id === property._id ? { ...p, isActive: !p.isActive } : p)));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const activeCount = list.filter((p) => p.isActive).length;
  const inactiveCount = list.length - activeCount;

  let visible = list;
  if (filter === 'Activas') {
    visible = visible.filter((p) => p.isActive);
  }
  if (filter === 'Inactivas') {
    visible = visible.filter((p) => !p.isActive);
  }
  if (search) {
    visible = visible.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Propiedades</h1>
          <p className="page-subtitle">Administra el catálogo de inmuebles.</p>
        </div>
        <Link to="/admin/propiedades/nueva" className="btn">Añadir propiedad</Link>
      </div>

      {error && <p className="field-error" role="alert">{error}</p>}

      <div className="table-box">
        <div className="table-tools">
          <div className="tabs">
            <button className={filter === 'Todas' ? 'tab tab-active' : 'tab'} onClick={() => setFilter('Todas')}>
              Todas ({list.length})
            </button>
            <button className={filter === 'Activas' ? 'tab tab-active' : 'tab'} onClick={() => setFilter('Activas')}>
              Activas ({activeCount})
            </button>
            <button className={filter === 'Inactivas' ? 'tab tab-active' : 'tab'} onClick={() => setFilter('Inactivas')}>
              Inactivas ({inactiveCount})
            </button>
          </div>
          <input className="table-search" type="search" aria-label="Buscar propiedad" placeholder="Buscar por título…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {visible.length === 0 ? (
          <div className="empty"><strong>Ninguna propiedad coincide</strong>Cambia el filtro o el texto de búsqueda.</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Propiedad</th><th>Tipo</th><th>Estado</th><th>Ciudad</th><th>Precio</th><th>Visible</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p._id} className={p.isActive ? '' : 'admin-inactive'}>
                  <td>
                    <span className="admin-property">
                      <img className="admin-thumb" src={propertyImage(p)} alt="" width={64} height={48} loading="lazy" />
                      <strong>{p.title}</strong>
                    </span>
                  </td>
                  <td>{p.type}</td>
                  <td className="cell-muted">{p.status}</td>
                  <td>{p.address.city}</td>
                  <td className="cell-code"><strong>{formatPrice(p)}</strong></td>
                  <td><span className={p.isActive ? 'status-badge status-on' : 'status-badge status-off'}>{p.isActive ? 'Activa' : 'Inactiva'}</span></td>
                  <td>
                    <div className="admin-actions">
                      <Link to={`/admin/propiedades/${p._id}/editar`}>Editar</Link>
                      <button className="link-button" onClick={() => toggleActive(p)}>{p.isActive ? 'Desactivar' : 'Activar'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

export default AdminProperties;
