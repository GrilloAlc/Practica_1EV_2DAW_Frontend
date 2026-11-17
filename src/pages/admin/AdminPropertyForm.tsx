import type { SyntheticEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { properties } from '../../data/properties';
import AdminSidebar from '../../components/AdminSidebar';
import './Admin.css';

function AdminPropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const property = properties.find((p) => p.id === id);

  const empty = { title: '', operation: 'Venta', type: 'Piso', city: '', price: '', area: '', rooms: '', bathrooms: '' };
  const values = property || empty;

  function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    navigate('/admin/propiedades');
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="page">
          <p className="breadcrumb"><Link to="/admin/propiedades">Propiedades</Link> / {property ? 'Editar' : 'Nueva'}</p>
          <h1 className="page-title">{property ? 'Editar propiedad' : 'Nueva propiedad'}</h1>
          <p className="page-subtitle">Completa los datos del inmueble.</p>

          <form className="form-box" onSubmit={handleSubmit}>
            <label className="field">
              Título
              <input name="titulo" required defaultValue={values.title} />
            </label>
            <div className="form-row">
              <label className="field">
                Operación
                <select name="operacion" defaultValue={values.operation}>
                  <option>Venta</option>
                  <option>Alquiler</option>
                </select>
              </label>
              <label className="field">
                Tipo
                <select name="tipo" defaultValue={values.type}>
                  <option>Piso</option>
                  <option>Casa</option>
                </select>
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                Precio (€)
                <input name="precio" type="number" min="0" required defaultValue={values.price} />
              </label>
              <label className="field">
                Ciudad
                <input name="ciudad" required defaultValue={values.city} />
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                Superficie (m²)
                <input name="area" type="number" min="1" required defaultValue={values.area} />
              </label>
              <label className="field">
                Habitaciones
                <input name="habitaciones" type="number" min="0" required defaultValue={values.rooms} />
              </label>
            </div>
            <label className="field">
              Baños
              <input name="banos" type="number" min="0" required defaultValue={values.bathrooms} />
            </label>
            <button type="submit" className="btn">Guardar propiedad</button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminPropertyForm;
