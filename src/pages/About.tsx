import { Link } from 'react-router-dom';
import './About.css';
import { useAuth } from '../context/useAuth';
import { EMAIL, PHONE, PHONE_HREF } from '../utils/contact';

const steps = [
  { title: 'Encuentra la casa', text: 'Filtra por operación, ciudad, tipo y precio, y ordena por precio, tamaño o fecha.' },
  { title: 'Pregunta o pide una visita', text: 'Desde la ficha abres una consulta, que se asigna a un agente.' },
  { title: 'Sigue la respuesta', text: 'En «Mis consultas» ves en qué punto está cada una y hablas con tu agente por escrito.' },
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

  return (
    <main className="about">
      <title>Nosotros y preguntas frecuentes · CataHome</title>
      <section className="about-hero">
        <div className="about-inner">
          <h1>Una inmobiliaria que responde por escrito</h1>
          <p>
            Ayudamos a comprar, vender y alquilar casas. Cada consulta tiene su agente y queda por escrito, así nunca
            tienes que preguntar dos veces lo mismo.
          </p>
        </div>
      </section>

      <section className="about-inner about-steps" aria-labelledby="about-steps-title">
        <h2 id="about-steps-title">Cómo funciona</h2>
        <ol className="about-step-list">
          {steps.map((s) => (
            <li key={s.title} className="about-step">
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

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
          <h2 id="about-contact-title">Contacto</h2>
          <dl>
            <dt>Correo</dt>
            <dd><a href={'mailto:' + EMAIL}>{EMAIL}</a></dd>
            <dt>Teléfono</dt>
            <dd><a href={PHONE_HREF}>{PHONE}</a></dd>
          </dl>
          {canAsk && <Link to="/mis-tickets/nuevo" className="btn btn-acento about-contact-btn">Escribir una consulta</Link>}
        </aside>
      </div>
    </main>
  );
}

export default About;
