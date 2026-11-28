import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createProperty, getProperty, updateProperty } from '../../api/properties';
import AddressSearch from '../../components/AddressSearch';
import Photo from '../../components/Photo';
import { DetailSkeleton } from '../../components/Skeleton';
import { findHouse, formatAddress, provinceFromPostalCode } from '../../utils/address';
import type { FoundAddress } from '../../utils/address';
import { getErrorMessage, getErrorStatus } from '../../api/client';
import { PROPERTY_STATUSES, PROPERTY_TYPES, formatNumber, formatPrice, isRentStatus, operationLabel } from '../../utils/labels';
import { propertyPhotos, typeImage } from '../../utils/photos';
import type { Property } from '../../types';

const emptyForm = {
  title: '',
  description: '',
  type: 'Piso',
  status: 'En venta',
  price: '',
  area: '',
};

// Una dirección de foto por línea; se aceptan rutas de la web (/images/...) y direcciones https://
function parsePhotos(text: string) {
  return [...new Set(text.split(/\s+/).map((p) => p.trim()).filter(Boolean))];
}

function isValidPhoto(url: string) {
  return url.startsWith('/') || /^https:\/\/\S+$/.test(url);
}

function AdminPropertyForm() {
  const { id } = useParams();
  // Con id se edita una propiedad, sin id se crea una nueva. Otra casa = formulario nuevo
  return <PropertyForm key={id || 'nueva'} id={id} />;
}

function PropertyForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  // Fotos, una por línea. La primera es la portada
  const [photosText, setPhotosText] = useState('');
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
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  // Error del servidor al guardar (abajo, junto al botón)
  const [error, setError] = useState('');
  // Errores de cada campo, todos a la vez, debajo de su campo
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!id) return;
    let current = true;
    getProperty(id).then(
      (p) => {
        if (!current) return;
        setForm({
          title: p.title,
          description: p.description,
          type: p.type,
          status: p.status,
          price: String(p.price),
          area: p.area ? String(p.area) : '',
        });
        // Solo las fotos guardadas (sin la de respaldo del tipo)
        setPhotosText(p.image || (p.images && p.images.length) ? propertyPhotos(p).join('\n') : '');
        const a = p.address;
        if (a.coordinates) {
          setAddress({ street: a.street, number: a.number || '', postalCode: a.postalCode, city: a.city, province: a.province, lat: a.coordinates.lat, lng: a.coordinates.lng });
        } else {
          setOldAddress(`${a.street} ${a.number || ''}, ${a.postalCode} ${a.city} (${a.province})`);
        }
        setLoading(false);
      },
      (err) => {
        if (!current) return;
        setLoadError(
          getErrorStatus(err) === 404
            ? 'Esta casa no existe o está desactivada. Las desactivadas no se pueden editar: actívala desde la lista y vuelve a intentarlo.'
            : getErrorMessage(err),
        );
        setLoading(false);
      },
    );
    return () => {
      current = false;
    };
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
    setErrors((e) => ({ ...e, address: undefined }));
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
    // Al corregir un campo desaparece su error
    if (errors[e.target.name as keyof FieldErrors]) setErrors({ ...errors, [e.target.name]: undefined });
  }

  const photos = parsePhotos(photosText);

  function movePhotoFirst(url: string) {
    setPhotosText([url, ...photos.filter((p) => p !== url)].join('\n'));
  }

  function removePhoto(url: string) {
    setPhotosText(photos.filter((p) => p !== url).join('\n'));
  }

  // Comprueba todos los campos a la vez y devuelve los errores de cada uno
  function validate(price: number, area: number | undefined): FieldErrors {
    const found: FieldErrors = {};
    if (!form.title.trim()) found.title = 'Escribe un título.';
    if (!form.description.trim()) found.description = 'Escribe una descripción.';
    if (!Number.isFinite(price) || price <= 0) found.price = 'Tiene que ser un número mayor que cero.';
    if (area !== undefined && (!Number.isFinite(area) || area <= 0)) found.area = 'Tiene que ser mayor que cero, o quedarse vacía.';
    const wrongPhoto = photos.find((ph) => !isValidPhoto(ph));
    if (wrongPhoto) found.photos = `Esta no es una dirección válida: ${wrongPhoto}. Usa direcciones que empiecen por https:// o por /images/.`;
    // La dirección tiene que ser real: elegida de las sugerencias y con código postal de 5 dígitos
    if (pin === 'buscando') found.address = 'Espera un momento: se está buscando el número en el mapa.';
    else if (!address) found.address = 'Busca la dirección y elígela de la lista de sugerencias.';
    else if (!/^[0-9]{5}$/.test(address.postalCode)) found.postalCode = 'El código postal tiene 5 números.';
    return found;
  }

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (saving) return;
    const price = Number(form.price);
    const area = form.area ? Number(form.area) : undefined;
    const found = validate(price, area);
    setErrors(found);
    setError('');
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) {
      // Lleva al primer campo con error
      const el = document.getElementById(fieldId(first));
      (el?.matches('input, textarea, select') ? el : el?.querySelector<HTMLElement>('input') || el)?.focus();
      return;
    }
    if (!address) return;
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      status: form.status,
      price,
      ...(area !== undefined ? { area } : {}),
      // El backend guarda un solo texto: las fotos van separadas por espacios (la primera, la portada).
      // images es por si algún día el backend guarda la lista
      image: photos.join(' '),
      images: photos,
      address: {
        street: address.street,
        number: address.number,
        postalCode: address.postalCode,
        city: address.city,
        province: address.province,
        coordinates: { lat: address.lat, lng: address.lng },
      },
    };

    setSaving(true);
    try {
      if (id) {
        await updateProperty(id, data);
      } else {
        await createProperty(data);
      }
      navigate('/admin/propiedades', { state: { saved: id ? 'Cambios guardados.' : 'Casa publicada.' } });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  const rent = isRentStatus(form.status);

  // La casa tal y como quedaría, para la vista previa de la derecha
  const preview: Property = {
    _id: id || 'nueva',
    title: form.title.trim() || 'Título del anuncio',
    description: form.description.trim() || 'La descripción aparecerá aquí.',
    type: form.type,
    status: form.status,
    price: Math.max(Number(form.price) || 0, 0),
    area: Number(form.area) || undefined,
    image: photos.filter(isValidPhoto).join(' '),
    isActive: true,
    address: address
      ? { street: address.street, number: address.number, city: address.city, province: address.province, postalCode: address.postalCode }
      : { street: 'Calle', city: 'Ciudad', province: '', postalCode: '' },
  };

  return (
    <main className="page">
      <title>{`${id ? 'Editar propiedad' : 'Nueva propiedad'} · Administración · CataHome`}</title>
      <p className="breadcrumb"><Link to="/admin/propiedades">Propiedades</Link> / {id ? 'Editar' : 'Nueva'}</p>
      <h1 className="page-title">{id ? 'Editar propiedad' : 'Nueva propiedad'}</h1>
      <p className="page-subtitle">Lo que escribas aquí es lo que se ve en la ficha de la web pública.</p>

      {loading ? (
        <DetailSkeleton />
      ) : loadError ? (
        <div className="empty table-box" role="alert">
          <strong>No se puede editar esta casa</strong>
          <p>{loadError}</p>
          <Link to="/admin/propiedades" className="btn btn-outline">Volver a la lista</Link>
        </div>
      ) : (
        <div className="admin-form-layout">
        <form className="form-box admin-form" onSubmit={handleSubmit} noValidate>
          <h2 className="form-box-title">Anuncio</h2>
          <label className="field">
            Título
            <input name="title" required maxLength={120} value={form.title} onChange={handleChange} id={fieldId('title')} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? fieldId('title') + '-error' : undefined} />
            <FieldError name="title" errors={errors} />
          </label>
          <label className="field">
            Descripción
            <textarea name="description" required maxLength={2000} value={form.description} onChange={handleChange} id={fieldId('description')} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? fieldId('description') + '-error' : undefined} />
            <FieldError name="description" errors={errors} />
            <span className="field-help">{form.description.length} / 2000 caracteres. Deja una línea en blanco entre párrafos.</span>
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
              {rent ? 'Alquiler al mes (€)' : 'Precio (€)'}
              <input name="price" type="number" min="1" step="1" required inputMode="numeric" value={form.price} onChange={handleChange} id={fieldId('price')} aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? fieldId('price') + '-error' : undefined} />
              <FieldError name="price" errors={errors} />
            </label>
            <label className="field">
              Superficie (m²)
              <input name="area" type="number" min="1" step="1" inputMode="numeric" value={form.area} onChange={handleChange} id={fieldId('area')} aria-invalid={Boolean(errors.area)} aria-describedby={errors.area ? fieldId('area') + '-error' : undefined} />
              <FieldError name="area" errors={errors} />
            </label>
          </div>

          <h2 className="form-box-title">Fotos</h2>
          {photos.length > 0 && (
            <ul className="admin-photos">
              {photos.map((url, i) => (
                <li key={url}>
                  <Photo src={url} fallback={typeImage(form.type)} pixels={400} alt={`Foto ${i + 1}`} sizes="160px" />
                  {i === 0 && <span className="admin-photos-tag">Portada</span>}
                  <span className="admin-photos-actions">
                    {i > 0 && <button type="button" className="link-button" onClick={() => movePhotoFirst(url)}>Poner de portada</button>}
                    <button type="button" className="link-button" onClick={() => removePhoto(url)}>Quitar</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <label className="field">
            Direcciones de las fotos
            <textarea
              className="admin-photos-input"
              rows={4}
              placeholder={'https://images.unsplash.com/photo-…\nhttps://…/otra-foto.jpg'}
              value={photosText}
              onChange={(e) => {
                setPhotosText(e.target.value);
                if (errors.photos) setErrors({ ...errors, photos: undefined });
              }}
              spellCheck={false}
              id={fieldId('photos')} aria-invalid={Boolean(errors.photos)} aria-describedby={errors.photos ? fieldId('photos') + '-error' : undefined}
            />
            <FieldError name="photos" errors={errors} />
            <span className="field-help">Una por línea. La primera es la portada. Sin fotos se usa una del tipo de inmueble.</span>
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
              <div id={fieldId('address')} tabIndex={-1} className="admin-address-search">
                <AddressSearch onSelect={chooseAddress} />
              </div>
            </>
          )}
          {errors.address && <p className="field-message" id={fieldId('address') + '-error'} role="alert">{errors.address}</p>}
          {address && (
            <div className="form-row">
              <label className="field">
                Número
                <input value={address.number} onChange={(e) => changeNumber(e.target.value)} />
              </label>
              <label className="field">
                Código postal
                <input inputMode="numeric" pattern="[0-9]{5}" title="5 dígitos" required value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value, province: provinceFromPostalCode(e.target.value) || address.province })} id={fieldId('postalCode')} aria-invalid={Boolean(errors.postalCode)} aria-describedby={errors.postalCode ? fieldId('postalCode') + '-error' : undefined} />
                <FieldError name="postalCode" errors={errors} />
              </label>
            </div>
          )}
          {Object.values(errors).some(Boolean) && <p className="field-error" role="alert">Revisa los campos marcados.</p>}
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn btn-acento" disabled={saving}>{saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Publicar propiedad'}</button>
            <Link to="/admin/propiedades" className="link-button">Cancelar</Link>
          </div>
        </form>

        {/* Vista previa: cómo se verá el anuncio en el listado, mientras se escribe */}
        <aside className="admin-preview" aria-label="Vista previa del anuncio">
          <p className="admin-preview-label">Vista previa del anuncio</p>
          <div className="admin-preview-photo">
            <Photo src={preview.image?.split(' ')[0] || typeImage(preview.type)} fallback={typeImage(preview.type)} pixels={800} alt="" sizes="360px" />
            <span className="admin-preview-badge">{operationLabel(preview.status)}</span>
          </div>
          <p className="admin-preview-price">{preview.price ? formatPrice(preview) : rent ? 'Precio al mes' : 'Precio'}</p>
          <h2 className="admin-preview-title">{preview.title}</h2>
          <p className="admin-preview-place">{preview.address.street}{address?.number ? ' ' + address.number : ''}, {preview.address.city}</p>
          <p className="admin-preview-facts">
            {preview.type}
            {preview.area ? ` · ${formatNumber(preview.area)} m²` : ''}
            {preview.address.province ? ` · ${preview.address.province}` : ''}
          </p>
          <p className="admin-preview-text">{preview.description}</p>
        </aside>
        </div>
      )}
    </main>
  );
}

type FieldName = 'title' | 'description' | 'price' | 'area' | 'photos' | 'address' | 'postalCode';
type FieldErrors = Partial<Record<FieldName, string>>;

// Orden de los campos en pantalla: el primero con error recibe el foco
const FIELD_ORDER: FieldName[] = ['title', 'description', 'price', 'area', 'photos', 'address', 'postalCode'];

function fieldId(name: FieldName) {
  return 'propiedad-' + name;
}

// Mensaje de error debajo de un campo, enlazado con aria-describedby
function FieldError({ name, errors }: { name: FieldName; errors: FieldErrors }) {
  if (!errors[name]) return null;
  return <span className="field-message" id={fieldId(name) + '-error'}>{errors[name]}</span>;
}

export default AdminPropertyForm;
