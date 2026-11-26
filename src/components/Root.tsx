import { Outlet, ScrollRestoration } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';

// Raíz de todas las rutas: la sesión y la posición del scroll
// (al ir a otra página se sube arriba; al volver atrás se recupera donde estabas)
function Root() {
  return (
    <AuthProvider>
      <ScrollRestoration />
      <Outlet />
    </AuthProvider>
  );
}

export default Root;
