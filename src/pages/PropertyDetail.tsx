import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './PropertyDetail.css';
import '../components/PropertyTile.css';
import { getProperties, getProperty } from '../api/properties';
import { getErrorMessage, getErrorStatus } from '../api/client';
import { useAuth } from '../context/useAuth';
import { formatNumber, formatPrice, isRentStatus } from '../utils/labels';
import { propertyPhotos, typeImage } from '../utils/photos';
import { PHONE, PHONE_HREF } from '../utils/contact';
import { useSlowLoading } from '../utils/useSlowLoading';
import type { Property } from '../types';
import MortgageCalculator from '../components/MortgageCalculator';
import PropertyGallery from '../components/PropertyGallery';
import PropertyTile from '../components/PropertyTile';
import StaticMap from '../components/StaticMap';
import { DetailSkeleton } from '../components/Skeleton';

function PropertyDetail() {
  const { id } = useParams();
  // Una ficha nueva por cada casa: al pasar de una a otra no se quedan los datos de la anterior
  return <PropertyPage key={id} id={id!} />;
}

function PropertyPage({ id }: { id: string }) {
  const location = useLocation();
  const { user } = useAuth();
  // Si se llega desde un anuncio, ya tenemos la casa: se pinta al instante y la foto
  // hace la transición desde la tarjeta. Después se pide al servidor por si ha cambiado.
  const passed = (location.state as { property?: Property } | null)?.property;
  const [property, setProperty] = useState<Property | null>(passed && passed._id === id ? passed : null);
  const [error, setError] = useState<{ status: number | null; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [similar, setSimilar] = useState<Property[] | null>(null);
  const slow = useSlowLoading(!property && !error, id + attempt);

  useEffect(() => {
    let current = true;
    getProperty(id).then(
      (result) => {
        if (!current) return;
        setProperty(result);
        setError(null);
      },
      (err) => {
        if (current) setError({ status: getErrorStatus(err), message: getErrorMessage(err) });
      },
    );
    return () => {
      current = false;
    };
  }, [id, attempt]);

  // Otras casas de la misma ciudad, primero las del mismo tipo
  const city = property?.address.city;
  const type = property?.type;
  useEffect(() => {
    if (!city) return;
    let current = true;
    getProperties({ city, limit: 10 }).then(
      (list) => {
        if (!current) return;
        const others = list.filter((p) => p._id !== id).sort((a, b) => Number(b.type === type) - Number(a.type === type));
        setSimilar(others.slice(0, 3));
      },
      () => {
        if (current) setSimilar([]);
      },
    );
    return () => {
      current = false;
    };
  }, [city, type, id]);

  // 404: la casa no existe o se ha desactivado (aunque se tuviera del anuncio, ya no está publicada).
  // Con un enlace mal copiado (id que no es de MongoDB) el backend responde 500: también es "no existe"
  if (error?.status === 404 || (error?.status === 500 && !/^[0-9a-f]{24}$/i.test(id))) {
    return (
      <main className="page">
        <title>Casa no disponible · CataHome</title>
        <div className="empty table-box">
          <strong>Esta casa ya no está publicada</strong>
          Puede que se haya vendido o que el enlace no sea correcto. <Link to="/propiedades">Ver otras casas</Link>
        </div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="page">
        <title>Cargando casa · CataHome</title>
        {error ? (
          <div className="empty table-box" role="alert">
            <strong>No hemos podido cargar esta casa</strong>
            <p>{error.message}</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setError(null);
                setAttempt(attempt + 1);
              }}
            >
              Volver a intentarlo
            </button>
          </div>
        ) : (
          <>
            {slow && <p className="notice" role="status">Estamos despertando el servidor. La primera visita puede tardar unos segundos.</p>}
            <DetailSkeleton />
          </>
        )}
      </main>
    );
  }

  const address = property.address;
  const photos = propertyPhotos(property);
  const isRent = isRentStatus(property.status);
  const sold = property.status === 'Vendida' || property.status === 'Alquilada';
  const reserved = property.status === 'Reservada';
  const pricePerM2 = property.area && !isRent ? Math.round(property.price / property.area) : null;
  // Preguntar y pedir visita son consultas: solo para visitantes (entran como clientes) y clientes
  const canAsk = !user || user.role === 'CLIENTE';
  const isAdmin = user?.role === 'ADMIN';
  const subject = (text: string) => encodeURIComponent(text.slice(0, 200));
  const contactUrl = `/mis-tickets/nuevo?casa=${property._id}&asunto=${subject('Consulta sobre: ' + property.title)}`;
  const visitUrl = `/mis-tickets/nuevo?casa=${property._id}&categoria=SOLICITUD_VISITA&asunto=${subject('Quiero visitar: ' + property.title)}`;
  const similarUrl = `/mis-tickets/nuevo?casa=${property._id}&asunto=${subject('Busco algo parecido a: ' + property.title)}`;
  const cityUrl = '/propiedades?city=' + encodeURIComponent(address.city);
  const coords = address.coordinates;
  // Con coordenadas se marca el punto exacto; si no, se busca la dirección en OpenStreetMap
  const mapUrl = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`
    : 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(`${address.street} ${address.number || ''}, ${address.city}`);

  return (
    <main className="page detail">
      <title>{`${property.title} · CataHome`}</title>
      <meta name="description" content={`${property.title} en ${address.city}. ${formatPrice(property)}. ${property.description.slice(0, 120)}`} />

      <p className="breadcrumb">
        <Link to="/">Inicio</Link> / <Link to="/propiedades">Casas</Link> / <Link to={cityUrl}>{address.city}</Link>
      </p>

      <PropertyGallery photos={photos} title={property.title} fallback={typeImage(property.type)} transitionName={`foto-${property._id}`} badge={property.status} />

      <div className="detail-layout">
        <div className="detail-main">
          <header className="detail-head">
            <p className="detail-city">{address.city}</p>
            <h1 className="detail-title">{property.title}</h1>
            <p className="detail-place">
              {address.street} {address.number}, {address.city} ({address.province})
            </p>
            <p className="detail-price">
              {formatPrice(property)}
              {pricePerM2 && <span>{formatNumber(pricePerM2)} €/m²</span>}
            </p>
            <ShareButton title={property.title} />
          </header>

          <dl className="detail-facts">
            <div>
              <dt>Tipo</dt>
              <dd>{property.type}</dd>
            </div>
            {property.area ? (
              <div>
                <dt>Superficie</dt>
                <dd>{formatNumber(property.area)} m²</dd>
              </div>
            ) : null}
            <div>
              <dt>Operación</dt>
              <dd>{isRent ? 'Alquiler' : 'Venta'}</dd>
            </div>
            <div>
              <dt>Código postal</dt>
              <dd>{address.postalCode}</dd>
            </div>
          </dl>

          <section className="detail-section">
            <h2>Notas de cata</h2>
            <p className="detail-description">{property.description}</p>
          </section>

          {!isRent && !sold && property.type !== 'Terreno' && <MortgageCalculator price={property.price} />}

          <section className="detail-section">
            <h2>Dónde está</h2>
            <p>
              {address.street} {address.number}
              <br />
              {address.postalCode} {address.city}, {address.province}
            </p>
            {coords ? (
              <StaticMap lat={coords.lat} lng={coords.lng} href={mapUrl} label={`Ver ${address.street} ${address.number || ''} en el mapa de OpenStreetMap`} />
            ) : null}
            <a className="link-button detail-map-link" href={mapUrl} target="_blank" rel="noreferrer">
              Abrir en OpenStreetMap
            </a>
          </section>
        </div>

        <aside className="detail-contact">
          <p className="detail-contact-price">{formatPrice(property)}</p>
          {sold ? (
            <>
              <h2>{property.status === 'Vendida' ? 'Ya se ha vendido' : 'Ya se ha alquilado'}</h2>
              <p>Si buscas algo parecido, mira otras casas en {address.city} o cuéntanos qué necesitas.</p>
              <Link to={cityUrl} className="btn btn-acento detail-contact-btn">Ver casas en {address.city}</Link>
              {canAsk && <Link to={similarUrl} className="btn btn-outline detail-contact-btn">Buscar algo parecido</Link>}
            </>
          ) : isAdmin ? (
            <>
              <h2>Así la ven los clientes</h2>
              <p>Desde el panel puedes cambiar sus datos y sus fotos, o dejar de publicarla.</p>
              <Link to={`/admin/propiedades/${property._id}/editar`} className="btn btn-acento detail-contact-btn">Editar esta casa</Link>
            </>
          ) : canAsk ? (
            <>
              <h2>{reserved ? 'Está reservada' : '¿Quieres verla?'}</h2>
              <p>
                {reserved
                  ? 'Hay una reserva en curso. Si no sale adelante, te avisamos.'
                  : 'Escríbenos y un agente te responde por escrito, normalmente en menos de 24 horas.'}
              </p>
              <Link to={contactUrl} className="btn btn-acento detail-contact-btn">Preguntar por esta casa</Link>
              {!reserved && <Link to={visitUrl} className="btn btn-outline detail-contact-btn">Pedir una visita</Link>}
            </>
          ) : (
            <>
              <h2>¿Te preguntan por ella?</h2>
              <p>Las consultas de los clientes sobre esta casa te llegan en tu lista de tickets.</p>
              <Link to="/agente/tickets" className="btn btn-outline detail-contact-btn">Ir a mis tickets</Link>
            </>
          )}
          <p className="detail-contact-phone">
            O llámanos al <a href={PHONE_HREF}>{PHONE}</a>
          </p>
        </aside>

        {/* En el teléfono la caja de contacto queda al final: esta barra fija deja preguntar desde cualquier punto */}
        <div className="detail-bar">
          <p className="detail-bar-price">{formatPrice(property)}</p>
          <a href={PHONE_HREF} className="btn btn-outline detail-bar-call">Llamar</a>
          {canAsk && !sold && <Link to={contactUrl} className="btn btn-acento">Preguntar</Link>}
          {isAdmin && <Link to={`/admin/propiedades/${property._id}/editar`} className="btn btn-acento">Editar</Link>}
        </div>
      </div>

      {similar && similar.length > 0 && (
        <section className="detail-similar" aria-labelledby="detail-similar-title">
          <div className="detail-similar-head">
            <h2 id="detail-similar-title">Otras casas en {address.city}</h2>
            <Link to={cityUrl} className="link-button">Ver todas</Link>
          </div>
          <div className="tile-grid">
            {similar.map((p) => (
              <PropertyTile key={p._id} property={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// Compartir la ficha: el menú del móvil si lo hay; si no, copia el enlace
function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Se ha cancelado el menú de compartir o el navegador no deja copiar: no pasa nada
    }
  }

  return (
    <p className="detail-share">
      <button type="button" className="link-button" onClick={share}>Compartir</button>
      <span role="status">{copied ? 'Enlace copiado' : ''}</span>
    </p>
  );
}

export default PropertyDetail;
