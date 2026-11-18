import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Layout.css';
import '../pages/admin/Admin.css';
import { useAuth } from '../context/useAuth';


// Menú superior y pie de las páginas públicas. Cada página se pinta en <Outlet />
export function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <>
      <header className="navbar">
        <Link to="/" className="navbar-logo">INMOBILIARIA</Link>
        <nav className="navbar-links">
          <NavLink to="/propiedades">Propiedades</NavLink>
          <NavLink to="/sobre-nosotros">Sobre nosotros</NavLink>
          {(!user || user.role === 'CLIENTE' || user.role === 'PROPIETARIO') && <NavLink to="/mis-tickets">Mis tickets</NavLink>}
          {user?.role === 'AGENTE' && <NavLink to="/agente/tickets">Tickets asignados</NavLink>}
          {user?.role === 'ADMIN' && <NavLink to="/admin">Administración</NavLink>}
        </nav>
        {user ? (
          <div className="navbar-user">
            <Link to="/perfil" className="navbar-access">{user.name}</Link>
            <button className="link-button" onClick={handleLogout}>Salir</button>
          </div>
        ) : (
          <Link to="/acceso" className="navbar-access">Acceso / Registro</Link>
        )}
      </header>

      <Outlet />

      <footer className="footer">
        <div>
          <strong>INMOBILIARIA</strong>
          <p>Tu próximo hogar, más cerca.</p>
        </div>
        <div>
          <strong>Enlaces</strong>
          <p>
            <Link to="/propiedades">Propiedades</Link> · <Link to="/sobre-nosotros">Contacto y Sobre Nosotros</Link>
          </p>
        </div>
        <div>
          <strong>Contacto</strong>
          <p>
            <a href="mailto:info@inmobiliaria.es">info@inmobiliaria.es</a> · 900 000 000
          </p>
        </div>
      </footer>
    </>
  );
}

// Menú lateral de las páginas de administración
export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar-logo">INMOBILIARIA</Link>
        <p className="admin-sidebar-sub">Administración</p>
        <nav className="admin-sidebar-links">
          <NavLink to="/admin" end>Resumen</NavLink>
          <NavLink to="/admin/tickets">Tickets</NavLink>
          <NavLink to="/admin/usuarios">Usuarios</NavLink>
          <NavLink to="/admin/categorias">Categorías</NavLink>
          <NavLink to="/admin/propiedades">Propiedades</NavLink>
          <button className="link-button" onClick={handleLogout}>Cerrar sesión</button>
        </nav>
      </aside>

      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
