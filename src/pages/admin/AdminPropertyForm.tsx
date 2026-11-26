import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createProperty, getPropertyForAdmin, updateProperty } from '../../api/properties';
import AddressSearch from '../../components/AddressSearch';
import { findHouse, formatAddress, provinceFromPostalCode } from '../../utils/address';
import type { FoundAddress } from '../../utils/address';
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
};

function AdminPropertyForm() {
  // Con id se edita una propiedad, sin id se crea una nueva
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  // Dirección real elegida en el buscador (con sus coordenadas)
  const [address, setAddress] = useState<FoundAddress | null>(null);
  // Dirección guardada antes, sin coordenadas: hay que volver a buscarla
  const [oldAddress, setOldAddress] = useState('');
  // Punto y código postal de la calle elegida, para volver a ellos si no se encuentra el número
  const streetPin = useRef<Pick<FoundAddress, 'lat' | 'lng' | 'postalCode' | 'province'> | null>(null);
  // Dirección con el número recién escrito, pendiente de buscar su portal
  const [numberToFind, setNumberToFind] = useState<FoundAddress | null>(null);
  // '' = sin comprobar, 'buscando', 'portal' = punto en el número exacto, 'calle' = punto en la calle
  const [pin, setPin] = useState<'' | 'buscando' | 'portal' | 'calle'>('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProperty() {
      try {
        const p = await getPropertyForAdmin(id!);
        setForm({
          title: p.title,
          description: p.description,
          type: p.type,
          status: p.status,
          price: String(p.price),
          area: p.area ? String(p.area) : '',
          image: p.image || '',
        });
        const a = p.address;
        if (a.coordinates) {
          setAddress({ street: a.street, number: a.number || '', postalCode: a.postalCode, city: a.city, province: a.province, lat: a.coordinates.lat, lng: a.coordinates.lng });
        } else {
          setOldAddress(`${a.street} ${a.number || ''}, ${a.postalCode} ${a.city} (${a.province})`);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    if (id) {
      loadProperty();
    }
  }, [id]);

  // Al cambiar el número se busca ese portal (espera a que se deje de escribir)
  useEffect(() => {
    if (!numberToFind) return;
    const wanted = numberToFind;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      let found = null;
      try {
        found = await findHouse(wanted, controller.signal);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
      const point = found || streetPin.current;
      // Solo si el número sigue siendo el mismo que se buscó.
      // El portal puede tener otro código postal que el tramo de calle elegido.
      setAddress((cur) => {
        if (!cur || !point || cur.number !== wanted.number) return cur;
        const moved = { ...cur, lat: point.lat, lng: point.lng };
        if (point.postalCode) {
          moved.postalCode = point.postalCode;
          moved.province = point.province;
        }
        return moved;
      });
      setPin(found ? 'portal' : 'calle');
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [numberToFind]);

  function chooseAddress(a: FoundAddress) {
    setAddress(a);
    setError('');
    streetPin.current = { lat: a.lat, lng: a.lng, postalCode: a.postalCode, province: a.province };
    setPin(a.number ? 'portal' : 'calle');
  }

  function changeNumber(number: string) {
    if (!address) return;
    const next = { ...address, number };
    setAddress(next);
    if (number.trim()) {
      setPin('buscando');
      setNumberToFind(next);
    } else {
      setNumberToFind(null);
      if (streetPin.current) setAddress({ ...next, ...streetPin.current });
      setPin('calle');
    }
  }

  // Actualiza el campo según el name del input
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    // La dirección tiene que ser real: elegida de las sugerencias y con código postal de 5 dígitos
    if (pin === 'buscando') {
      setError('Espera un momento: se está buscando el número en el mapa.');
      return;
    }
    if (!address) {
      setError('Busca la dirección y elígela de la lista de sugerencias.');
      return;
    }
    if (!/^[0-9]{5}$/.test(address.postalCode)) {
      setError('El código postal debe tener 5 dígitos.');
      return;
    }
    const data = {
      title: form.title,
      description: form.description,
      type: form.type,
      status: form.status,
      price: Number(form.price),
      area: Number(form.area),
      image: form.image,
      address: {
        street: address.street,
        number: address.number,
        postalCode: address.postalCode,
        city: address.city,
        province: address.province,
        coordinates: { lat: address.lat, lng: address.lng },
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
      <p className="page-subtitle">Así se verá la ficha en la web pública.</p>

      <form className="form-box admin-form" onSubmit={handleSubmit}>
        <h2 className="form-box-title">Anuncio</h2>
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
        <h2 className="form-box-title">Precio y superficie</h2>
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
        <h2 className="form-box-title">Foto</h2>
        {form.image && <img className="admin-form-preview" src={form.image} alt="Vista previa de la foto" />}
        <label className="field">
          URL de la imagen
          <input name="image" type="text" placeholder="/images/propiedades/mi-foto.jpg o https://…" value={form.image} onChange={handleChange} />
        </label>
        <h2 className="form-box-title">Dirección</h2>
        {address ? (
          <div className="address-chosen">
            <p>
              {formatAddress(address)}
              <span>
                {pin === 'buscando' && 'Buscando el número en el mapa…'}
                {pin === 'portal' && 'El punto del mapa está en el portal. '}
                {pin === 'calle' && (address.number
                  ? `No encontramos el número ${address.number} en el mapa: el punto queda en la calle. `
                  : 'Sin número: el punto del mapa queda en la calle. ')}
                {pin !== 'buscando' && (
                  <a href={`https://www.openstreetmap.org/?mlat=${address.lat}&mlon=${address.lng}#map=18/${address.lat}/${address.lng}`} target="_blank" rel="noreferrer">
                    Ver el punto en el mapa
                  </a>
                )}
              </span>
            </p>
            <button type="button" className="link-button" onClick={() => { setAddress(null); setPin(''); setNumberToFind(null); }}>Cambiar dirección</button>
          </div>
        ) : (
          <>
            {oldAddress && (
              <div className="address-chosen address-missing">
                <p>
                  {oldAddress}
                  <span>Esta dirección no tiene ubicación. Búscala y elígela de la lista para guardarla.</span>
                </p>
              </div>
            )}
            <AddressSearch onSelect={chooseAddress} />
          </>
        )}
        {address && (
          <div className="form-row">
            <label className="field">
              Número
              <input value={address.number} onChange={(e) => changeNumber(e.target.value)} />
            </label>
            <label className="field">
              Código postal
              <input inputMode="numeric" pattern="[0-9]{5}" title="5 dígitos" required value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value, province: provinceFromPostalCode(e.target.value) || address.province })} />
            </label>
          </div>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn">{id ? 'Guardar cambios' : 'Publicar propiedad'}</button>
          <Link to="/admin/propiedades" className="link-button">Cancelar</Link>
        </div>
      </form>
    </main>
  );
}

export default AdminPropertyForm;
