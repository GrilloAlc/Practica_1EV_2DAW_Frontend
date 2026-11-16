import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { properties as initialProperties } from '../../data/properties';
import AdminSidebar from '../../components/AdminSidebar';
import './Admin.css';

function AdminProperties() {
  const [list, setList] = useState(initialProperties);
  const [filter, setFilter] = useState('Todas');
  const [search, setSearch] = useState('');

  function toggleActive(id: string) {
    setList(list.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  }

  const visible = list
    .filter((p) => filter === 'Todas' || (filter === 'Activas' ? p.active : !p.active))
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  const count = (active: boolean) => list.filter((p) => p.active === active).length;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="page">
          <div className="page-header">
            <div>
              <p className="label">Gestión</p>
              <h1 className="page-title">Propiedades</h1>
              <p className="page-subtitle">Administra el catálogo de inmuebles.</p>
            </div>
            <Link to="/admin/propiedades/nueva" className="btn">+ Nueva propiedad</Link>
          </div>

          <div className="table-box">
            <div className="table-tools">
              <div className="tabs">
                {['Todas', 'Activas', 'Inactivas'].map((f) => (
                  <button key={f} className={filter === f ? 'tab tab-active' : 'tab'} onClick={() => setFilter(f)}>
                    {f} ({f === 'Todas' ? list.length : count(f === 'Activas')})
                  </button>
                ))}
              </div>
              <input className="table-search" type="search" aria-label="Buscar propiedad" placeholder="Buscar propiedad..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {visible.length === 0 ? (
              <div className="empty"><strong>Sin resultados</strong>No hay propiedades que coincidan.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Propiedad</th><th>Tipo</th><th>Operación</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id} className={p.active ? '' : 'admin-inactive'}>
                      <td><img className="admin-thumb" src={p.images[0]} alt="" />{p.title}</td>
                      <td>{p.type}</td>
                      <td>{p.operation}</td>
                      <td>{p.price.toLocaleString('es-ES')} €{p.operation === 'Alquiler' && '/mes'}</td>
                      <td><StatusBadge status={p.active ? 'Activa' : 'Inactiva'} /></td>
                      <td>
                        <div className="admin-actions">
                          <Link to={`/admin/propiedades/${p.id}/editar`}>Editar</Link>
                          <button className="link-button" onClick={() => toggleActive(p.id)}>{p.active ? 'Desactivar' : 'Activar'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminProperties;
