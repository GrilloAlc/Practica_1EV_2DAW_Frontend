import { useEffect, useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createProperty, getProperty, updateProperty } from '../../api/properties';
import { getErrorMessage } from '../../api/client';
import { PROPERTY_STATUSES, PROPERTY_TYPES } from '../../utils/labels';

const emptyForm = {
  title: '',
  description: '',
  type: 'Piso',
  status: 'En venta',
  price: '',
  area: '',
  image: '',
  street: '',
  number: '',
  postalCode: '',
  city: '',
  province: '',
};

function AdminPropertyForm() {
  // Con id se edita una propiedad, sin id se crea una nueva
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProperty() {
      try {
        const p = await getProperty(id!);
        setForm({
          title: p.title,
          description: p.description,
          type: p.type,
          status: p.status,
          price: String(p.price),
          area: p.area ? String(p.area) : '',
          image: p.image || '',
          street: p.address.street,
          number: p.address.number || '',
          postalCode: p.address.postalCode,
          city: p.address.city,
          province: p.address.province,
        });
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    if (id) {
      loadProperty();
    }
  }, [id]);

  // Actualiza el campo según el name del input
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    const data = {
      title: form.title,
      description: form.description,
      type: form.type,
      status: form.status,
      price: Number(form.price),
      area: Number(form.area),
      image: form.image,
      address: {
        street: form.street,
        number: form.number,
        postalCode: form.postalCode,
        city: form.city,
        province: form.province,
      },
    };

    try {
      if (id) {
        await updateProperty(id, data);
      } else {
        await createProperty(data);
      }
      navigate('/admin/propiedades');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main className="page">
      <p className="breadcrumb"><Link to="/admin/propiedades">Propiedades</Link> / {id ? 'Editar' : 'Nueva'}</p>
      <h1 className="page-title">{id ? 'Editar propiedad' : 'Nueva propiedad'}</h1>
      <p className="page-subtitle">Completa los datos del inmueble.</p>

      <form className="form-box" onSubmit={handleSubmit}>
        <label className="field">
          Título
          <input name="title" required maxLength={120} value={form.title} onChange={handleChange} />
        </label>
        <label className="field">
          Descripción
          <textarea name="description" required maxLength={2000} value={form.description} onChange={handleChange} />
        </label>
        <div className="form-row">
          <label className="field">
            Tipo
            <select name="type" value={form.type} onChange={handleChange}>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="field">
            Estado
            <select name="status" value={form.status} onChange={handleChange}>
              {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            Precio (€)
            <input name="price" type="number" min="0" required value={form.price} onChange={handleChange} />
          </label>
          <label className="field">
            Superficie (m²)
            <input name="area" type="number" min="0" value={form.area} onChange={handleChange} />
          </label>
        </div>
        <label className="field">
          URL de la imagen
          <input name="image" type="url" placeholder="https://..." value={form.image} onChange={handleChange} />
        </label>
        <div className="form-row">
          <label className="field">
            Calle
            <input name="street" required value={form.street} onChange={handleChange} />
          </label>
          <label className="field">
            Número
            <input name="number" value={form.number} onChange={handleChange} />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            Código postal
            <input name="postalCode" required pattern="[0-9]{5}" title="5 dígitos" value={form.postalCode} onChange={handleChange} />
          </label>
          <label className="field">
            Ciudad
            <input name="city" required value={form.city} onChange={handleChange} />
          </label>
        </div>
        <label className="field">
          Provincia
          <input name="province" required value={form.province} onChange={handleChange} />
        </label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="submit" className="btn">Guardar propiedad</button>
      </form>
    </main>
  );
}

export default AdminPropertyForm;
