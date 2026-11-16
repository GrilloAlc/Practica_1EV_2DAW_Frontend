import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">INMOBILIARIA</Link>
      <nav className="navbar-links">
        <NavLink to="/propiedades">Propiedades</NavLink>
        <NavLink to="/sobre-nosotros">Sobre nosotros</NavLink>
        <NavLink to="/mis-tickets">Mis tickets</NavLink>
      </nav>
      <Link to="/acceso" className="navbar-access">Acceso / Registro</Link>
    </header>
  );
}

export default Navbar;
