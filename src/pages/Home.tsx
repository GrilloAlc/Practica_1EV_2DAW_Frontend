import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import { properties } from '../data/properties';

function Home() {
  const navigate = useNavigate();

  // Lo que el usuario elige en el buscador
  const [operacion, setOperacion] = useState('Venta');
  const [tipo, setTipo] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  // Al buscar, vamos al listado y le pasamos los filtros en la dirección
  // Ejemplo: /propiedades?operacion=Venta&tipo=Piso&ciudad=Madrid&precioMax=400000
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    navigate(
      '/propiedades?operacion=' + operacion +
      '&tipo=' + tipo +
      '&ciudad=' + ciudad +
      '&precioMax=' + precioMax
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="home-hero">
          <p className="label">Encuentra tu espacio</p>
          <h1>El lugar que buscas empieza aquí.</h1>
          <p>Explora viviendas seleccionadas para comprar o alquilar.</p>

          <form className="home-search" onSubmit={handleSubmit}>
            <label>
              Operación
              <select name="operacion" value={operacion} onChange={(e) => setOperacion(e.target.value)}>
                <option value="Venta">Comprar</option>
                <option value="Alquiler">Alquilar</option>
              </select>
            </label>
            <label>
              Tipo
              <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Cualquier tipo</option>
                <option value="Piso">Piso</option>
                <option value="Casa">Casa</option>
              </select>
            </label>
            <label>
              Ciudad
              <select name="ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                <option value="">Todas las ciudades</option>
                <option value="Madrid">Madrid</option>
                <option value="Barcelona">Barcelona</option>
                <option value="Valencia">Valencia</option>
              </select>
            </label>
            <label>
              Precio máximo
              <select name="precioMax" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)}>
                <option value="">Sin límite</option>
                <option value="1500">1.500 € (alquiler)</option>
                <option value="250000">250.000 €</option>
                <option value="400000">400.000 €</option>
                <option value="600000">600.000 €</option>
              </select>
            </label>
            <button type="submit" className="btn">Buscar</button>
          </form>
        </section>

        <section className="home-featured">
          <div className="home-featured-header">
            <div>
              <p className="label">Selección</p>
              <h2>Propiedades destacadas</h2>
            </div>
            <Link to="/propiedades" className="btn btn-outline">Ver todas</Link>
          </div>

          <div className="home-grid">
            {properties.slice(0, 3).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>

        <section className="home-help">
          <p className="label">¿Necesitas ayuda?</p>
          <h2>Te acompañamos durante todo el proceso.</h2>
          <Link to="/sobre-nosotros" className="btn btn-outline">Contactar</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Home;
