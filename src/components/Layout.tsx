import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './Layout.css';
import '../pages/admin/Admin.css';
import { useAuth } from '../context/useAuth';

// Logotipo: el nombre escrito en serif. Se usa en el menú, el pie, el login y el panel
export function Logo({ light = false }: { light?: boolean }) {
  return <span className={light ? 'logo logo-light' : 'logo'}>CataHome</span>;
}

// Menú superior y pie de las páginas públicas. Cada página se pinta en <Outlet />
export function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  function handleLogout() {
    logout();
    navigate('/');
  }

  // Comprar y Alquilar son el mismo listado con distinto filtro: se marca el que está activo
  const inListing = pathname === '/propiedades';
  const status = searchParams.get('status');
  const isCustomer = !user || user.role === 'CLIENTE' || user.role === 'PROPIETARIO';

  return (
    <>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo" aria-label="CataHome, ir al inicio">
            <Logo />
          </Link>
          <nav className="navbar-links" aria-label="Principal">
            <Link
              to="/propiedades?status=En+venta"
              className={inListing && status === 'En venta' ? 'active' : ''}
              aria-current={inListing && status === 'En venta' ? 'page' : undefined}
            >
              Comprar
            </Link>
            <Link
              to="/propiedades?status=Disponible+para+alquilar"
              className={inListing && status === 'Disponible para alquilar' ? 'active' : ''}
              aria-current={inListing && status === 'Disponible para alquilar' ? 'page' : undefined}
            >
              Alquilar
            </Link>
            <Link
              to="/propiedades"
              className={inListing && !status ? 'active' : ''}
              aria-current={inListing && !status ? 'page' : undefined}
            >
              Todas
            </Link>
            <NavLink to="/sobre-nosotros">Nosotros</NavLink>
          </nav>

          <div className="navbar-user">
            {isCustomer && <NavLink to="/mis-tickets" className="navbar-secondary">Mis consultas</NavLink>}
            {user?.role === 'AGENTE' && <NavLink to="/agente/tickets" className="navbar-secondary">Tickets asignados</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin" className="navbar-secondary">Administración</NavLink>}
            {user ? (
              <>
                <Link to="/perfil" className="navbar-profile" title="Mi perfil">
                  <span className="navbar-avatar" aria-hidden="true">{user.name[0]}</span>
                  <span className="navbar-name">{user.name}</span>
                </Link>
                <button className="link-button navbar-logout" onClick={handleLogout}>Salir</button>
              </>
            ) : (
              <Link to="/acceso" className="btn navbar-access">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <div id="contenido" tabIndex={-1} className="skip-target">
        <Outlet />
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo light />
            <p>Casas para catar despacio.</p>
          </div>
          <div>
            <h2 className="footer-title">Buscar</h2>
            <ul className="footer-list">
              <li><Link to="/propiedades?status=En+venta">Comprar</Link></li>
              <li><Link to="/propiedades?status=Disponible+para+alquilar">Alquilar</Link></li>
              <li><Link to="/propiedades">Todas las casas</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="footer-title">Ayuda</h2>
            <ul className="footer-list">
              <li><Link to="/sobre-nosotros">Nosotros y preguntas</Link></li>
              <li><Link to="/mis-tickets">Mis consultas</Link></li>
              <li><Link to="/mis-tickets/nuevo">Vender mi casa</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="footer-title">Contacto</h2>
            <ul className="footer-list">
              <li><a href="tel:+34644717199">644 7171 99</a></li>
              <li><a href="mailto:info@inmobiliaria.es">info@inmobiliaria.es</a></li>
            </ul>
          </div>
        </div>
        <p className="footer-bottom">© {new Date().getFullYear()} CataHome</p>
      </footer>
    </>
  );
}

// Menú lateral de las páginas de administración
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="admin-layout">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar-logo" aria-label="CataHome, ir al inicio">
          <Logo light />
        </Link>
        <p className="admin-sidebar-sub">Panel de administración</p>
        <nav className="admin-sidebar-links" aria-label="Administración">
          <NavLink to="/admin" end>Resumen</NavLink>
          <NavLink to="/admin/tickets">Tickets</NavLink>
          <NavLink to="/admin/usuarios">Usuarios</NavLink>
          <NavLink to="/admin/propiedades">Propiedades</NavLink>
        </nav>
        <div className="admin-sidebar-foot">
          <Link to="/" className="admin-sidebar-back">Ver la web</Link>
          {user && <p className="admin-sidebar-user">{user.name}</p>}
          <button className="admin-sidebar-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <div className="admin-main" id="contenido" tabIndex={-1}>
        <Outlet />
      </div>
    </div>
  );
}
