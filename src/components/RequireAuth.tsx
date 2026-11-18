import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

// Solo muestra las rutas de dentro si hay sesión y el rol está permitido
function RequireAuth({ roles }: { roles?: string[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Guarda la página que pedía para volver a ella tras el login
    return <Navigate to="/acceso" state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <main className="page">
        <div className="empty table-box">
          <strong>No tienes acceso a esta página</strong>
          <Link to="/">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  return <Outlet />;
}

export default RequireAuth;
