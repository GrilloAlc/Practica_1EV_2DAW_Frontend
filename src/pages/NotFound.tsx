import { Link } from 'react-router-dom';
import './NotFound.css';

// Página para las direcciones que no existen (ruta "*" en App.tsx)
function NotFound() {
  return (
    <main className="page not-found">
      <div className="not-found-text">
        <h1 className="page-title">Aquí no hay ninguna casa.</h1>
        <p className="page-subtitle">
          La dirección que buscas no existe o ha cambiado. Las casas siguen donde estaban.
        </p>
        <div className="not-found-actions">
          <Link to="/propiedades" className="btn btn-acento">Ver todas las casas</Link>
          <Link to="/" className="btn btn-outline">Volver al inicio</Link>
        </div>
        <p className="not-found-phone">
          ¿Buscabas una en concreto? Llámanos al <a href="tel:+34644717199">644 7171 99</a>.
        </p>
      </div>
      <img
        className="not-found-photo"
        src="/images/tipos/casa.jpg"
        alt=""
        width={900}
        height={1100}
      />
    </main>
  );
}

export default NotFound;
