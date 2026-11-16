import { Link } from 'react-router-dom';
import './PropertyCard.css';
import type { Property } from '../data/properties';

function PropertyCard({ property}: { property: Property }) {
  return (
    <article className="property-card">
      <img className="property-card-photo" src={property.images[0]} alt={property.title} loading="lazy" />
      <div className="property-card-body">
        <p className="property-card-label">{property.operation} · {property.city}</p>
        <h3 className="property-card-title">
          <Link to={`/propiedades/${property.id}`}>{property.title}</Link>
        </h3>
        <p className="property-card-price">
          {property.price.toLocaleString('es-ES')} €{property.operation === 'Alquiler' && '/mes'}
        </p>
        <p className="property-card-specs">{property.area} m² · {property.rooms} hab. · {property.bathrooms} {property.bathrooms === 1 ? 'baño' : 'baños'}</p>
      </div>
    </article>
  );
}

export default PropertyCard;
