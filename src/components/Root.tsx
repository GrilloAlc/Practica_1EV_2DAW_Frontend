import { Outlet, ScrollRestoration } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';

// <ScrollRestoration> guarda la primera página que se abre con la clave "default".
// Si se vuelve a abrir la web desde cero en la misma pestaña, recuperaría el scroll de la visita
// anterior y el inicio aparecería ya bajado. Al entrar de nuevo (no al recargar ni al volver) se borra.
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
if (navigation?.type === 'navigate') {
  const saved = JSON.parse(sessionStorage.getItem('react-router-scroll-positions') || '{}');
  delete saved.default;
  sessionStorage.setItem('react-router-scroll-positions', JSON.stringify(saved));
}

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
