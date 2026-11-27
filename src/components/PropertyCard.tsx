import { ViewTransition } from 'react';
import { Link } from 'react-router-dom';
import './PropertyCard.css';
import Photo from './Photo';
import type { Property } from '../types';
import { useAuth } from '../context/useAuth';
import { formatNumber, formatPrice, operationLabel } from '../utils/labels';
import { coverPhoto, propertyPhotos, typeImage } from '../utils/photos';

// Anuncio en horizontal, como en los portales: foto a la izquierda y datos a la derecha
function PropertyCard({ property, priority = false }: { property: Property; priority?: boolean }) {
  const { user } = useAuth();
  const detailUrl = `/propiedades/${property._id}`;
  const contactUrl = `/mis-tickets/nuevo?casa=${property._id}&asunto=` + encodeURIComponent(('Consulta sobre: ' + property.title).slice(0, 200));
  // La ficha recibe la casa para pintarla al instante y que la foto "vuele" hasta ella
  const linkState = { property };
  const photoCount = propertyPhotos(property).length;
  // Preguntar abre una consulta: solo visitantes y clientes
  const canAsk = (!user || user.role === 'CLIENTE') && property.status !== 'Vendida' && property.status !== 'Alquilada';

  return (
    <article className="property-card">
      <div className="property-card-photo">
        <Link to={detailUrl} state={linkState} tabIndex={-1} aria-hidden="true">
          <ViewTransition name={`foto-${property._id}`} share="morph" default="none">
            <Photo
              src={coverPhoto(property)}
              fallback={typeImage(property.type)}
              pixels={800}
              alt=""
              width={1200}
              height={800}
              loading={priority ? 'eager' : 'lazy'}
              sizes="(max-width: 640px) 100vw, (max-width: 900px) 46vw, 480px"
            />
          </ViewTransition>
        </Link>
        <span className="property-card-badge">{operationLabel(property.status)}</span>
        {photoCount > 1 && <span className="property-card-count">{photoCount} fotos</span>}
      </div>

      <div className="property-card-body">
        <p className="property-card-price">{formatPrice(property)}</p>
        <h3 className="property-card-title">
          <Link to={detailUrl} state={linkState}>{property.title}</Link>
        </h3>
        <p className="property-card-place">
          {property.address.street}, {property.address.city}
        </p>
        <ul className="property-card-facts">
          <li>{property.type}</li>
          {property.area ? <li>{formatNumber(property.area)} m²</li> : null}
          <li>{property.address.province}</li>
        </ul>
        <p className="property-card-text">{property.description}</p>

        <div className="property-card-actions">
          {canAsk && <Link to={contactUrl} className="btn btn-outline property-card-contact">Preguntar</Link>}
          <Link to={detailUrl} state={linkState} className="link-button">Ver la casa</Link>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
