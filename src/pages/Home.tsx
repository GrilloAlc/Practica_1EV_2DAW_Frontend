import { useEffect, useState, ViewTransition } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import '../components/Skeleton.css';
import { getProperties } from '../api/properties';
import { PROPERTY_TYPES, formatPrice, propertyImage } from '../utils/labels';
import HeroCarousel from '../components/HeroCarousel';
import type { Property } from '../types';

const OPERATIONS = [
  { value: 'En venta', label: 'Comprar' },
  { value: 'Disponible para alquilar', label: 'Alquilar' },
];

// Casas ya cargadas: al volver al inicio se pintan al momento
let homeCache: Property[] | null = null;

function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('En venta');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [properties, setProperties] = useState<Property[]>(homeCache || []);
  const [loading, setLoading] = useState(!homeCache);

  useEffect(() => {
    async function load() {
      try {
        // Las más recientes primero. Solo se enseñan las activas
        const list = await getProperties({ orderBy: 'createdAt', orden: 'desc' });
        homeCache = list.filter((p) => p.isActive);
        setProperties(homeCache);
      } catch {
        setProperties([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('status', status);
    if (type) params.set('type', type);
    if (city) params.set('city', city);
    if (priceMax) params.set('priceMax', priceMax);
    navigate('/propiedades?' + params.toString());
  }

  // En portada, las 5 casas en venta más caras. En "Recién llegadas", las 4 más nuevas que no estén en portada
  const cover = properties.filter((p) => p.status === 'En venta').sort((a, b) => b.price - a.price).slice(0, 5);
  const latest = properties.filter((p) => !cover.includes(p)).slice(0, 4);

  return (
    <main className="home">
      <section className="home-hero">
        <h1 className="home-hero-title">
          <span>Casas para</span>
          <span>catar despacio.</span>
        </h1>

        <div className="home-hero-side">
          <p className="home-hero-lead">
            Se mira, se pregunta y se vuelve a mirar. Como un buen vino, una casa se elige con calma.
          </p>

          <form className="home-search" onSubmit={handleSubmit}>
            <div className="home-search-ops" role="radiogroup" aria-label="Operación">
              {OPERATIONS.map((op) => (
                <button
                  key={op.value}
                  type="button"
                  role="radio"
                  aria-checked={status === op.value}
                  className={status === op.value ? 'is-active' : ''}
                  onClick={() => setStatus(op.value)}
                >
                  {op.label}
                </button>
              ))}
            </div>
            <label className="home-field">
              <span>Ciudad</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Barcelona, Madrid…" />
            </label>
            <div className="home-search-row">
              <label className="home-field">
                <span>Tipo</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">Cualquiera</option>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="home-field">
                <span>Precio hasta</span>
                <input type="number" min="0" step="10000" inputMode="numeric" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Sin límite" />
              </label>
            </div>
            <button type="submit" className="btn btn-acento home-search-submit">Buscar casas</button>
          </form>
        </div>
      </section>

      {loading ? <div className="home-cover-skeleton skeleton" aria-hidden="true" /> : <HeroCarousel properties={cover} />}

      {/* Tres puertas de entrada: lo que se puede hacer en la web */}
      <nav className="home-doors" aria-label="¿Qué quieres hacer?">
        <Link to="/propiedades?status=En+venta" className="home-door">
          <span className="home-door-title">Comprar</span>
          <span className="home-door-text">Casas, pisos, locales y terrenos en venta.</span>
        </Link>
        <Link to="/propiedades?status=Disponible+para+alquilar" className="home-door">
          <span className="home-door-title">Alquilar</span>
          <span className="home-door-text">Viviendas disponibles para entrar a vivir.</span>
        </Link>
        <Link to="/mis-tickets/nuevo" className="home-door">
          <span className="home-door-title">Vender</span>
          <span className="home-door-text">Cuéntanos cómo es tu casa y la presentamos.</span>
        </Link>
      </nav>

      <section className="home-latest" aria-labelledby="home-latest-title">
        <div className="home-section-head">
          <h2 id="home-latest-title">Recién llegadas</h2>
          <Link to="/propiedades" className="home-link">Ver todas las casas</Link>
        </div>

        {!loading && latest.length === 0 && (
          <p className="home-empty">Ahora mismo no hay más casas publicadas. Vuelve a mirar en unos días.</p>
        )}

        {latest.map((p) => (
          <article key={p._id} className="home-story">
            <Link to={`/propiedades/${p._id}`} state={{ property: p }} className="home-story-photo" tabIndex={-1} aria-hidden="true">
              <ViewTransition name={`foto-${p._id}`} share="morph" default="none">
                <img src={propertyImage(p)} alt="" width={1200} height={800} loading="lazy" />
              </ViewTransition>
            </Link>
            <div className="home-story-text">
              <p className="home-story-place">{p.address.city}</p>
              <h3>
                <Link to={`/propiedades/${p._id}`} state={{ property: p }}>{p.title}</Link>
              </h3>
              <p className="home-story-price">{formatPrice(p)}</p>
              <dl className="home-story-facts">
                <div>
                  <dt>Tipo</dt>
                  <dd>{p.type}</dd>
                </div>
                {p.area ? (
                  <div>
                    <dt>Superficie</dt>
                    <dd>{p.area} m²</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Operación</dt>
                  <dd>{p.status === 'En venta' ? 'Venta' : 'Alquiler'}</dd>
                </div>
              </dl>
              <Link to={`/propiedades/${p._id}`} state={{ property: p }} className="home-link">Ver la casa</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="home-promise">
        <p>Precio a la vista. Metros reales. Y cuando preguntas, te responde una persona, por escrito.</p>
      </section>

      <section className="home-owner">
        <h2>¿Vendes una casa que merece otra mirada?</h2>
        <p>Cuéntanos cómo es y la presentamos como se merece.</p>
        <Link to="/mis-tickets/nuevo" className="btn">Contar mi casa</Link>
      </section>
    </main>
  );
}

export default Home;
