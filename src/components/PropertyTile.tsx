import { ViewTransition } from 'react';
import { Link } from 'react-router-dom';
import './PropertyTile.css';
import Photo from './Photo';
import type { Property } from '../types';
import { formatPrice, operationLabel } from '../utils/labels';
import { coverPhoto, propertyPhotos, typeImage } from '../utils/photos';

// Casa en vertical, pequeña: foto, precio, título y lugar. Para "Otras casas en…" de la ficha
function PropertyTile({ property }: { property: Property }) {
  const url = `/propiedades/${property._id}`;
  const count = propertyPhotos(property).length;

  return (
    <article className="tile">
      <Link to={url} state={{ property }} className="tile-photo" tabIndex={-1} aria-hidden="true">
        <ViewTransition name={`foto-${property._id}`} share="morph" default="none">
          <Photo src={coverPhoto(property)} fallback={typeImage(property.type)} pixels={800} alt="" width={800} height={600} loading="lazy" sizes="(max-width: 700px) 100vw, 33vw" />
        </ViewTransition>
        <span className="tile-badge">{operationLabel(property.status)}</span>
        {count > 1 && <span className="tile-count">{count} fotos</span>}
      </Link>
      <p className="tile-price">{formatPrice(property)}</p>
      <h3 className="tile-title">
        <Link to={url} state={{ property }}>{property.title}</Link>
      </h3>
      <p className="tile-place">
        {property.type}
        {property.area ? ` · ${property.area} m²` : ''} · {property.address.city}
      </p>
    </article>
  );
}

export default PropertyTile;
