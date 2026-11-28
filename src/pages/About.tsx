import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';
import { useAuth } from '../context/useAuth';
import Photo from '../components/Photo';
import { typeImage } from '../utils/photos';
import { EMAIL, PHONE, PHONE_HREF } from '../utils/contact';

// Las tres promesas del inicio, contadas como un manifiesto: qué significa cada una en la web
const promises = [
  {
    title: 'Precio a la vista.',
    text: 'Cada casa enseña su precio final y, si está en venta, lo que sale el metro cuadrado. Aquí no hay «consultar precio».',
  },
  {
    title: 'Metros reales.',
    text: 'La superficie que ves es la de la casa, y la dirección es la de su portal: por eso la ponemos en el mapa.',
  },
  {
    title: 'Y cuando preguntas, te responde una persona, por escrito.',
    text: 'Cada consulta tiene un agente y queda guardada con su historial. Nada se pierde en una llamada.',
  },
];

const faqs = [
  { q: '¿Cómo pregunto por una casa?', a: 'Entra en su ficha y pulsa «Preguntar por esta casa». Necesitas haber iniciado sesión.' },
  { q: '¿Cuánto tardáis en responder?', a: 'Normalmente menos de 24 horas laborables. Puedes ver el estado en «Mis consultas».' },
  { q: '¿Puedo ver todas las fotos de una casa?', a: 'Sí. En la ficha, pulsa cualquier foto o «Ver las fotos» y se abren a pantalla completa.' },
  { q: '¿Puedo reabrir una consulta resuelta?', a: 'Sí. Dentro de la consulta puedes pedir que se reabra o confirmar que está cerrada.' },
  { q: '¿Cómo cambio mis datos?', a: 'Desde tu perfil puedes cambiar tu nombre y tu teléfono.' },
  { q: 'Quiero vender o alquilar mi casa, ¿qué hago?', a: 'Abre una consulta contándonos cómo es y te respondemos por escrito.' },
];

function About() {
  const { user } = useAuth();
  const canAsk = !user || user.role === 'CLIENTE';

  // La foto se marca como visible cuando entra en pantalla (una sola vez) y el CSS la hace aparecer
  const photoRef = useRef<HTMLDivElement>(null);
  const [photoVisible, setPhotoVisible] = useState(false);
  useEffect(() => {
    const el = photoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhotoVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="about">
      <title>Nosotros y preguntas frecuentes · CataHome</title>

      <section className="about-hero about-inner">
        <h1>Una inmobiliaria que responde por escrito</h1>
        <p>
          Ayudamos a comprar, vender y alquilar casas sin prisas. Cada consulta tiene su agente y queda por escrito, así
          nunca tienes que preguntar dos veces lo mismo.
        </p>
      </section>

      <section className="about-inner about-manifesto" aria-labelledby="about-manifesto-title">
        <h2 id="about-manifesto-title" className="about-visually-hidden">Lo que prometemos</h2>
        {promises.map((p) => (
          <div key={p.title} className="about-promise">
            <p className="about-promise-title">{p.title}</p>
            <p className="about-promise-text">{p.text}</p>
          </div>
        ))}
        <p className="about-process">
          Cómo funciona: buscas la casa, preguntas o pides visita desde su ficha y sigues la respuesta en «Mis consultas».
        </p>
      </section>

      {/* La foto va después de las promesas para que no se vea al entrar, y aparece al llegar a ella */}
      <div ref={photoRef} className={photoVisible ? 'about-photo is-visible' : 'about-photo'}>
        <Photo
          src="https://images.unsplash.com/photo-1493809842364-78817add7ffb"
          fallback={typeImage('Piso')}
          pixels={1600}
          alt="Salón con ventanales y luz de mañana"
          width={1600}
          height={900}
          sizes="100vw"
        />
      </div>

      <div className="about-inner about-columns">
        <section aria-labelledby="about-faq-title">
          <h2 id="about-faq-title">Preguntas frecuentes</h2>
          {faqs.map((f) => (
            <details key={f.q} className="about-faq">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <aside className="about-contact" aria-labelledby="about-contact-title">
          <h2 id="about-contact-title">Hablemos</h2>
          <p>Te atiende una persona del equipo, por teléfono o por escrito.</p>
          <a className="about-contact-phone" href={PHONE_HREF}>{PHONE}</a>
          <a className="about-contact-mail" href={'mailto:' + EMAIL}>{EMAIL}</a>
          {canAsk && <Link to="/mis-tickets/nuevo" className="btn btn-acento about-contact-btn">Escribir una consulta</Link>}
        </aside>
      </div>
    </main>
  );
}

export default About;
