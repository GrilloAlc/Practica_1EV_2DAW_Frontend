import { ViewTransition } from 'react';
import { Link } from 'react-router-dom';
import './PropertyCard.css';
import type { Property } from '../types';
import { formatPrice, operationLabel, propertyImage } from '../utils/labels';

// Anuncio en horizontal, como en los portales: foto a la izquierda y datos a la derecha
function PropertyCard({ property }: { property: Property }) {
  const detailUrl = `/propiedades/${property._id}`;
  const contactUrl = '/mis-tickets/nuevo?asunto=' + encodeURIComponent('Consulta sobre: ' + property.title);
  // La ficha recibe la vivienda para pintarla al instante y que la foto "vuele" hasta ella
  const linkState = { property };

  return (
    <article className="property-card">
      <div className="property-card-photo">
        <Link to={detailUrl} state={linkState} tabIndex={-1} aria-hidden="true">
          <ViewTransition name={`foto-${property._id}`} share="morph" default="none">
            <img src={propertyImage(property)} alt="" width={1200} height={800} loading="lazy" />
          </ViewTransition>
        </Link>
        <span className="property-card-badge">{operationLabel(property.status)}</span>
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
          {property.area ? <li>{property.area} m²</li> : null}
          <li>{property.address.province}</li>
        </ul>
        <p className="property-card-text">{property.description}</p>

        <div className="property-card-actions">
          <Link to={contactUrl} className="btn btn-outline property-card-contact">Preguntar</Link>
          <Link to={detailUrl} state={linkState} className="link-button">Ver la casa</Link>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
