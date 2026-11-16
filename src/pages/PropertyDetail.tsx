import { Link, useParams } from 'react-router-dom';
import './PropertyDetail.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { properties } from '../data/properties';

const features = ['Ascensor', 'Armarios empotrados', 'Calefacción', 'Balcón', 'Exterior', 'Buen estado'];

function PropertyDetail() {
  const { id } = useParams();
  const property = properties.find((p) => p.id === id);

  if (!property) {
    return (
      <>
        <Navbar />
        <main className="page">
          <div className="empty table-box">
            <strong>No hemos encontrado esta propiedad</strong>
            Puede que ya no esté disponible. <Link to="/propiedades">Volver al listado</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <p className="breadcrumb">
          <Link to="/">Inicio</Link> / <Link to="/propiedades">Propiedades</Link> / {property.title}
        </p>

        <div className="detail-gallery">
          <img className="detail-photo detail-photo-main" src={property.images[0]} alt={property.title} />
          <img className="detail-photo" src={property.images[1]} alt={property.title} />
          <img className="detail-photo" src={property.images[2]} alt={property.title} />
        </div>

        <div className="detail-layout">
          <div>
            <p className="label">{property.operation} · {property.city}</p>
            <h1 className="page-title">{property.title}</h1>
            <p className="detail-price">
              {property.price.toLocaleString('es-ES')} €{property.operation === 'Alquiler' && '/mes'}
            </p>

            <div className="detail-stats">
              <div><strong>{property.area}</strong><span>m² construidos</span></div>
              <div><strong>{property.rooms}</strong><span>Habitaciones</span></div>
              <div><strong>{property.bathrooms}</strong><span>Baños</span></div>
              <div><strong>{property.floor}</strong><span>Planta</span></div>
            </div>

            <h2>Descripción</h2>
            <p>
              Vivienda amplia y luminosa situada en una zona céntrica y bien comunicada. Cuenta con salón comedor,
              cocina independiente y dormitorios exteriores.
            </p>
            <p>El edificio dispone de ascensor y la vivienda se encuentra en buen estado de conservación.</p>

            <h2>Características</h2>
            <ul className="detail-features">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <aside className="detail-contact">
            <p className="label">Ref. {property.id.padStart(6, '0')}</p>
            <h2>¿Te interesa esta propiedad?</h2>
            <p>Abre una consulta y nuestro equipo responderá a todas tus dudas.</p>
            <Link to="/mis-tickets/nuevo" className="btn">Abrir ticket / consultar</Link>
            <p className="detail-note">Normalmente respondemos en menos de 24 horas.</p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default PropertyDetail;
