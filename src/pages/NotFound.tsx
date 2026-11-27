import { Link } from 'react-router-dom';
import './NotFound.css';
import { PHONE, PHONE_HREF } from '../utils/contact';
import { typeImage } from '../utils/photos';
import Photo from '../components/Photo';

// Página para las direcciones que no existen (ruta "*" en App.tsx)
function NotFound() {
  return (
    <main className="page not-found">
      <title>Página no encontrada · CataHome</title>
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
          ¿Buscabas una en concreto? Llámanos al <a href={PHONE_HREF}>{PHONE}</a>.
        </p>
      </div>
      <Photo className="not-found-photo" src={typeImage('Casa')} fallback={typeImage('Casa')} pixels={900} alt="" width={900} height={1100} sizes="(max-width: 860px) 100vw, 40vw" />
    </main>
  );
}

export default NotFound;
