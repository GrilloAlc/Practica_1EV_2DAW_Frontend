// Sube al backend las casas de scripts/casas.json (500 casas con dirección real, coordenadas y varias fotos).
// El archivo se crea con `npm run generar-casas` (ver scripts/generar-casas.mjs).
//
// Uso (desde la carpeta del frontend):
//   npm run subir-casas              → pide el correo y la contraseña de un ADMIN y las sube
//   npm run subir-casas -- --prueba  → solo comprueba el archivo y lo que se subiría, sin entrar ni subir nada
//   npm run subir-casas -- --api http://localhost:3000/api   → contra otro backend
//
// También se pueden pasar las credenciales con las variables ADMIN_EMAIL y ADMIN_PASSWORD.
// No sube dos veces la misma casa: si ya hay una activa en la misma calle, número y ciudad, la salta.
// Así, si se corta a medias, se puede volver a lanzar y sigue por donde iba.
//
// Fotos: el backend solo guarda un texto por casa (image). Ese texto lleva las direcciones de todas las fotos
// separadas por espacios (la primera es la portada) y el frontend las separa para la galería de la ficha.

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const DEFAULT_API = 'https://practica-1ev-2daw-backend.onrender.com/api';
// Peticiones a la vez: suficiente para que vaya rápido sin saturar el plan gratuito de Render
const PARALLEL = 4;

const args = process.argv.slice(2);
const dryRun = args.includes('--prueba');
const apiIndex = args.indexOf('--api');
const API = (apiIndex >= 0 ? args[apiIndex + 1] : DEFAULT_API).replace(/\/$/, '');

// Valores que acepta el backend (model/enums.js y model/property_model.js)
const TYPES = ['Casa', 'Piso', 'Terreno', 'Local'];
const STATUSES = ['En venta', 'Disponible para alquilar', 'Reservada', 'Vendida', 'Alquilada'];

// ---------- Comprobación del archivo ----------

function check(casa, i) {
  const errors = [];
  const a = casa.address || {};
  if (!casa.title || casa.title.length > 120) errors.push('título vacío o de más de 120 caracteres');
  if (!casa.description || casa.description.length > 2000) errors.push('descripción vacía o de más de 2000 caracteres');
  if (!TYPES.includes(casa.type)) errors.push(`tipo "${casa.type}" no válido`);
  if (casa.status && !STATUSES.includes(casa.status)) errors.push(`estado "${casa.status}" no válido`);
  if (typeof casa.price !== 'number' || casa.price < 0) errors.push('precio no válido');
  if (casa.area !== undefined && (typeof casa.area !== 'number' || casa.area < 0)) errors.push('superficie no válida');
  if (!a.street || !a.city || !a.province) errors.push('falta calle, ciudad o provincia');
  if (!/^\d{5}$/.test(a.postalCode || '')) errors.push('el código postal debe tener 5 cifras');
  const c = a.coordinates;
  if (c && (c.lat < 27 || c.lat > 44 || c.lng < -18 || c.lng > 5)) errors.push('coordenadas fuera de España');
  const fotos = (casa.image || '').split(/\s+/).filter(Boolean);
  if (fotos.some((f) => !f.startsWith('/') && !/^https:\/\//.test(f))) errors.push('alguna foto no es una dirección válida');
  return errors.map((e) => `  Casa ${i + 1} (${casa.title || 'sin título'}): ${e}`);
}

const key = (a) => `${a.street}|${a.number || ''}|${a.city}`.toLowerCase();

// ---------- Peticiones ----------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(90_000), // Render tarda en despertar si estaba parado
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = typeof data === 'string' ? data.slice(0, 200) : data?.message || JSON.stringify(data);
    const error = new Error(`${res.status} ${message}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

// Reintenta si falla la red o el servidor (5xx), no si los datos están mal (4xx)
async function withRetries(fn, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = !err.status || err.status >= 500;
      if (!retryable || attempt >= tries) throw err;
      await wait(2000 * attempt);
    }
  }
}

// Todas las propiedades activas (el backend da 50 por página como máximo)
async function existingProperties() {
  const all = [];
  for (let page = 1; ; page++) {
    const res = await withRetries(() => request('GET', `/properties?limit=50&page=${page}`));
    all.push(...res.data);
    if (page >= (res.pagesData?.totalPages || 1)) return all;
  }
}

// ---------- Preguntas por consola ----------

function ask(question, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    // No muestra lo que se escribe (para la contraseña)
    rl._writeToOutput = (text) => {
      if (text.includes(question)) rl.output.write(text);
    };
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

// ---------- Programa ----------

function summary(casas) {
  const count = (field) => casas.reduce((m, c) => ((m[c[field]] = (m[c[field]] || 0) + 1), m), {});
  const fotos = casas.map((c) => (c.image || '').split(/\s+/).filter(Boolean).length);
  console.log(`  Por tipo: ${Object.entries(count('type')).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log(`  Por estado: ${Object.entries(count('status')).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log(`  Ciudades: ${new Set(casas.map((c) => c.address.city)).size}. Fotos por casa: entre ${Math.min(...fotos)} y ${Math.max(...fotos)}`);
}

// Devuelve el código de salida: 0 si todo ha ido bien.
// (Se evita process.exit(): en Windows a veces falla si quedan conexiones abiertas)
async function main() {
  let casas;
  try {
    casas = JSON.parse(readFileSync(new URL('./casas.json', import.meta.url), 'utf8'));
  } catch {
    console.error('No se encuentra scripts/casas.json. Créalo antes con: npm run generar-casas');
    return 1;
  }
  const problems = casas.flatMap(check);
  if (problems.length) {
    console.error('El archivo casas.json tiene errores:\n' + problems.join('\n'));
    return 1;
  }
  console.log(`casas.json: ${casas.length} casas correctas.`);
  summary(casas);
  console.log(`Backend: ${API}`);
  console.log('Despertando el backend (puede tardar hasta 1 minuto)…');

  let existing;
  try {
    existing = await existingProperties();
  } catch (err) {
    console.error('No se ha podido leer el backend: ' + err.message);
    return 1;
  }
  const existingKeys = new Set(existing.map((p) => key(p.address)));
  const toUpload = casas.filter((c) => !existingKeys.has(key(c.address)));
  const skipped = casas.length - toUpload.length;

  console.log(`\nYa hay ${existing.length} propiedades activas. Se subirían ${toUpload.length}` + (skipped ? ` (${skipped} ya estaban).` : '.'));
  for (const c of toUpload.slice(0, 8)) {
    console.log(`  · ${c.title} · ${c.price.toLocaleString('es-ES')} € · ${c.address.street} ${c.address.number}, ${c.address.city}`);
  }
  if (toUpload.length > 8) console.log(`  · … y ${toUpload.length - 8} más`);

  if (dryRun) {
    console.log('\nModo prueba: no se ha subido nada.');
    return 0;
  }
  if (toUpload.length === 0) {
    console.log('\nNo hay nada que subir.');
    return 0;
  }

  const email = process.env.ADMIN_EMAIL || (await ask('\nCorreo del administrador: '));
  const password = process.env.ADMIN_PASSWORD || (await ask('Contraseña: ', { hidden: true }));

  let token;
  try {
    token = (await request('POST', '/users/login', { body: { email: email.toLowerCase(), password } })).token;
  } catch (err) {
    console.error('No se ha podido iniciar sesión: ' + err.message);
    return 1;
  }
  const me = await request('GET', '/users/me', { token });
  if (me.role !== 'ADMIN') {
    console.error(`${me.name} no es administrador (es ${me.role}). Solo un ADMIN puede crear propiedades.`);
    return 1;
  }

  const answer = await ask(`\n¿Subir ${toUpload.length} casas como ${me.name}? (s/n) `);
  if (answer.toLowerCase() !== 's') {
    console.log('No se ha subido nada.');
    return 0;
  }

  // Se suben en orden (las primeras quedan como las más antiguas), de PARALLEL en PARALLEL
  let ok = 0;
  let next = 0;
  const failed = [];
  async function worker() {
    while (next < toUpload.length) {
      const casa = toUpload[next++];
      try {
        await withRetries(() => request('POST', '/properties', { token, body: casa }));
        ok++;
      } catch (err) {
        failed.push(`${casa.title}: ${err.message}`);
      }
      const done = ok + failed.length;
      if (done % 25 === 0 || done === toUpload.length) {
        console.log(`  ${done} de ${toUpload.length}${failed.length ? ` (${failed.length} con error)` : ''}`);
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));

  console.log(`\nSubidas ${ok} de ${toUpload.length}.`);
  if (failed.length) {
    console.log('No se han podido subir:\n' + failed.map((f) => '  ✗ ' + f).join('\n'));
    console.log('Vuelve a lanzar el script: solo intentará las que faltan.');
  }
  return failed.length === 0 ? 0 : 1;
}

process.exitCode = await main();
