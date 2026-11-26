import { useEffect, useState, ViewTransition } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './PropertyDetail.css';
import { getProperty } from '../api/properties';
import { getErrorMessage } from '../api/client';
import { formatNumber, formatPrice, propertyImage } from '../utils/labels';
import type { Property } from '../types';
import MortgageCalculator from '../components/MortgageCalculator';
import { DetailSkeleton } from '../components/Skeleton';

function PropertyDetail() {
  const { id } = useParams();
  const location = useLocation();
  // Si se llega desde un anuncio, ya tenemos la vivienda: se pinta al instante y la foto
  // hace la transición desde la tarjeta. Después se pide al servidor por si ha cambiado.
  const passed = (location.state as { property?: Property } | null)?.property;
  const [property, setProperty] = useState<Property | null>(passed && passed._id === id ? passed : null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProperty() {
      try {
        const result = await getProperty(id!);
        setProperty(result);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadProperty();
  }, [id]);

  if (!property) {
    return (
      <main className="page">
        {error ? (
          <div className="empty table-box">
            <strong>Esta vivienda ya no está publicada</strong>
            {error} <Link to="/propiedades">Ver otras viviendas</Link>
          </div>
        ) : (
          <DetailSkeleton />
        )}
      </main>
    );
  }

  const address = property.address;
  const isRent = property.status === 'Disponible para alquilar' || property.status === 'Alquilada';
  const pricePerM2 = property.area && !isRent ? Math.round(property.price / property.area) : null;
  const contactUrl = '/mis-tickets/nuevo?asunto=' + encodeURIComponent('Consulta sobre: ' + property.title);
  const visitUrl = '/mis-tickets/nuevo?categoria=SOLICITUD_VISITA&asunto=' + encodeURIComponent('Quiero visitar: ' + property.title);
  const coords = address.coordinates;
  // Con coordenadas se marca el punto exacto; si no, se busca la dirección en OpenStreetMap
  const mapUrl = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`
    : 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(`${address.street} ${address.number || ''}, ${address.city}`);

  return (
    <main className="page detail">
      <p className="breadcrumb">
        <Link to="/">Inicio</Link> / <Link to="/propiedades">Casas</Link> /{' '}
        <Link to={'/propiedades?city=' + encodeURIComponent(address.city)}>{address.city}</Link>
      </p>

      <div className="detail-photo">
        <ViewTransition name={`foto-${property._id}`} share="morph" default="none">
          <img src={propertyImage(property)} alt={property.title} width={1200} height={800} fetchPriority="high" />
        </ViewTransition>
        <span className="detail-photo-badge">{property.status}</span>
      </div>

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
          </header>

          <dl className="detail-facts">
            <div>
              <dt>Tipo</dt>
              <dd>{property.type}</dd>
            </div>
            {property.area ? (
              <div>
                <dt>Superficie</dt>
                <dd>{property.area} m²</dd>
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

          {!isRent && <MortgageCalculator price={property.price} />}

          <section className="detail-section">
            <h2>Dónde está</h2>
            <p>
              {address.street} {address.number}
              <br />
              {address.postalCode} {address.city}, {address.province}
            </p>
            <a
              className="link-button"
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver en el mapa
            </a>
          </section>
        </div>

        <aside className="detail-contact">
          <p className="detail-contact-price">{formatPrice(property)}</p>
          <h2>¿Quieres verla?</h2>
          <p>Escríbenos y un agente te responde por escrito, normalmente en menos de 24 horas.</p>
          <Link to={contactUrl} className="btn btn-acento detail-contact-btn">Preguntar por esta casa</Link>
          <Link to={visitUrl} className="btn btn-outline detail-contact-btn">Pedir una visita</Link>
          <p className="detail-contact-phone">
            O llámanos al <a href="tel:+34644717199">644 7171 99</a>
          </p>
        </aside>

        {/* En el teléfono la caja de contacto queda al final: esta barra fija deja preguntar desde cualquier punto */}
        <div className="detail-bar">
          <p className="detail-bar-price">{formatPrice(property)}</p>
          <a href="tel:+34644717199" className="btn btn-outline detail-bar-call">Llamar</a>
          <Link to={contactUrl} className="btn btn-acento">Preguntar</Link>
        </div>
      </div>
    </main>
  );
}

export default PropertyDetail;
