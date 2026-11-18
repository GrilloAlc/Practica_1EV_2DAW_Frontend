import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './PropertyDetail.css';
import { getProperty } from '../api/properties';
import { getErrorMessage } from '../api/client';
import { formatPrice, propertyImage } from '../utils/labels';
import type { Property } from '../types';

function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
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
            <strong>No hemos encontrado esta propiedad</strong>
            {error} <Link to="/propiedades">Volver al listado</Link>
          </div>
        ) : (
          <p>Cargando...</p>
        )}
      </main>
    );
  }

  const address = property.address;

  return (
    <main className="page">
      <p className="breadcrumb">
        <Link to="/">Inicio</Link> / <Link to="/propiedades">Propiedades</Link> / {property.title}
      </p>

      <div className="detail-gallery detail-gallery-single">
        <img className="detail-photo detail-photo-main" src={propertyImage(property)} alt={property.title} />
      </div>

      <div className="detail-layout">
        <div>
          <p className="label">{property.status} · {address.city}</p>
          <h1 className="page-title">{property.title}</h1>
          <p className="detail-price">{formatPrice(property)}</p>

          <div className="detail-stats">
            <div><strong>{property.area}</strong><span>m² construidos</span></div>
            <div><strong>{property.type}</strong><span>Tipo</span></div>
            <div><strong>{address.city}</strong><span>Ciudad</span></div>
            <div><strong>{address.postalCode}</strong><span>Código postal</span></div>
          </div>

          <h2>Descripción</h2>
          <p>{property.description}</p>

          <h2>Ubicación</h2>
          <p>{address.street} {address.number}, {address.postalCode} {address.city} ({address.province})</p>
        </div>

        <aside className="detail-contact">
          <h2>¿Te interesa esta propiedad?</h2>
          <p>Abre una consulta y nuestro equipo responderá a todas tus dudas.</p>
          <Link to={'/mis-tickets/nuevo?asunto=' + encodeURIComponent('Consulta sobre: ' + property.title)} className="btn">
            Abrir ticket / consultar
          </Link>
          <p className="detail-note">Normalmente respondemos en menos de 24 horas.</p>
        </aside>
      </div>
    </main>
  );
}

export default PropertyDetail;
