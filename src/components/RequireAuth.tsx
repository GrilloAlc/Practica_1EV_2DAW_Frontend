import { Suspense } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { homeForRole } from '../utils/redirect';

// Solo muestra las rutas de dentro si hay sesión y el rol está permitido
function RequireAuth({ roles }: { roles?: string[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Guarda la página que pedía para volver a ella tras el login
    return <Navigate to="/acceso" state={{ from: location.pathname + location.search }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <main className="page">
        <title>Sin acceso · CataHome</title>
        <div className="empty table-box">
          <strong>No tienes acceso a esta página</strong>
          Es una zona de otro tipo de cuenta. <Link to={homeForRole(user.role)}>Ir a tu zona</Link> o <Link to="/">volver al inicio</Link>.
        </div>
      </main>
    );
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <Outlet />
    </Suspense>
  );
}

// Mientras se descarga una página con sesión: un esqueleto discreto, sin saltos
export function PageLoading() {
  return (
    <main className="page" aria-busy="true">
      <p className="loading">Cargando…</p>
    </main>
  );
}

export default RequireAuth;
