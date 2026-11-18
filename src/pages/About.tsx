import './About.css';

const faqs = [
  { q: '¿Cómo abro una consulta sobre una propiedad?', a: 'Entra en la ficha de la propiedad y pulsa «Abrir ticket / consultar». Necesitas haber iniciado sesión.' },
  { q: '¿Cuánto tardan en responder?', a: 'Normalmente en menos de 24 horas laborables. Puedes seguir el estado desde «Mis tickets».' },
  { q: '¿Puedo reabrir un ticket resuelto?', a: 'Sí. Desde el detalle del ticket puedes solicitar la reapertura o confirmar el cierre.' },
  { q: '¿Cómo cambio mis datos personales?', a: 'Desde tu perfil puedes editar tu nombre, correo y teléfono.' },
];

function About() {
  return (
    <main className="page about">
      <p className="label">Sobre nosotros</p>
      <h1 className="page-title">Una inmobiliaria cercana y transparente.</h1>
      <p>
        Somos un equipo que acompaña a las personas en la compra y el alquiler de su vivienda. Reunimos un catálogo
        de propiedades seleccionadas y un sistema de atención por tickets para que cada consulta tenga seguimiento y respuesta.
      </p>

      <h2>Preguntas frecuentes</h2>
      {faqs.map((f) => (
        <details key={f.q} className="about-faq">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}

      <h2>Contacto</h2>
      <p>
        <a href="mailto:info@inmobiliaria.es">info@inmobiliaria.es</a> · 900 000 000
      </p>
    </main>
  );
}

export default About;
