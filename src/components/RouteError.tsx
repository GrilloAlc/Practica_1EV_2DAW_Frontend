import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import '../pages/NotFound.css';
import { Logo } from './Layout';
import { PHONE, PHONE_HREF } from '../utils/contact';

// Pantalla para cuando algo falla al pintar una página (en vez del mensaje técnico de React Router).
// Lo más habitual es tener abierta una versión antigua de la web tras publicar otra: recargar lo arregla
function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  // El detalle queda en la consola para quien tenga que arreglarlo
  console.error(error);

  return (
    <div className="route-error">
      <title>{notFound ? 'Página no encontrada · CataHome' : 'Algo no ha ido bien · CataHome'}</title>
      <a href="/" className="route-error-logo" aria-label="CataHome, ir al inicio"><Logo /></a>
      <main className="page not-found">
        <div className="not-found-text">
          <h1 className="page-title">{notFound ? 'Aquí no hay ninguna casa.' : 'Algo no ha ido bien.'}</h1>
          <p className="page-subtitle">
            {notFound
              ? 'La dirección que buscas no existe o ha cambiado.'
              : 'No hemos podido mostrar esta página. Recárgala; si sigue igual, vuelve al inicio.'}
          </p>
          <div className="not-found-actions">
            <button type="button" className="btn btn-acento" onClick={() => window.location.reload()}>Recargar la página</button>
            <a href="/" className="btn btn-outline">Volver al inicio</a>
          </div>
          <p className="not-found-phone">
            Si necesitas algo urgente, llámanos al <a href={PHONE_HREF}>{PHONE}</a>.
          </p>
        </div>
      </main>
    </div>
  );
}

export default RouteError;
