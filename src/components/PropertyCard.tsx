import { Link } from 'react-router-dom';
import './PropertyCard.css';
import type { Property } from '../types';
import { formatPrice, propertyImage } from '../utils/labels';

function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="property-card">
      <img className="property-card-photo" src={propertyImage(property)} alt={property.title} loading="lazy" />
      <div className="property-card-body">
        <p className="property-card-label">{property.status} · {property.address.city}</p>
        <h3 className="property-card-title">
          <Link to={`/propiedades/${property._id}`}>{property.title}</Link>
        </h3>
        <p className="property-card-price">{formatPrice(property)}</p>
        <p className="property-card-specs">{property.type} · {property.area} m²</p>
      </div>
    </article>
  );
}

export default PropertyCard;
