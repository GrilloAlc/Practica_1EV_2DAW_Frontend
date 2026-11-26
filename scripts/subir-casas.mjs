// Sube al backend las casas de scripts/casas.json (todas en venta, con dirección real, coordenadas y foto).
//
// Uso (desde la carpeta del frontend):
//   npm run subir-casas              → pide el correo y la contraseña de un ADMIN y las sube
//   npm run subir-casas -- --prueba  → solo comprueba el archivo y lo que se subiría, sin entrar ni subir nada
//   npm run subir-casas -- --api http://localhost:3000/api   → contra otro backend
//
// También se pueden pasar las credenciales con las variables ADMIN_EMAIL y ADMIN_PASSWORD.
// No sube dos veces la misma casa: si ya hay una activa en la misma calle, número y ciudad, la salta.
// Las fotos son rutas de la web (/images/propiedades/...), que el frontend sirve desde public/.

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const DEFAULT_API = 'https://practica-1ev-2daw-backend.onrender.com/api';

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
  return errors.map((e) => `  Casa ${i + 1} (${casa.title || 'sin título'}): ${e}`);
}

const key = (a) => `${a.street}|${a.number || ''}|${a.city}`.toLowerCase();

// ---------- Peticiones ----------

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
    const message = typeof data === 'string' ? data : data?.message || JSON.stringify(data);
    throw new Error(`${res.status} ${message}`);
  }
  return data;
}

// Todas las propiedades activas (el backend da 50 por página como máximo)
async function existingProperties() {
  const all = [];
  for (let page = 1; ; page++) {
    const res = await request('GET', `/properties?limit=50&page=${page}`);
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

// Devuelve el código de salida: 0 si todo ha ido bien.
// (Se evita process.exit(): en Windows a veces falla si quedan conexiones abiertas)
async function main() {
  const casas = JSON.parse(readFileSync(new URL('./casas.json', import.meta.url), 'utf8'));
  const problems = casas.flatMap(check);
  if (problems.length) {
    console.error('El archivo casas.json tiene errores:\n' + problems.join('\n'));
    return 1;
  }
  console.log(`casas.json: ${casas.length} casas correctas.`);
  console.log(`Backend: ${API}`);
  console.log('Despertando el backend (puede tardar hasta 1 minuto)…');

  const existing = await existingProperties();
  const existingKeys = new Set(existing.map((p) => key(p.address)));
  const toUpload = casas.filter((c) => !existingKeys.has(key(c.address)));
  const skipped = casas.length - toUpload.length;

  console.log(`\nYa hay ${existing.length} propiedades activas. Se subirían ${toUpload.length}` + (skipped ? ` (${skipped} ya estaban).` : '.'));
  for (const c of toUpload) {
    console.log(`  · ${c.title} · ${c.price.toLocaleString('es-ES')} € · ${c.address.street} ${c.address.number}, ${c.address.city}`);
  }

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
    token = (await request('POST', '/users/login', { body: { email, password } })).token;
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

  let ok = 0;
  for (const casa of toUpload) {
    try {
      await request('POST', '/properties', { token, body: casa });
      ok++;
      console.log(`  ✓ ${casa.title}`);
    } catch (err) {
      console.log(`  ✗ ${casa.title}: ${err.message}`);
    }
  }
  console.log(`\nSubidas ${ok} de ${toUpload.length}.`);
  return ok === toUpload.length ? 0 : 1;
}

process.exitCode = await main();
