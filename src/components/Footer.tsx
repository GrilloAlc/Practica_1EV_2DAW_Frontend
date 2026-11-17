import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
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
  );
}

export default Footer;
