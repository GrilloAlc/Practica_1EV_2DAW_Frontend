import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import PropertyCard from '../components/PropertyCard';
import { getProperties } from '../api/properties';
import { PROPERTY_TYPES } from '../utils/labels';
import type { Property } from '../types';

function Home() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('En venta');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [featured, setFeatured] = useState<Property[]>([]);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const result = await getProperties({ limit: 3 });
        setFeatured(result.data);
      } catch {
        setFeatured([]);
      }
    }
    loadFeatured();
  }, []);

  function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('status', status);
    if (type) params.set('type', type);
    if (city) params.set('city', city);
    if (maxPrice) params.set('maxPrice', maxPrice);
    navigate('/propiedades?' + params.toString());
  }

  return (
    <main>
      <section className="home-hero">
        <p className="label">Encuentra tu espacio</p>
        <h1>El lugar que buscas empieza aquí.</h1>
        <p>Explora viviendas seleccionadas para comprar o alquilar.</p>

        <form className="home-search" onSubmit={handleSubmit}>
          <label>
            Operación
            <select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="En venta">Comprar</option>
              <option value="Disponible para alquilar">Alquilar</option>
            </select>
          </label>
          <label>
            Tipo
            <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Cualquier tipo</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Ciudad
            <input name="city" placeholder="Todas las ciudades" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label>
            Precio máximo (€)
            <input name="maxPrice" type="number" min="0" placeholder="Sin límite" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
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
          {featured.map((p) => (
            <PropertyCard key={p._id} property={p} />
          ))}
        </div>
      </section>

      <section className="home-help">
        <p className="label">¿Necesitas ayuda?</p>
        <h2>Te acompañamos durante todo el proceso.</h2>
        <Link to="/sobre-nosotros" className="btn btn-outline">Contactar</Link>
      </section>
    </main>
  );
}

export default Home;
