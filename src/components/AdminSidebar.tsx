import { Link, NavLink } from 'react-router-dom';
import './AdminSidebar.css';

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <Link to="/" className="admin-sidebar-logo">INMOBILIARIA</Link>
      <p className="admin-sidebar-sub">Administración</p>
      <nav className="admin-sidebar-links">
        <NavLink to="/admin" end>Resumen</NavLink>
        <NavLink to="/admin/tickets">Tickets</NavLink>
        <NavLink to="/admin/usuarios">Usuarios</NavLink>
        <NavLink to="/admin/categorias">Categorías</NavLink>
        <NavLink to="/admin/propiedades">Propiedades</NavLink>
      </nav>
    </aside>
  );
}

export default AdminSidebar;
