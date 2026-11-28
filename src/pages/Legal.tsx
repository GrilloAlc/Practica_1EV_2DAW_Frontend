import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY, LEGAL_UPDATED } from '../utils/legal';
import { EMAIL, PHONE } from '../utils/contact';
import './Legal.css';

// Aviso legal, privacidad y cookies: textos que toda web pública en España tiene que enseñar (LSSI y RGPD).
// Los datos del titular salen de utils/legal.ts

type LegalKind = 'aviso-legal' | 'privacidad' | 'cookies';

const TITLES: Record<LegalKind, string> = {
  'aviso-legal': 'Aviso legal',
  privacidad: 'Política de privacidad',
  cookies: 'Política de cookies',
};

function Legal({ kind }: { kind: LegalKind }) {
  return (
    <main className="page legal">
      <title>{`${TITLES[kind]} · CataHome`}</title>
      <p className="breadcrumb"><Link to="/">Inicio</Link> / {TITLES[kind]}</p>
      <h1 className="page-title">{TITLES[kind]}</h1>
      <p className="legal-updated">Última actualización: {LEGAL_UPDATED}</p>

      <div className="legal-body">
        {kind === 'aviso-legal' && <LegalNotice />}
        {kind === 'privacidad' && <Privacy />}
        {kind === 'cookies' && <Cookies />}
      </div>

      <nav className="legal-nav" aria-label="Textos legales">
        {(Object.keys(TITLES) as LegalKind[])
          .filter((k) => k !== kind)
          .map((k) => <Link key={k} to={'/' + k}>{TITLES[k]}</Link>)}
      </nav>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function LegalNotice() {
  return (
    <>
      <Section title="Titular de la web">
        <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI), te informamos de que esta web pertenece a:</p>
        <dl className="legal-data">
          <div><dt>Titular</dt><dd>{COMPANY.name}</dd></div>
          <div><dt>CIF</dt><dd>{COMPANY.taxId}</dd></div>
          <div><dt>Domicilio</dt><dd>{COMPANY.address}</dd></div>
          <div><dt>Inscripción</dt><dd>{COMPANY.registry}</dd></div>
          <div><dt>Agente inmobiliario</dt><dd>{COMPANY.agentRegistry}</dd></div>
          <div><dt>Contacto</dt><dd>{EMAIL} · {PHONE}</dd></div>
        </dl>
      </Section>
      <Section title="Uso de la web">
        <p>Puedes consultar las casas publicadas sin registrarte. Para preguntar por una casa, pedir una visita o seguir tus consultas necesitas una cuenta. Te comprometes a usar la web de buena fe y a no introducir datos falsos ni de otras personas.</p>
      </Section>
      <Section title="Información de las casas">
        <p>Los precios, superficies y descripciones los facilitan los propietarios y se revisan antes de publicarse. Son orientativos y no constituyen una oferta vinculante: las condiciones definitivas se recogen en el contrato correspondiente.</p>
      </Section>
      <Section title="Propiedad intelectual">
        <p>El nombre CataHome, el logotipo y los textos de la web pertenecen a {COMPANY.name}. Las fotografías proceden de Unsplash o de los propietarios de cada casa, y los mapas de OpenStreetMap, con sus respectivas licencias.</p>
      </Section>
      <Section title="Responsabilidad">
        <p>Trabajamos para que la información sea correcta y la web esté disponible, pero no podemos garantizar la ausencia de errores o interrupciones. No respondemos del contenido de las webs externas enlazadas.</p>
      </Section>
      <Section title="Legislación aplicable">
        <p>Estas condiciones se rigen por la legislación española. Para cualquier conflicto, las partes se someten a los juzgados y tribunales del domicilio del usuario cuando este sea consumidor.</p>
      </Section>
    </>
  );
}

function Privacy() {
  return (
    <>
      <Section title="Quién trata tus datos">
        <p>{COMPANY.name}, con CIF {COMPANY.taxId} y domicilio en {COMPANY.address}. Puedes escribirnos a {EMAIL} para cualquier cuestión sobre tus datos.</p>
      </Section>
      <Section title="Qué datos tratamos">
        <ul>
          <li>Los de tu cuenta: nombre, correo electrónico y, si lo das, teléfono.</li>
          <li>Tus consultas y los mensajes que intercambias con nuestro equipo, con su fecha.</li>
          <li>La contraseña, que se guarda cifrada: nadie de nuestro equipo puede leerla.</li>
        </ul>
      </Section>
      <Section title="Para qué los usamos">
        <p>Para gestionar tu cuenta, responder a tus consultas, organizar las visitas que pidas y llevar el historial de cada consulta. No los usamos para enviarte publicidad ni los vendemos a nadie.</p>
      </Section>
      <Section title="Base legal">
        <p>La gestión de tu cuenta y de tus consultas se basa en la relación que tú mismo inicias al registrarte (artículo 6.1.b del RGPD). Algunos datos se conservan por obligación legal (artículo 6.1.c).</p>
      </Section>
      <Section title="Cuánto tiempo los guardamos">
        <p>Mientras tengas la cuenta activa. Cuando la cierres, los bloqueamos y los conservamos solo el tiempo que exige la ley para atender posibles responsabilidades; después se borran.</p>
      </Section>
      <Section title="Quién más los ve">
        <p>Solo el equipo de CataHome que atiende tu consulta. Usamos proveedores de alojamiento para que la web funcione, que tratan los datos por nuestra cuenta y con las garantías del RGPD. No hay cesiones a terceros salvo obligación legal.</p>
      </Section>
      <Section title="Tus derechos">
        <p>Puedes pedir acceder a tus datos, corregirlos, borrarlos, limitar su uso, oponerte a él o llevártelos a otro servicio, escribiendo a {EMAIL}. Tu nombre y tu teléfono los puedes cambiar tú desde tu perfil. Si crees que no hemos atendido bien tu petición, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
      </Section>
    </>
  );
}

function Cookies() {
  return (
    <>
      <Section title="Esta web no usa cookies">
        <p>CataHome no instala cookies de publicidad, de análisis ni de seguimiento, por eso no te mostramos ningún aviso para aceptarlas.</p>
      </Section>
      <Section title="Lo que sí guardamos en tu navegador">
        <p>Cuando inicias sesión, tu navegador guarda un código de acceso y tu nombre para que no tengas que entrar en cada página. Es imprescindible para darte el servicio que pides, no sirve para seguirte y se borra al cerrar la sesión. También se recuerda, solo durante la visita, en qué punto de cada lista estabas.</p>
      </Section>
      <Section title="Contenido de otros servicios">
        <p>Para mostrar la web cargamos las tipografías de Google Fonts, las fotografías de Unsplash y los mapas de OpenStreetMap. Al hacerlo, esos servicios reciben la dirección IP de tu navegador, como en cualquier carga de contenido, según sus propias políticas.</p>
      </Section>
      <Section title="Cómo borrarlo">
        <p>Puedes cerrar la sesión desde tu perfil o borrar los datos de este sitio en la configuración de tu navegador en cualquier momento.</p>
      </Section>
    </>
  );
}

export default Legal;
