import { useEffect, useId, useState, ViewTransition } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import '../components/Skeleton.css';
import { getProperties } from '../api/properties';
import { useAuth } from '../context/useAuth';
import { PROPERTY_TYPES, formatNumber, formatPrice, isRentStatus } from '../utils/labels';
import { coverPhoto, typeImage } from '../utils/photos';
import { CITIES, canonicalCity } from '../utils/cities';
import { PHONE, PHONE_HREF } from '../utils/contact';
import { useSlowLoading } from '../utils/useSlowLoading';
import HeroCarousel from '../components/HeroCarousel';
import Photo from '../components/Photo';
import type { Property } from '../types';

// Topes de precio del buscador: en venta, el precio total; en alquiler, lo que se paga al mes
const SALE_CAPS = [200000, 300000, 500000, 750000, 1000000, 2000000, 5000000];
const RENT_CAPS = [800, 1200, 1500, 2000, 3000, 5000];

const OPERATIONS = [
  { value: 'En venta', label: 'Comprar' },
  { value: 'Disponible para alquilar', label: 'Alquilar' },
];

// Casas ya cargadas: al volver al inicio se pintan al momento
let homeCache: { cover: Property[]; latest: Property[] } | null = null;

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const citiesId = useId();
  const [status, setStatus] = useState('En venta');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [cover, setCover] = useState<Property[]>(homeCache?.cover || []);
  const [latest, setLatest] = useState<Property[]>(homeCache?.latest || []);
  const [loading, setLoading] = useState(!homeCache);
  const [loadFailed, setLoadFailed] = useState(false);
  const slow = useSlowLoading(loading, 'home');
  const isRent = status === 'Disponible para alquilar';
  // Escribir una consulta es cosa de clientes (los visitantes entran primero)
  const canAsk = !user || user.role === 'CLIENTE';

  useEffect(() => {
    async function load() {
      try {
        // En portada, las 5 casas en venta más caras. En "Recién llegadas", las 4 más nuevas que no estén en portada
        const [expensive, newest] = await Promise.all([
          getProperties({ status: 'En venta', orderBy: 'price', orden: 'desc', limit: 5 }),
          getProperties({ orderBy: 'createdAt', orden: 'desc', limit: 9 }),
        ]);
        const coverIds = new Set(expensive.map((p) => p._id));
        homeCache = { cover: expensive, latest: newest.filter((p) => !coverIds.has(p._id)).slice(0, 4) };
        setCover(homeCache.cover);
        setLatest(homeCache.latest);
        setLoadFailed(false);
      } catch {
        // Si el servidor falla no se dice que no hay casas: se avisa del error
        if (!homeCache) setLoadFailed(true);
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
    const cityName = canonicalCity(city);
    if (cityName) params.set('city', cityName);
    if (priceMax) params.set('priceMax', priceMax);
    navigate('/propiedades?' + params.toString());
  }

  return (
    <main className="home">
      <title>CataHome · Casas en venta y alquiler, elegidas con calma</title>
      <section className="home-hero">
        <div className="home-hero-main">
          <h1 className="home-hero-title">
            <span>Elegir casa,</span>
            <span>sin prisa.</span>
          </h1>
          <p className="home-hero-lead">
            Se mira, se pregunta y se vuelve a mirar. Como un buen vino, una casa se elige con calma.
          </p>
        </div>

        <div className="home-hero-side">
          <form className="home-search" onSubmit={handleSubmit} role="search" aria-label="Buscar casas">
            <div className="home-search-ops" role="radiogroup" aria-label="Operación">
              {OPERATIONS.map((op) => (
                <button
                  key={op.value}
                  type="button"
                  role="radio"
                  aria-checked={status === op.value}
                  className={status === op.value ? 'is-active' : ''}
                  onClick={() => {
                    setStatus(op.value);
                    setPriceMax('');
                  }}
                >
                  {op.label}
                </button>
              ))}
            </div>
            <label className="home-field">
              <span>Ciudad</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Barcelona, Madrid…" list={citiesId} autoComplete="off" />
              <datalist id={citiesId}>
                {CITIES.map((c) => <option key={c} value={c} />)}
              </datalist>
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
                <span>{isRent ? 'Alquiler hasta' : 'Precio hasta'}</span>
                <select value={priceMax} onChange={(e) => setPriceMax(e.target.value)}>
                  <option value="">Sin límite</option>
                  {(isRent ? RENT_CAPS : SALE_CAPS).map((cap) => (
                    <option key={cap} value={cap}>
                      {formatNumber(cap)} €{isRent ? ' al mes' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="btn btn-acento home-search-submit">Buscar casas</button>
          </form>
        </div>
      </section>

      {slow && (
        <p className="notice home-slow" role="status">
          Estamos despertando el servidor. La primera visita del día puede tardar unos segundos.
        </p>
      )}
      {loading ? <div className="home-cover-skeleton skeleton" aria-hidden="true" /> : <HeroCarousel properties={cover} />}

      {/* Comprar y Alquilar ya están en el menú y en el buscador: aquí, hablar con una persona */}
      <section className="home-talk" aria-labelledby="home-talk-title">
        <div>
          <h2 id="home-talk-title">¿Prefieres hablarlo con alguien?</h2>
          <p>Te atiende una persona del equipo, por teléfono o por escrito.</p>
        </div>
        <div className="home-talk-actions">
          <a href={PHONE_HREF} className="btn btn-outline">Llamar al {PHONE}</a>
          {canAsk && <Link to="/mis-tickets/nuevo" className="home-link">Escribir una consulta</Link>}
        </div>
      </section>

      <section className="home-latest" aria-labelledby="home-latest-title">
        <div className="home-section-head">
          <h2 id="home-latest-title">Recién llegadas</h2>
          <Link to="/propiedades" className="home-link">Ver todas las casas</Link>
        </div>

        {!loading && loadFailed && (
          <p className="home-empty" role="alert">
            No hemos podido cargar las casas. Vuelve a intentarlo en un momento o llámanos al{' '}
            <a href={PHONE_HREF}>{PHONE}</a>.
          </p>
        )}
        {!loading && !loadFailed && latest.length === 0 && (
          <p className="home-empty">Ahora mismo no hay más casas publicadas. Vuelve a mirar en unos días.</p>
        )}

        {latest.map((p) => (
          <article key={p._id} className="home-story">
            <Link to={`/propiedades/${p._id}`} state={{ property: p }} className="home-story-photo" tabIndex={-1} aria-hidden="true">
              <ViewTransition name={`foto-${p._id}`} share="morph" default="none">
                <Photo src={coverPhoto(p)} fallback={typeImage(p.type)} alt="" width={1200} height={800} loading="lazy" sizes="(max-width: 900px) 100vw, 60vw" />
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
                    <dd>{formatNumber(p.area)} m²</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Operación</dt>
                  <dd>{isRentStatus(p.status) ? 'Alquiler' : 'Venta'}</dd>
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

      {canAsk && (
        <section className="home-owner">
          <h2>¿Vendes una casa que merece otra mirada?</h2>
          <p>Cuéntanos cómo es y la presentamos como se merece.</p>
          <Link to={'/mis-tickets/nuevo?asunto=' + encodeURIComponent('Quiero vender mi casa')} className="btn btn-acento">Contar mi casa</Link>
        </section>
      )}
    </main>
  );
}

export default Home;
