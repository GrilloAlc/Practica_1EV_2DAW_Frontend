import './PropertyCard.css';

interface PropertyCardProps {
  operation: string;
  city: string;
  title: string;
  price: number;
  area: number;
  rooms: number;
  bathrooms: number;
}

function PropertyCard({ operation, city, title, price, area, rooms, bathrooms }: PropertyCardProps) {
  return (
    <article className="property-card">
      <div className="property-card-photo">FOTO</div>
      <div className="property-card-body">
        <p className="property-card-label">{operation} · {city}</p>
        <h3 className="property-card-title">{title}</h3>
        <p className="property-card-price">{price.toLocaleString('es-ES')} €</p>
        <p className="property-card-specs">{area} m² · {rooms} hab. · {bathrooms} baños</p>
      </div>
    </article>
  );
}

export default PropertyCard;