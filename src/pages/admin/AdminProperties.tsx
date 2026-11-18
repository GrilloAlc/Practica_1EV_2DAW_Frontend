import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteProperty, getProperties, updateProperty } from '../../api/properties';
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
        // 'all' para incluir también las desactivadas
        const result = await getProperties({ isActive: 'all', limit: 50 });
        setList(result.data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadProperties();
  }, []);

  async function toggleActive(property: Property) {
    try {
      if (property.isActive) {
        await deleteProperty(property._id);
      } else {
        await updateProperty(property._id, { isActive: true });
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
          <p className="label">Gestión</p>
          <h1 className="page-title">Propiedades</h1>
          <p className="page-subtitle">Administra el catálogo de inmuebles.</p>
        </div>
        <Link to="/admin/propiedades/nueva" className="btn">+ Nueva propiedad</Link>
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
          <input className="table-search" type="search" aria-label="Buscar propiedad" placeholder="Buscar propiedad..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {visible.length === 0 ? (
          <div className="empty"><strong>Sin resultados</strong>No hay propiedades que coincidan.</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Propiedad</th><th>Tipo</th><th>Estado</th><th>Ciudad</th><th>Precio</th><th>Visible</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p._id} className={p.isActive ? '' : 'admin-inactive'}>
                  <td><img className="admin-thumb" src={propertyImage(p)} alt="" />{p.title}</td>
                  <td>{p.type}</td>
                  <td>{p.status}</td>
                  <td>{p.address.city}</td>
                  <td>{formatPrice(p)}</td>
                  <td><span className="status-badge">{p.isActive ? 'Activa' : 'Inactiva'}</span></td>
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
