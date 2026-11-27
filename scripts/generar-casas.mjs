// Genera scripts/casas.json con 500 casas para subir al backend con `npm run subir-casas`.
//
//   npm run generar-casas                          → usa las direcciones guardadas en scripts/datos/direcciones.json
//   npm run generar-casas -- --buscar-direcciones  → vuelve a buscarlas en OpenStreetMap (tarda unos minutos)
//
// De dónde sale cada dato:
// - Direcciones: portales reales de OpenStreetMap (calle, número, código postal y coordenadas), buscados con
//   Photon (https://photon.komoot.io) alrededor de barrios de 73 zonas de España. Se guardan en
//   scripts/datos/direcciones.json para que el resultado no cambie de una ejecución a otra.
// - Fotos: fotografías de Unsplash (licencia de Unsplash, uso libre) clasificadas por estancia y estilo en
//   scripts/datos/fotos.json. Cada casa lleva fotos de un mismo estilo: fachada o salón, cocina, dormitorio y baño.
// - Precios: superficie × precio aproximado del metro cuadrado de cada zona (venta) o del alquiler mensual.
// - Textos: frases escritas a mano que se combinan según el tipo de casa, su estilo y su zona.
// - Las 12 casas de scripts/datos/casas-manuales.json van primero, con sus textos y su foto, y se les añaden fotos.
//
// El backend solo guarda una foto por casa (campo image, texto). Para que la ficha tenga galería, image lleva
// las direcciones de todas las fotos separadas por espacios (la primera es la portada). El frontend las separa
// (src/utils/photos.ts). Si algún día el backend añade un campo images: [String], también se envía.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const TOTAL = 500;
const args = process.argv.slice(2);
const buscar = args.includes('--buscar-direcciones');

const ruta = (archivo) => new URL(archivo, import.meta.url);
const fotos = JSON.parse(readFileSync(ruta('./datos/fotos.json'), 'utf8'));
const manuales = JSON.parse(readFileSync(ruta('./datos/casas-manuales.json'), 'utf8'));

// ---------- Azar con semilla: siempre sale lo mismo con las mismas direcciones ----------

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(20261127);
const entre = (min, max) => min + random() * (max - min);
const entero = (min, max) => Math.floor(entre(min, max + 1));
const una = (lista) => lista[Math.floor(random() * lista.length)];
const probabilidad = (p) => random() < p;
function segun(pesos) {
  const total = Object.values(pesos).reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (const [clave, peso] of Object.entries(pesos)) {
    r -= peso;
    if (r <= 0) return clave;
  }
  return Object.keys(pesos)[0];
}
function barajar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ---------- Zonas ----------
// tipo de zona: centro (pisos), residencial (chalets), costa, pueblo.
// venta: €/m² aproximado; alquiler: €/m² al mes. n: peso de la zona en el total.

const ZONAS = [
  // Madrid
  { id: 'mad-salamanca', ciudad: 'Madrid', zona: 'el barrio de Salamanca', lat: 40.4285, lng: -3.681, r: 0.7, n: 22, venta: 9800, alquiler: 28, tipo: 'centro', nota: ['En pleno barrio de Salamanca, con el comercio de Serrano y Velázquez a pocos minutos.', 'Calles arboladas, buen comercio y el Retiro a un paseo.'] },
  { id: 'mad-chamberi', ciudad: 'Madrid', zona: 'Chamberí', lat: 40.433, lng: -3.695, r: 0.6, n: 16, venta: 8200, alquiler: 25, tipo: 'centro', nota: ['Chamberí: calles tranquilas, mercados de toda la vida y el metro muy cerca.'] },
  { id: 'mad-retiro', ciudad: 'Madrid', zona: 'Retiro', lat: 40.4185, lng: -3.672, r: 0.5, n: 10, venta: 7800, alquiler: 23, tipo: 'centro', nota: ['A pocos minutos andando del parque del Retiro.'] },
  { id: 'mad-chueca', ciudad: 'Madrid', zona: 'Chueca', lat: 40.4235, lng: -3.6965, r: 0.4, n: 10, venta: 7600, alquiler: 25, tipo: 'centro', loft: true, nota: ['En el centro de Madrid, entre Chueca y Alonso Martínez.'] },
  { id: 'mad-elviso', ciudad: 'Madrid', zona: 'El Viso', lat: 40.444, lng: -3.683, r: 0.5, n: 10, venta: 8800, alquiler: 24, tipo: 'centro', nota: ['Colonia tranquila de calles residenciales, cerca de la Castellana.'] },
  { id: 'mad-arturosoria', ciudad: 'Madrid', zona: 'Arturo Soria', lat: 40.456, lng: -3.6545, r: 0.7, n: 8, venta: 5400, alquiler: 18, tipo: 'residencial', nota: ['Zona residencial con colegios, parques y transporte cerca.'] },
  { id: 'mad-aravaca', ciudad: 'Madrid', zona: 'Aravaca', lat: 40.4595, lng: -3.7835, r: 0.8, n: 8, venta: 5600, alquiler: 18, tipo: 'residencial', nota: ['Zona residencial tranquila, con buenos colegios y salida rápida a la A-6.'] },
  { id: 'mad-moraleja', ciudad: 'Alcobendas', zona: 'La Moraleja', lat: 40.518, lng: -3.64, r: 1, n: 10, venta: 6000, alquiler: 19, tipo: 'residencial', nota: ['Urbanización residencial con colegios internacionales y campo de golf cerca.'] },
  { id: 'mad-pozuelo', ciudad: 'Pozuelo de Alarcón', zona: 'Pozuelo', lat: 40.435, lng: -3.812, r: 1, n: 8, venta: 5000, alquiler: 17, tipo: 'residencial', nota: ['Zona residencial con buenos colegios y el centro de Madrid a unos veinte minutos en coche.'] },
  { id: 'mad-majadahonda', ciudad: 'Majadahonda', zona: 'Majadahonda', lat: 40.473, lng: -3.872, r: 0.8, n: 4, venta: 4300, alquiler: 15, tipo: 'residencial', nota: ['Municipio tranquilo del noroeste de Madrid, con servicios y colegios cerca.'] },
  { id: 'mad-rozas', ciudad: 'Las Rozas de Madrid', zona: 'Las Rozas', lat: 40.492, lng: -3.874, r: 0.8, n: 4, venta: 4100, alquiler: 15, tipo: 'residencial', nota: ['Zona residencial del noroeste de Madrid, con buenos accesos a la A-6.'] },
  // Barcelona y costa
  { id: 'bcn-eixample', ciudad: 'Barcelona', zona: 'el Eixample', lat: 41.396, lng: 2.164, r: 0.6, n: 18, venta: 6600, alquiler: 24, tipo: 'centro', hidraulico: true, nota: ['En el Eixample, con sus chaflanes y el paseo de Gràcia a pocos minutos.'] },
  { id: 'bcn-santgervasi', ciudad: 'Barcelona', zona: 'Sant Gervasi', lat: 41.3975, lng: 2.144, r: 0.5, n: 10, venta: 6900, alquiler: 24, tipo: 'centro', nota: ['Zona tranquila de la parte alta de Barcelona, con buen comercio y colegios.'] },
  { id: 'bcn-pedralbes', ciudad: 'Barcelona', zona: 'Pedralbes', lat: 41.3905, lng: 2.1145, r: 0.6, n: 8, venta: 7800, alquiler: 26, tipo: 'residencial', nota: ['Una de las zonas más tranquilas de Barcelona, junto a la Diagonal.'] },
  { id: 'bcn-gracia', ciudad: 'Barcelona', zona: 'Gràcia', lat: 41.4025, lng: 2.1565, r: 0.5, n: 8, venta: 5900, alquiler: 22, tipo: 'centro', hidraulico: true, nota: ['En Gràcia, entre plazas, mercados y comercio de barrio.'] },
  { id: 'bcn-born', ciudad: 'Barcelona', zona: 'el Born', lat: 41.385, lng: 2.182, r: 0.3, n: 6, venta: 6300, alquiler: 25, tipo: 'centro', loft: true, nota: ['En el Born, a un paseo del mar y del parque de la Ciutadella.'] },
  { id: 'bcn-sarria', ciudad: 'Barcelona', zona: 'Sarrià', lat: 41.3995, lng: 2.1215, r: 0.5, n: 6, venta: 7200, alquiler: 24, tipo: 'residencial', nota: ['En Sarrià, con aire de pueblo dentro de Barcelona.'] },
  { id: 'bcn-sitges', ciudad: 'Sitges', zona: 'Sitges', lat: 41.2365, lng: 1.8065, r: 0.8, n: 8, venta: 5300, alquiler: 20, tipo: 'costa', region: 'cataluna', nota: ['A pocos minutos andando de la playa y del centro de Sitges.'] },
  { id: 'bcn-castelldefels', ciudad: 'Castelldefels', zona: 'Castelldefels', lat: 41.269, lng: 1.98, r: 1, n: 6, venta: 4400, alquiler: 17, tipo: 'costa', region: 'cataluna', nota: ['Cerca de la playa y con buenas conexiones con Barcelona.'] },
  // Costa del Sol
  { id: 'mlg-millaoro', ciudad: 'Marbella', zona: 'la Milla de Oro', lat: 36.5085, lng: -4.92, r: 1.2, n: 14, venta: 7500, alquiler: 23, tipo: 'costa', region: 'andalucia', nota: ['En la Milla de Oro de Marbella, entre el centro y Puerto Banús.'] },
  { id: 'mlg-marbella', ciudad: 'Marbella', zona: 'el casco antiguo de Marbella', lat: 36.5105, lng: -4.884, r: 0.4, n: 6, venta: 5300, alquiler: 18, tipo: 'centro', region: 'andalucia', nota: ['En el casco antiguo de Marbella, cerca de la plaza de los Naranjos.'] },
  { id: 'mlg-nuevaandalucia', ciudad: 'Marbella', zona: 'Nueva Andalucía', lat: 36.499, lng: -4.962, r: 1, n: 8, venta: 5400, alquiler: 18, tipo: 'costa', region: 'andalucia', nota: ['En Nueva Andalucía, rodeada de campos de golf y a pocos minutos de Puerto Banús.'] },
  { id: 'mlg-estepona', ciudad: 'Estepona', zona: 'Estepona', lat: 36.4265, lng: -5.1455, r: 0.8, n: 8, venta: 4300, alquiler: 15, tipo: 'costa', region: 'andalucia', nota: ['A pocos minutos de la playa y del centro de Estepona.'] },
  { id: 'mlg-benahavis', ciudad: 'Benahavís', zona: 'Benahavís', lat: 36.5235, lng: -5.046, r: 1.5, n: 6, venta: 5000, alquiler: 16, tipo: 'costa', region: 'andalucia', nota: ['En las colinas de Benahavís, con vistas abiertas y la costa a pocos minutos.'] },
  { id: 'mlg-centro', ciudad: 'Málaga', zona: 'el centro de Málaga', lat: 36.721, lng: -4.4195, r: 0.5, n: 8, venta: 4700, alquiler: 18, tipo: 'centro', region: 'andalucia', nota: ['En el centro histórico de Málaga, cerca de calle Larios y del puerto.'] },
  { id: 'mlg-pedregalejo', ciudad: 'Málaga', zona: 'Pedregalejo', lat: 36.7215, lng: -4.377, r: 0.6, n: 6, venta: 5000, alquiler: 18, tipo: 'costa', region: 'andalucia', nota: ['A pocos pasos de la playa de Pedregalejo.'] },
  { id: 'mlg-nerja', ciudad: 'Nerja', zona: 'Nerja', lat: 36.7465, lng: -3.8775, r: 0.7, n: 4, venta: 3900, alquiler: 14, tipo: 'costa', region: 'andalucia', nota: ['A pocos minutos del Balcón de Europa y de las calas de Nerja.'] },
  { id: 'mlg-mijas', ciudad: 'Mijas', zona: 'Mijas', lat: 36.5955, lng: -4.637, r: 0.8, n: 4, venta: 3700, alquiler: 13, tipo: 'pueblo', region: 'andalucia', costa: true, nota: ['En Mijas, pueblo blanco con vistas al mar.'] },
  // Baleares
  { id: 'pmi-santacatalina', ciudad: 'Palma', zona: 'Santa Catalina', lat: 39.5735, lng: 2.638, r: 0.4, n: 8, venta: 6300, alquiler: 21, tipo: 'centro', region: 'baleares', nota: ['En Santa Catalina, con su mercado y el paseo marítimo a pocos minutos.'] },
  { id: 'pmi-portixol', ciudad: 'Palma', zona: 'el Portixol', lat: 39.5615, lng: 2.6705, r: 0.6, n: 6, venta: 6200, alquiler: 20, tipo: 'costa', region: 'baleares', nota: ['Junto al mar, en el Portixol, a unos minutos del centro de Palma.'] },
  { id: 'pmi-sonvida', ciudad: 'Palma', zona: 'Son Vida', lat: 39.5955, lng: 2.6115, r: 0.8, n: 4, venta: 7000, alquiler: 22, tipo: 'residencial', region: 'baleares', nota: ['En Son Vida, zona residencial con campos de golf y vistas a la bahía de Palma.'] },
  { id: 'pmi-andratx', ciudad: 'Andratx', zona: "el Port d'Andratx", lat: 39.544, lng: 2.3895, r: 0.8, n: 6, venta: 8300, alquiler: 25, tipo: 'costa', region: 'baleares', nota: ["En el Port d'Andratx, con el puerto y las calas a pocos minutos."] },
  { id: 'pmi-pollenca', ciudad: 'Pollença', zona: 'Pollença', lat: 39.877, lng: 3.0165, r: 0.6, n: 5, venta: 4700, alquiler: 16, tipo: 'pueblo', region: 'baleares', costa: true, nota: ['En Pollença, entre la sierra de Tramuntana y el mar.'] },
  { id: 'ibz-ibiza', ciudad: 'Ibiza', zona: 'Ibiza', lat: 38.91, lng: 1.433, r: 0.6, n: 6, venta: 7600, alquiler: 29, tipo: 'costa', region: 'baleares', nota: ['En la ciudad de Ibiza, con Dalt Vila y el puerto a pocos minutos.'] },
  { id: 'ibz-santaeularia', ciudad: 'Santa Eulària des Riu', zona: 'Santa Eulària', lat: 38.9845, lng: 1.5335, r: 0.8, n: 5, venta: 7100, alquiler: 27, tipo: 'costa', region: 'baleares', nota: ['En Santa Eulària des Riu, cerca del paseo marítimo y de las calas del este de la isla.'] },
  { id: 'mah-ciutadella', ciudad: 'Ciutadella de Menorca', zona: 'Ciutadella', lat: 40.001, lng: 3.8385, r: 0.6, n: 4, venta: 4100, alquiler: 15, tipo: 'costa', region: 'baleares', nota: ['En Ciutadella, cerca del puerto y del casco antiguo.'] },
  // Valencia y Alicante
  { id: 'vlc-pladelreal', ciudad: 'Valencia', zona: 'el Pla del Real', lat: 39.4795, lng: -0.3605, r: 0.6, n: 8, venta: 4000, alquiler: 15, tipo: 'centro', nota: ['En el Pla del Real, junto a los jardines del Turia.'] },
  { id: 'vlc-ruzafa', ciudad: 'Valencia', zona: 'Ruzafa', lat: 39.4625, lng: -0.3745, r: 0.4, n: 6, venta: 3700, alquiler: 15, tipo: 'centro', loft: true, nota: ['En Ruzafa, el barrio de mercados, cafés y vida de calle de Valencia.'] },
  { id: 'vlc-carmen', ciudad: 'Valencia', zona: 'el barrio del Carmen', lat: 39.4775, lng: -0.379, r: 0.4, n: 6, venta: 4000, alquiler: 15, tipo: 'centro', nota: ['En el barrio del Carmen, en el casco antiguo de Valencia.'] },
  { id: 'ali-javea', ciudad: 'Jávea', zona: 'Jávea', lat: 38.7895, lng: 0.1715, r: 1.2, n: 7, venta: 4000, alquiler: 14, tipo: 'costa', nota: ['En Jávea, entre el Montgó y el mar.'] },
  { id: 'ali-altea', ciudad: 'Altea', zona: 'Altea', lat: 38.5995, lng: -0.0505, r: 0.8, n: 6, venta: 4100, alquiler: 14, tipo: 'costa', nota: ['En Altea, a pocos minutos del casco antiguo y de la playa.'] },
  { id: 'ali-denia', ciudad: 'Dénia', zona: 'Dénia', lat: 38.8405, lng: 0.1055, r: 0.8, n: 5, venta: 3400, alquiler: 12, tipo: 'costa', nota: ['En Dénia, cerca del puerto y de las playas.'] },
  { id: 'ali-sanjuan', ciudad: 'Alicante', zona: 'la playa de San Juan', lat: 38.372, lng: -0.4215, r: 0.8, n: 5, venta: 3400, alquiler: 13, tipo: 'costa', nota: ['A pocos minutos de la playa de San Juan.'] },
  // Andalucía
  { id: 'svq-remedios', ciudad: 'Sevilla', zona: 'Los Remedios', lat: 37.377, lng: -6.0, r: 0.5, n: 6, venta: 3700, alquiler: 12, tipo: 'centro', region: 'andalucia', nota: ['En Los Remedios, junto al río y a un paseo del centro de Sevilla.'] },
  { id: 'svq-centro', ciudad: 'Sevilla', zona: 'el centro de Sevilla', lat: 37.3895, lng: -5.993, r: 0.5, n: 8, venta: 4300, alquiler: 14, tipo: 'centro', region: 'andalucia', nota: ['En el centro de Sevilla, a un paseo de la catedral y del barrio de Santa Cruz.'] },
  { id: 'svq-triana', ciudad: 'Sevilla', zona: 'Triana', lat: 37.3845, lng: -6.0045, r: 0.5, n: 5, venta: 3600, alquiler: 12, tipo: 'centro', region: 'andalucia', nota: ['En Triana, al otro lado del río, con su mercado y sus calles de siempre.'] },
  { id: 'grx-albaicin', ciudad: 'Granada', zona: 'el Albaicín', lat: 37.1805, lng: -3.5925, r: 0.5, n: 6, venta: 3200, alquiler: 11, tipo: 'pueblo', region: 'andalucia', nota: ['En el Albaicín, el barrio que mira a la Alhambra.'] },
  { id: 'cor-centro', ciudad: 'Córdoba', zona: 'el centro de Córdoba', lat: 37.8855, lng: -4.7795, r: 0.5, n: 4, venta: 2500, alquiler: 9, tipo: 'centro', region: 'andalucia', nota: ['En el centro de Córdoba, a un paseo de la Mezquita.'] },
  { id: 'cad-casco', ciudad: 'Cádiz', zona: 'el casco antiguo de Cádiz', lat: 36.532, lng: -6.297, r: 0.5, n: 4, venta: 3700, alquiler: 12, tipo: 'centro', region: 'andalucia', nota: ['En el casco antiguo de Cádiz, rodeado de mar.'] },
  { id: 'cad-sotogrande', ciudad: 'San Roque', zona: 'Sotogrande', lat: 36.29, lng: -5.2775, r: 1.5, n: 5, venta: 4800, alquiler: 16, tipo: 'costa', region: 'andalucia', nota: ['En Sotogrande, entre campos de golf, el puerto deportivo y la playa.'] },
  { id: 'cad-vejer', ciudad: 'Vejer de la Frontera', zona: 'Vejer', lat: 36.252, lng: -5.966, r: 0.6, n: 3, venta: 3100, alquiler: 11, tipo: 'pueblo', region: 'andalucia', costa: true, nota: ['En Vejer de la Frontera, pueblo blanco a pocos minutos de las playas de la costa de Cádiz.'] },
  // Norte
  { id: 'ss-centro', ciudad: 'San Sebastián', zona: 'el centro de San Sebastián', lat: 43.3195, lng: -1.9815, r: 0.4, n: 8, venta: 8400, alquiler: 21, tipo: 'centro', nota: ['En el centro de San Sebastián, a pocos minutos de La Concha.'] },
  { id: 'ss-gros', ciudad: 'San Sebastián', zona: 'Gros', lat: 43.3225, lng: -1.9745, r: 0.4, n: 5, venta: 7400, alquiler: 20, tipo: 'centro', nota: ['En Gros, junto a la playa de la Zurriola.'] },
  { id: 'ss-antiguo', ciudad: 'San Sebastián', zona: 'el Antiguo', lat: 43.3135, lng: -2.004, r: 0.5, n: 4, venta: 8000, alquiler: 21, tipo: 'centro', nota: ['En el Antiguo, cerca de la playa de Ondarreta.'] },
  { id: 'bio-abando', ciudad: 'Bilbao', zona: 'Abando', lat: 43.2625, lng: -2.938, r: 0.5, n: 8, venta: 5000, alquiler: 15, tipo: 'centro', nota: ['En Abando, el centro de Bilbao, con la ría y el Guggenheim a un paseo.'] },
  { id: 'bio-neguri', ciudad: 'Getxo', zona: 'Neguri', lat: 43.3445, lng: -3.0085, r: 0.8, n: 4, venta: 5200, alquiler: 15, tipo: 'residencial', nota: ['En Neguri, en Getxo, con el mar y el puerto deportivo cerca.'] },
  { id: 'sdr-sardinero', ciudad: 'Santander', zona: 'El Sardinero', lat: 43.474, lng: -3.788, r: 0.6, n: 5, venta: 4300, alquiler: 13, tipo: 'costa', nota: ['En El Sardinero, junto a las playas de Santander.'] },
  { id: 'ovd-centro', ciudad: 'Oviedo', zona: 'el centro de Oviedo', lat: 43.3625, lng: -5.8465, r: 0.5, n: 4, venta: 2600, alquiler: 9, tipo: 'centro', nota: ['En el centro de Oviedo, cerca del Campo de San Francisco.'] },
  { id: 'gij-centro', ciudad: 'Gijón', zona: 'Gijón', lat: 43.5415, lng: -5.661, r: 0.6, n: 3, venta: 2800, alquiler: 9, tipo: 'centro', nota: ['En Gijón, a pocos minutos de la playa de San Lorenzo.'] },
  { id: 'cor-coruna', ciudad: 'A Coruña', zona: 'el centro de A Coruña', lat: 43.3695, lng: -8.3995, r: 0.5, n: 4, venta: 3300, alquiler: 11, tipo: 'centro', nota: ['En el centro de A Coruña, cerca de la Marina y del puerto.'] },
  { id: 'vgo-centro', ciudad: 'Vigo', zona: 'el centro de Vigo', lat: 42.2375, lng: -8.7205, r: 0.6, n: 3, venta: 3000, alquiler: 10, tipo: 'centro', nota: ['En el centro de Vigo, con la ría muy cerca.'] },
  { id: 'pna-ensanche', ciudad: 'Pamplona', zona: 'el Ensanche de Pamplona', lat: 42.8135, lng: -1.6455, r: 0.5, n: 3, venta: 3300, alquiler: 11, tipo: 'centro', nota: ['En el Ensanche de Pamplona, cerca del casco antiguo.'] },
  // Interior, Girona y Canarias
  { id: 'zgz-centro', ciudad: 'Zaragoza', zona: 'el centro de Zaragoza', lat: 41.6505, lng: -0.8805, r: 0.5, n: 4, venta: 2800, alquiler: 10, tipo: 'centro', nota: ['En el centro de Zaragoza, a un paseo del Pilar.'] },
  { id: 'vll-centro', ciudad: 'Valladolid', zona: 'el centro de Valladolid', lat: 41.6515, lng: -4.7255, r: 0.5, n: 3, venta: 2600, alquiler: 9, tipo: 'centro', nota: ['En el centro de Valladolid, cerca de la plaza Mayor.'] },
  { id: 'sal-centro', ciudad: 'Salamanca', zona: 'el centro de Salamanca', lat: 40.9655, lng: -5.6645, r: 0.5, n: 3, venta: 2700, alquiler: 9, tipo: 'centro', nota: ['En el centro de Salamanca, a pocos minutos de la plaza Mayor.'] },
  { id: 'tol-casco', ciudad: 'Toledo', zona: 'el casco histórico de Toledo', lat: 39.8575, lng: -4.0235, r: 0.5, n: 3, venta: 2300, alquiler: 8, tipo: 'pueblo', nota: ['En el casco histórico de Toledo.'] },
  { id: 'seg-centro', ciudad: 'Segovia', zona: 'Segovia', lat: 40.9485, lng: -4.1185, r: 0.5, n: 2, venta: 2400, alquiler: 8, tipo: 'pueblo', nota: ['En Segovia, a un paseo del acueducto.'] },
  { id: 'gro-barrivell', ciudad: 'Girona', zona: 'el Barri Vell de Girona', lat: 41.9855, lng: 2.825, r: 0.5, n: 3, venta: 3300, alquiler: 11, tipo: 'centro', region: 'cataluna', nota: ['En el Barri Vell de Girona, junto al río Onyar.'] },
  { id: 'gro-begur', ciudad: 'Begur', zona: 'Begur', lat: 41.9545, lng: 3.2085, r: 1, n: 4, venta: 5300, alquiler: 17, tipo: 'pueblo', region: 'cataluna', costa: true, nota: ['En Begur, entre pinos y calas de la Costa Brava.'] },
  { id: 'gro-cadaques', ciudad: 'Cadaqués', zona: 'Cadaqués', lat: 42.2885, lng: 3.2775, r: 0.6, n: 3, venta: 5600, alquiler: 18, tipo: 'pueblo', region: 'cataluna', costa: true, nota: ['En Cadaqués, frente al mar del cabo de Creus.'] },
  { id: 'lpa-canteras', ciudad: 'Las Palmas de Gran Canaria', zona: 'Las Canteras', lat: 28.1405, lng: -15.4335, r: 0.5, n: 4, venta: 3300, alquiler: 13, tipo: 'costa', nota: ['A pocos minutos de la playa de Las Canteras.'] },
  { id: 'tfe-centro', ciudad: 'Santa Cruz de Tenerife', zona: 'el centro de Santa Cruz', lat: 28.4675, lng: -16.2545, r: 0.5, n: 3, venta: 2800, alquiler: 10, tipo: 'centro', nota: ['En el centro de Santa Cruz de Tenerife, con el puerto y el parque García Sanabria cerca.'] },
  { id: 'tfe-adeje', ciudad: 'Adeje', zona: 'Costa Adeje', lat: 28.0885, lng: -16.733, r: 1, n: 4, venta: 4400, alquiler: 17, tipo: 'costa', nota: ['En Costa Adeje, cerca de las playas del sur de Tenerife.'] },
];

// ---------- Direcciones reales (Photon / OpenStreetMap) ----------

// Las dos primeras cifras del código postal indican la provincia (igual que src/utils/address.ts)
const PROVINCIAS = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila', '06': 'Badajoz',
  '07': 'Illes Balears', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón',
  '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16': 'Cuenca', '17': 'Girona', '18': 'Granada',
  '19': 'Guadalajara', '20': 'Gipuzkoa', '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León',
  '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
  '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra',
  '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia', '41': 'Sevilla',
  '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid',
  '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla',
};

// Nombres de municipio en OpenStreetMap → el nombre que usa la web (el mismo que se escribe en el buscador)
const NOMBRES_CIUDAD = {
  'València': 'Valencia', 'Valencia': 'Valencia', 'Donostia / San Sebastián': 'San Sebastián', 'Donostia-San Sebastián': 'San Sebastián',
  'Donostia': 'San Sebastián', 'San Sebastián': 'San Sebastián', 'Eivissa': 'Ibiza', 'Ibiza': 'Ibiza', 'Xàbia': 'Jávea',
  'Xàbia / Jávea': 'Jávea', 'Jávea / Xàbia': 'Jávea', 'Jávea': 'Jávea', 'Alacant': 'Alicante', 'Alicante / Alacant': 'Alicante',
  'Alicante': 'Alicante', 'Palma de Mallorca': 'Palma', 'Palma': 'Palma', 'Ciutadella': 'Ciutadella de Menorca',
  'Ciutadella de Menorca': 'Ciutadella de Menorca', 'Santa Eulalia del Río': 'Santa Eulària des Riu', 'Santa Eulària des Riu': 'Santa Eulària des Riu',
  'Bilbo': 'Bilbao', 'Bilbao': 'Bilbao', 'Las Rozas': 'Las Rozas de Madrid', 'Las Rozas de Madrid': 'Las Rozas de Madrid',
  'Gerona': 'Girona', 'La Coruña': 'A Coruña', 'Dénia': 'Dénia', 'Denia': 'Dénia', 'Altea': 'Altea',
  'Xixón': 'Gijón', 'Gijón / Xixón': 'Gijón', 'Gijón': 'Gijón', 'Iruña': 'Pamplona', 'Pamplona / Iruña': 'Pamplona',
  'Pamplona/Iruña': 'Pamplona', 'Iruña / Pamplona': 'Pamplona', 'Pamplona': 'Pamplona',
};
const normalizarCiudad = (nombre) => NOMBRES_CIUDAD[nombre] || nombre;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function photonCerca(lat, lng, radioKm) {
  const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=50&radius=${radioKm}&layer=house&lang=default`;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'catahome-datos-de-prueba/1.0' }, signal: AbortSignal.timeout(30_000) });
      if (res.ok) return (await res.json()).features || [];
      console.log(`    Photon respondió ${res.status}, reintento…`);
    } catch (err) {
      console.log(`    Error con Photon (${err.message}), reintento…`);
    }
    await espera(3000 * intento);
  }
  return [];
}

// Primera letra en mayúscula ("carrer d'en Llorenç Cerdà" → "Carrer d'en Llorenç Cerdà")
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Busca direcciones de todas las zonas, o solo de las que tienen pocas (si se pasa la lista anterior)
async function buscarDirecciones(anteriores = null) {
  const resultado = { ...(anteriores || {}) };
  for (const zona of ZONAS) {
    const queridas = Math.ceil(zona.n * 1.6) + 2;
    if (anteriores && (anteriores[zona.id] || []).length >= Math.ceil(zona.n * 1.2)) continue;
    const vistas = new Map((anteriores?.[zona.id] || []).map((d) => [`${d.street}|${d.number}`.toLowerCase(), d]));
    // Varios puntos alrededor del centro de la zona para no quedarse en una sola manzana
    for (let i = 0; i < 6 && vistas.size < queridas; i++) {
      const angulo = random() * Math.PI * 2;
      const distancia = i === 0 ? 0 : (zona.r / 111) * entre(0.3, 0.9);
      const lat = zona.lat + Math.sin(angulo) * distancia;
      const lng = zona.lng + (Math.cos(angulo) * distancia) / Math.cos((zona.lat * Math.PI) / 180);
      const features = await photonCerca(lat.toFixed(5), lng.toFixed(5), zona.r);
      for (const f of features) {
        const p = f.properties || {};
        if (p.countrycode !== 'ES' || !p.street || !p.housenumber || !/^\d{5}$/.test(p.postcode || '')) continue;
        const ciudad = normalizarCiudad(p.city || p.locality || '');
        if (ciudad !== zona.ciudad) continue;
        const clave = `${p.street}|${p.housenumber}`.toLowerCase();
        if (vistas.has(clave)) continue;
        const [lngF, latF] = f.geometry.coordinates;
        vistas.set(clave, {
          street: capitalizar(p.street.trim()),
          number: String(p.housenumber).trim(),
          postalCode: p.postcode,
          city: zona.ciudad,
          province: PROVINCIAS[p.postcode.slice(0, 2)] || p.state || zona.ciudad,
          coordinates: { lat: Number(latF.toFixed(6)), lng: Number(lngF.toFixed(6)) },
        });
      }
      await espera(1200);
    }
    resultado[zona.id] = [...vistas.values()];
    console.log(`  ${zona.id}: ${resultado[zona.id].length} direcciones`);
  }
  return resultado;
}

// ---------- Fotos ----------

const URL_UNSPLASH = 'https://images.unsplash.com/photo-';
const usos = new Map(); // cuántas veces se ha usado cada foto, para repartirlas

// Fachadas elegidas a mano (revisadas una a una) para las casas en venta más caras, que son las que
// salen en el carrusel del inicio. Se reservan: ninguna otra casa las usa
const PORTADAS = [
  '1580587771525-78b9dba3b914', '1706808849780-7a04fbac83ef', '1622015663319-e97e697503ee', '1717167398817-121e3c283dbb',
  '1707189856923-46dd41ea2bdc', '1602343168117-bb8ffe3e2e9f', '1678889284769-b7dcbec1f082', '1613977257592-4871e5fcd7c4',
];
for (const id of PORTADAS) usos.set(id, 1000);

function elegirFoto(tipos, estilo, excluir) {
  let candidatas = fotos.filter((f) => tipos.includes(f.tipo) && f.estilos.includes(estilo) && !excluir.has(f.id));
  if (candidatas.length === 0) candidatas = fotos.filter((f) => tipos.includes(f.tipo) && !excluir.has(f.id));
  if (candidatas.length === 0) return null;
  // La menos usada; si hay empate, una al azar
  const minimo = Math.min(...candidatas.map((f) => usos.get(f.id) || 0));
  const foto = una(candidatas.filter((f) => (usos.get(f.id) || 0) === minimo));
  usos.set(foto.id, minimo + 1);
  excluir.add(foto.id);
  return foto;
}

function galeria(plan, estilo) {
  const usadas = new Set();
  const lista = [];
  for (const tipos of plan) {
    // No hay fachadas de casa "clásicas": un chalet clásico de zona residencial se parece más a uno moderno
    const estiloFoto = tipos.includes('exterior-casa') && estilo === 'clasico' ? 'moderno' : estilo;
    const foto = elegirFoto(tipos, estiloFoto, usadas);
    if (foto) lista.push(URL_UNSPLASH + foto.id);
  }
  return lista;
}

// ---------- Textos ----------

const PLANTAS = ['Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta', 'Séptima'];
const NUMEROS = ['', 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
const numeroMin = (n) => (n === 1 ? 'un' : NUMEROS[n].toLowerCase());
const dormitorios = (n) => `${NUMEROS[n]} ${n === 1 ? 'dormitorio' : 'dormitorios'}`;
const banos = (n) => `${numeroMin(n)} ${n === 1 ? 'baño' : 'baños'}`;
const primeraMayuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function lista(partes) {
  if (partes.length === 1) return partes[0];
  return partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1];
}

// "Calle de Velázquez" → "la calle de Velázquez" (para los títulos que nombran la calle)
function conArticulo(calle) {
  const reglas = [
    [/^(Calle|Avenida|Plaza|Rambla|Ronda|Travesía|Glorieta|Carretera|Urbanización|Costanilla|Cuesta|Gran Vía|Vía|Avinguda|Plaça|Rúa|Rua|Kalea|Calle)\b/i, 'la '],
    [/^(Paseo|Camino|Callejón|Pasaje|Carrer|Passeig|Passatge|Camí|Barrio|Paseig)\b/i, 'el '],
  ];
  for (const [regla, articulo] of reglas) {
    if (regla.test(calle)) return articulo + calle.charAt(0).toLowerCase() + calle.slice(1);
  }
  return calle;
}

const TITULOS = {
  piso: { clasico: ['Piso señorial', 'Piso con balcones', 'Piso de techos altos', 'Piso exterior'], moderno: ['Piso reformado', 'Piso luminoso', 'Piso exterior', 'Piso de diseño'], costa: ['Piso con vistas al mar', 'Piso junto al mar', 'Piso luminoso'], rustico: ['Piso con vigas de madera', 'Piso con encanto'] },
  atico: { clasico: ['Ático con terraza'], moderno: ['Ático con terraza', 'Ático de diseño'], costa: ['Ático con vistas al mar', 'Ático con terraza'], rustico: ['Ático con terraza'] },
  duplex: { clasico: ['Dúplex señorial'], moderno: ['Dúplex con terraza', 'Dúplex reformado'], costa: ['Dúplex con vistas'], rustico: ['Dúplex con vigas vistas'] },
  loft: { clasico: ['Loft en antigua fábrica'], moderno: ['Loft de techos altos', 'Loft reformado'], costa: ['Loft luminoso'], rustico: ['Loft con vigas de madera'] },
  estudio: { clasico: ['Estudio con balcón'], moderno: ['Estudio reformado', 'Estudio luminoso'], costa: ['Estudio junto al mar'], rustico: ['Estudio con encanto'] },
  bajo: { clasico: ['Bajo con patio'], moderno: ['Bajo con jardín', 'Bajo con terraza'], costa: ['Bajo con jardín'], rustico: ['Bajo con patio'] },
  villa: { clasico: ['Villa con jardín'], moderno: ['Villa de diseño', 'Villa con piscina'], costa: ['Villa con vistas al mar', 'Villa con piscina', 'Villa mediterránea'], rustico: ['Villa de piedra'] },
  chalet: { clasico: ['Chalet con jardín', 'Chalet señorial'], moderno: ['Chalet con piscina', 'Chalet independiente', 'Chalet de diseño'], costa: ['Chalet con piscina', 'Chalet junto al mar'], rustico: ['Chalet con jardín'] },
  adosada: { clasico: ['Casa adosada con jardín'], moderno: ['Casa adosada reformada', 'Casa adosada con jardín'], costa: ['Casa adosada cerca del mar'], rustico: ['Casa adosada con patio'] },
  pueblo: { clasico: ['Casa con patio', 'Casa señorial'], moderno: ['Casa rehabilitada', 'Casa con patio'], costa: ['Casa encalada', 'Casa con terraza'], rustico: ['Casa de piedra', 'Casa de pueblo rehabilitada', 'Casa con patio'] },
  finca: { cataluna: ['Masía restaurada'], andalucia: ['Cortijo con olivos'], baleares: ['Finca con casa de piedra'], otra: ['Casa de campo con terreno'] },
  local: ['Local a pie de calle', 'Local comercial', 'Local con escaparate', 'Local diáfano'],
  oficina: ['Oficina luminosa', 'Oficina reformada'],
  terreno: ['Parcela urbana', 'Parcela edificable', 'Parcela con vistas'],
  rustico: ['Finca rústica', 'Terreno rústico', 'Finca con olivos'],
  vinedo: ['Finca con viñedo', 'Terreno con viñedo'],
};

const LUZ = {
  clasico: ['Los balcones dan a la calle y el sol entra por la mañana.', 'Orientación sur: luz directa casi todo el día.', 'Todas las estancias son exteriores.', 'Entra luz por las dos fachadas.'],
  moderno: ['Ventanales de suelo a techo y luz todo el día.', 'Orientación sur y ventanas grandes en todas las estancias.', 'Mucha luz natural y vistas despejadas.'],
  costa: ['Se ve el mar desde el salón.', 'Orientación sur, con luz y brisa del mar.', 'Vistas abiertas al mar desde casi todas las estancias.'],
  rustico: ['Muros gruesos que guardan el fresco en verano.', 'Ventanas pequeñas y profundas, como en las casas de antes.', 'Luz suave de mañana y mucho silencio.'],
};

const SALON = {
  clasico: ['El salón tiene techos altos con molduras.', 'Salón con balcones a la calle y suelos de madera.', 'El salón conserva las puertas y las molduras originales.'],
  moderno: ['Salón y comedor en un mismo espacio abierto.', 'Salón amplio, de líneas sencillas, abierto a la cocina.', 'Salón con ventanales y suelo de roble.'],
  costa: ['El salón se abre a la terraza.', 'Salón luminoso con salida a la terraza.', 'Salón y comedor con vistas al mar.'],
  rustico: ['El salón conserva la chimenea y las vigas de madera.', 'Salón con chimenea y suelos de barro.', 'Salón con muros de piedra vista.'],
};

const COCINA = {
  clasico: ['Cocina independiente con office.', 'Cocina independiente, reformada y equipada.', 'Cocina con despensa y salida a un tendedero.'],
  moderno: ['Cocina abierta con isla.', 'Cocina equipada con electrodomésticos integrados.', 'Cocina reformada, abierta al salón.'],
  costa: ['Cocina abierta y equipada.', 'Cocina con salida a la terraza.', 'Cocina reformada con barra.'],
  rustico: ['Cocina amplia con mesa para comer.', 'Cocina de obra con encimera de piedra.', 'Cocina con despensa.'],
};

const EXTRAS = {
  piso: ['suelos de madera', 'carpintería exterior nueva', 'aire acondicionado por conductos', 'calefacción central', 'armarios empotrados', 'trastero', 'plaza de garaje en el mismo edificio', 'puerta blindada'],
  clasico: ['portero físico', 'techos de más de tres metros', 'puertas originales restauradas'],
  hidraulico: ['suelos hidráulicos originales', 'techos con bóveda catalana'],
  moderno: ['domótica', 'aerotermia', 'suelo radiante', 'ventanas con doble acristalamiento'],
  costa: ['piscina comunitaria', 'zonas verdes comunitarias', 'aire acondicionado', 'plaza de garaje'],
  casa: ['jardín con riego automático', 'garaje para dos coches', 'trastero', 'placas solares', 'barbacoa', 'porche', 'aire acondicionado', 'calefacción por suelo radiante'],
  villa: ['piscina', 'jardín con árboles crecidos', 'garaje para dos coches', 'casa de invitados', 'gimnasio', 'bodega'],
  rustico: ['chimenea', 'pozo propio', 'bodega', 'horno de leña', 'huerto', 'vigas de madera'],
};

const NOTAS = ['Luz, techos altos y silencio.', 'Primera impresión: mucha luz.', 'Una casa para quedarse.', 'Silencio y vistas.', 'De las que se recuerdan.', 'Espacio, luz y buena distribución.'];

function textoAlquiler(tipo) {
  if (tipo === 'Local') return una(['Se alquila sin traspaso.', 'Alquiler con contrato de larga duración.']);
  const amueblado = tipo === 'Casa' ? 'amueblada' : 'amueblado';
  return una([`Se alquila ${amueblado} y con contrato de larga duración.`, 'Se alquila sin muebles, con contrato de larga duración.', `Se alquila ${amueblado}. Contrato mínimo de un año.`]);
}

function describirPiso(c, z, estilo, subtipo, area, dorm, ban) {
  const partes = [];
  if (probabilidad(0.25)) partes.push(una(NOTAS));
  const ascensor = probabilidad(0.9) ? ' con ascensor' : '';
  if (subtipo === 'atico') {
    const terraza = entero(15, 70);
    partes.push(`Última planta${ascensor ? ', con ascensor y' : ' con'} una terraza de ${terraza} m². ${una(LUZ[estilo])}`);
  } else if (subtipo === 'bajo') {
    partes.push(`Bajo con un ${estilo === 'clasico' || estilo === 'rustico' ? 'patio' : 'jardín'} privado de ${entero(20, 80)} m². ${una(LUZ[estilo])}`);
  } else if (subtipo === 'loft') {
    partes.push(`Loft de techos altos en un antiguo edificio industrial, reformado por completo. ${una(LUZ.moderno)}`);
  } else if (subtipo === 'estudio') {
    partes.push(`Estudio de ${area} m² bien aprovechados, con la cama separada de la zona de día. ${una(LUZ[estilo])}`);
  } else {
    const finca = { clasico: una(['en una finca de principios del siglo XX', 'en una finca señorial', 'en un edificio clásico bien cuidado']), moderno: una(['en un edificio de obra reciente', 'en una finca rehabilitada', 'en un edificio con zonas comunes renovadas']), costa: una(['en primera línea', 'en una urbanización con piscina', 'a pocos pasos del paseo marítimo']), rustico: 'en una casa antigua dividida en pocos vecinos' }[estilo];
    const planta = subtipo === 'duplex' ? 'Dúplex' : `${una(PLANTAS.slice(0, 6))} planta`;
    partes.push(`${planta}${ascensor} ${finca}. ${una(LUZ[estilo])}`);
  }
  partes.push('');
  if (subtipo !== 'estudio') {
    const suite = ban >= 2 && probabilidad(0.6) ? ', uno de ellos en suite' : '';
    partes.push(`${dormitorios(dorm)} y ${banos(ban)}${suite}. ${una(SALON[estilo])} ${una(COCINA[estilo])}`);
  } else {
    partes.push(`${una(COCINA.moderno)} Baño completo con plato de ducha.`);
  }
  const extras = barajar([...EXTRAS.piso, ...(EXTRAS[estilo] || []), ...(z.hidraulico ? EXTRAS.hidraulico : [])]).slice(0, entero(2, 3));
  partes.push(`Tiene ${lista(extras)}.`);
  return { partes, extras };
}

function describirCasa(c, z, estilo, subtipo, area, dorm, ban) {
  const partes = [];
  if (probabilidad(0.25)) partes.push(una(NOTAS));
  const parcela = Math.round(area * entre(1.8, 5) / 10) * 10;
  const plantas = area > 300 ? 'tres plantas' : una(['dos plantas', 'dos plantas']);
  const inicio = {
    villa: `Villa de ${plantas} sobre una parcela de ${parcela.toLocaleString('es-ES')} m².`,
    chalet: `Chalet independiente de ${plantas} en una parcela de ${parcela.toLocaleString('es-ES')} m².`,
    adosada: `Casa adosada de ${plantas} con jardín propio de ${entero(40, 140)} m².`,
    pueblo: z.tipo === 'pueblo'
      ? `Casa de ${una(['dos', 'tres'])} plantas en el casco antiguo, rehabilitada respetando los materiales de siempre.`
      : `Casa de ${una(['dos', 'tres'])} plantas en pleno centro, rehabilitada respetando los materiales originales.`,
    finca: `Casa de campo sobre una finca de ${(entero(8, 60) * 1000).toLocaleString('es-ES')} m², con olivos y almendros.`,
  }[subtipo];
  partes.push(`${inicio} ${una(LUZ[estilo])}`);
  partes.push('');
  const suite = probabilidad(0.7) ? ', el principal en suite' : '';
  partes.push(`${dormitorios(dorm)} y ${banos(ban)}${suite}. ${una(SALON[estilo])} ${una(COCINA[estilo])}`);
  const pool = [...EXTRAS.casa, ...(subtipo === 'villa' ? EXTRAS.villa : []), ...(estilo === 'rustico' || subtipo === 'finca' ? EXTRAS.rustico : []), ...(estilo === 'moderno' ? EXTRAS.moderno : [])];
  const extras = barajar(pool).slice(0, entero(3, 4));
  partes.push(`Tiene ${lista(extras)}.`);
  return { partes, extras };
}

function describirLocal(c, z, area, oficina) {
  const partes = [];
  if (oficina) {
    partes.push(`Oficina de ${area} m² en planta ${una(['primera', 'segunda', 'tercera'])}, diáfana y con mucha luz natural.`);
    partes.push('');
    partes.push(`${una(['Suelo técnico, falso techo y climatización.', 'Dos despachos, sala de reuniones y aseos.', 'Reformada, lista para entrar a trabajar.'])} ${una(['Fibra óptica en el edificio.', 'Edificio con control de acceso.', 'Ascensor y conserjería.'])}`);
  } else {
    partes.push(`Local a pie de calle de ${area} m², con ${entero(1, 3) === 1 ? 'un escaparate' : `${una(['dos', 'tres'])} escaparates`} y mucho paso de gente.`);
    partes.push('');
    partes.push(`${una(['Planta diáfana con aseo y almacén.', 'Altura libre de más de tres metros.', 'Salida de humos y licencia para hostelería.', 'Persiana motorizada y climatización.'])} ${una(['Listo para empezar a trabajar.', 'Admite muchos tipos de negocio.', 'Buena visibilidad desde la acera.'])}`);
  }
  return { partes, extras: [] };
}

function describirTerreno(c, z, area, vinedo, urbano) {
  const partes = [];
  if (vinedo) {
    partes.push(`Finca de ${area.toLocaleString('es-ES')} m² con viñedo en producción y una pequeña caseta de aperos.`);
    partes.push('');
    partes.push(`${una(['Acceso por camino asfaltado.', 'Agua de pozo y luz en la entrada.', 'Terreno en ligera pendiente, bien orientado.'])} Para quien quiere hacer su propio vino.`);
  } else if (urbano) {
    partes.push(`Parcela urbana y edificable de ${area.toLocaleString('es-ES')} m², ${una(['en una calle tranquila', 'con vistas abiertas', 'rodeada de casas unifamiliares'])}.`);
    partes.push('');
    partes.push(una(['Tiene agua, luz y alcantarillado a pie de parcela.', 'Proyecto básico para una casa de dos plantas, a disposición del comprador.', 'Topografía llana, fácil de construir.']));
  } else {
    partes.push(`Finca rústica de ${area.toLocaleString('es-ES')} m², ${una(['en una zona tranquila', 'con vistas abiertas', 'rodeada de campo'])}.`);
    partes.push('');
    partes.push(una(['Con olivos y almendros.', 'Acceso por camino y agua de pozo.', 'Para huerto, caballos o una casa de campo, según la normativa.']));
  }
  return { partes, extras: [] };
}

// ---------- Generación ----------

function redondearPrecio(precio, alquiler) {
  if (alquiler) return Math.max(400, Math.round(precio / 50) * 50);
  if (precio < 300000) return Math.round(precio / 1000) * 1000;
  return Math.round(precio / 5000) * 5000;
}

const MEZCLA = {
  centro: { Piso: 0.82, Local: 0.13, Casa: 0.05 },
  residencial: { Casa: 0.68, Piso: 0.24, Terreno: 0.08 },
  costa: { Casa: 0.52, Piso: 0.41, Terreno: 0.04, Local: 0.03 },
  pueblo: { Casa: 0.72, Piso: 0.14, Terreno: 0.1, Local: 0.04 },
};
const ESTILOS = {
  centro: { clasico: 0.6, moderno: 0.4 },
  residencial: { moderno: 0.7, clasico: 0.3 },
  costa: { costa: 0.62, moderno: 0.38 },
  pueblo: { rustico: 0.75, clasico: 0.25 },
};
const SUBTIPOS_PISO = {
  centro: { piso: 0.6, atico: 0.15, duplex: 0.08, loft: 0.06, estudio: 0.06, bajo: 0.05 },
  residencial: { piso: 0.5, atico: 0.2, bajo: 0.2, duplex: 0.1 },
  costa: { piso: 0.45, atico: 0.3, bajo: 0.15, duplex: 0.1 },
  pueblo: { piso: 0.7, atico: 0.3 },
};
const SUBTIPOS_CASA = {
  centro: { pueblo: 1 },
  residencial: { chalet: 0.5, villa: 0.3, adosada: 0.2 },
  costa: { villa: 0.65, chalet: 0.2, adosada: 0.15 },
  pueblo: { pueblo: 0.55, finca: 0.3, villa: 0.15 },
};
const SUPERFICIE = {
  piso: [70, 180], atico: [85, 220], duplex: [110, 220], loft: [70, 140], estudio: [35, 55], bajo: [90, 160],
  villa: [260, 700], chalet: [180, 420], adosada: [140, 240], pueblo: [110, 260], finca: [300, 800],
};

function estadoPara(tipo, subtipo) {
  if (tipo === 'Terreno') return segun({ 'En venta': 0.88, Reservada: 0.07, Vendida: 0.05 });
  if (subtipo === 'estudio' || subtipo === 'loft') return segun({ 'En venta': 0.45, 'Disponible para alquilar': 0.45, Reservada: 0.05, Alquilada: 0.05 });
  return segun({ 'En venta': 0.66, 'Disponible para alquilar': 0.24, Reservada: 0.05, Vendida: 0.03, Alquilada: 0.02 });
}

const titulosUsados = new Set();
function tituloUnico(base, zona, direccion, enElCampo = false) {
  // Las fincas y terrenos rústicos están fuera del pueblo: "cerca de Toledo", no "en el casco histórico"
  const lugar = enElCampo ? `cerca de ${zona.ciudad}` : `en ${zona.zona}`;
  const candidatos = enElCampo
    ? [`${base} ${lugar}`, `${base} a las afueras de ${zona.ciudad}`, `${base} en el término de ${zona.ciudad}`, `${base} en el campo de ${zona.ciudad}`]
    : [`${base} ${lugar}`, `${base} en ${conArticulo(direccion.street)}`, `${base} en ${conArticulo(direccion.street)}, ${zona.ciudad}`];
  for (const t of candidatos) {
    if (!titulosUsados.has(t.toLowerCase()) && t.length <= 120) {
      titulosUsados.add(t.toLowerCase());
      return t;
    }
  }
  const t = `${base} en ${conArticulo(direccion.street)} ${direccion.number}`;
  titulosUsados.add(t.toLowerCase());
  return t;
}

function crearCasa(zona, direccion) {
  const tipo = segun(MEZCLA[zona.tipo]);
  let estilo = segun(ESTILOS[zona.tipo]);
  if (zona.tipo === 'pueblo' && zona.costa && estilo === 'clasico') estilo = 'costa';

  let subtipo = tipo === 'Piso' ? segun(SUBTIPOS_PISO[zona.tipo]) : tipo === 'Casa' ? segun(SUBTIPOS_CASA[zona.tipo]) : tipo.toLowerCase();
  if (subtipo === 'loft' && !zona.loft) subtipo = 'piso';
  if (subtipo === 'finca' && !zona.region && zona.tipo !== 'pueblo') subtipo = 'villa';
  if (subtipo === 'finca' || (subtipo === 'pueblo' && zona.tipo === 'pueblo')) estilo = estilo === 'costa' ? 'costa' : 'rustico';

  const status = estadoPara(tipo, subtipo);
  const alquiler = status === 'Disponible para alquilar' || status === 'Alquilada';
  const oficina = tipo === 'Local' && probabilidad(0.35);
  // Terrenos: en zonas residenciales, parcelas urbanas; en el campo y la costa, fincas rústicas (algunas con viñedo)
  const urbano = tipo === 'Terreno' && (zona.tipo === 'residencial' || (zona.tipo === 'costa' && probabilidad(0.6)));
  const vinedo = tipo === 'Terreno' && !urbano && probabilidad(0.45);

  let area;
  if (tipo === 'Local') area = entero(50, 380);
  else if (tipo === 'Terreno') area = urbano ? Math.round(entre(600, 2500) / 10) * 10 : Math.round(entre(5000, 60000) / 100) * 100;
  else area = entero(...SUPERFICIE[subtipo]);

  // Dormitorios y baños según los metros
  const esCasa = tipo === 'Casa';
  const dorm = Math.min(esCasa ? 8 : 5, Math.max(esCasa ? 2 : 1, Math.round(area / (esCasa ? 58 : 40))));
  const ban = Math.min(esCasa ? 7 : 4, Math.max(1, Math.round(area / (esCasa ? 75 : 65))));

  // Precio
  let porMetro = alquiler ? zona.alquiler : zona.venta;
  if (tipo === 'Terreno') porMetro = urbano ? zona.venta * entre(0.08, 0.16) : entre(4, 18) * (zona.region === 'baleares' ? 2.5 : 1);
  if (tipo === 'Local') porMetro *= entre(0.55, 0.85);
  if (esCasa && alquiler) porMetro *= 0.8;
  if (subtipo === 'atico') porMetro *= 1.15;
  if (subtipo === 'villa' && zona.tipo === 'costa') porMetro *= 1.1;
  if (subtipo === 'finca') porMetro *= 0.6;
  const price = redondearPrecio(area * porMetro * entre(0.85, 1.22), alquiler);

  // Título
  let base;
  if (tipo === 'Local') base = una(oficina ? TITULOS.oficina : TITULOS.local);
  else if (tipo === 'Terreno') base = una(vinedo ? TITULOS.vinedo : urbano ? TITULOS.terreno : TITULOS.rustico);
  else if (subtipo === 'finca') base = una(TITULOS.finca[zona.region || 'otra']);
  else base = una(TITULOS[subtipo][estilo] || TITULOS[subtipo].moderno);
  const title = tituloUnico(base, zona, direccion, subtipo === 'finca' || (tipo === 'Terreno' && !urbano));

  // Descripción
  let texto;
  if (tipo === 'Piso') texto = describirPiso(null, zona, estilo, subtipo, area, dorm, ban);
  else if (tipo === 'Casa') texto = describirCasa(null, zona, estilo, subtipo, area, dorm, ban);
  else if (tipo === 'Local') texto = describirLocal(null, zona, area, oficina);
  else texto = describirTerreno(null, zona, area, vinedo, urbano);
  const parrafos = [];
  let actual = [];
  for (const p of texto.partes) {
    if (p === '') {
      parrafos.push(actual.join(' '));
      actual = [];
    } else {
      actual.push(p);
    }
  }
  actual.push(una(zona.nota));
  if (alquiler && tipo !== 'Terreno') actual.push(textoAlquiler(tipo));
  parrafos.push(actual.join(' '));
  const description = parrafos.map(primeraMayuscula).join('\n\n');

  // Fotos: la primera es la portada
  let plan;
  if (tipo === 'Piso') {
    const portada = subtipo === 'atico' || (estilo === 'costa' && probabilidad(0.4)) ? ['terraza'] : ['salon'];
    plan = [portada, portada[0] === 'terraza' ? ['salon'] : ['comedor', 'salon'], ['cocina'], ['dormitorio'], ['bano']];
    if (probabilidad(0.5)) plan.push(['dormitorio']);
    if (estilo !== 'rustico' && estilo !== 'costa' && probabilidad(0.4)) plan.push(['fachada-piso']);
  } else if (tipo === 'Casa') {
    plan = [['exterior-casa'], ['salon'], ['cocina'], ['dormitorio'], ['bano']];
    if (estilo === 'costa' || estilo === 'moderno') plan.push(['terraza']);
    if (probabilidad(0.5)) plan.push(['comedor', 'dormitorio']);
  } else if (tipo === 'Local') {
    plan = oficina ? [['local-oficina'], ['local-oficina'], ['local']] : [['local'], ['local'], ['local-oficina']];
  } else {
    plan = [['terreno'], ['terreno'], ['terreno']];
  }
  const fotosCasa = galeria(plan, estilo);

  return {
    title,
    description,
    type: tipo,
    status,
    price,
    area,
    image: fotosCasa.join(' '),
    images: fotosCasa,
    address: { ...direccion, street: capitalizar(direccion.street) },
  };
}

// Las 12 casas escritas a mano: su foto en portada y varias más de su estilo
function completarManual(casa) {
  const estilo = casa.type === 'Casa' ? (casa.price > 900000 ? 'moderno' : 'rustico') : /vistas al mar|playa/i.test(casa.description) ? 'costa' : 'clasico';
  const extra = galeria([['salon'], ['cocina'], ['dormitorio'], ['bano']], estilo);
  const lista = [casa.image, ...extra];
  return { ...casa, image: lista.join(' '), images: lista, address: { ...casa.address, city: normalizarCiudad(casa.address.city) } };
}

async function main() {
  const archivoDirecciones = ruta('./datos/direcciones.json');
  let direcciones;
  if (args.includes('--completar-direcciones') && existsSync(archivoDirecciones)) {
    console.log('Buscando más direcciones para las zonas que tienen pocas…');
    direcciones = await buscarDirecciones(JSON.parse(readFileSync(archivoDirecciones, 'utf8')));
    writeFileSync(archivoDirecciones, JSON.stringify(direcciones, null, 1) + '\n');
  } else if (!buscar && existsSync(archivoDirecciones)) {
    direcciones = JSON.parse(readFileSync(archivoDirecciones, 'utf8'));
    console.log('Direcciones: scripts/datos/direcciones.json');
  } else {
    console.log('Buscando direcciones reales en OpenStreetMap (Photon). Tarda unos minutos…');
    direcciones = await buscarDirecciones();
    writeFileSync(archivoDirecciones, JSON.stringify(direcciones, null, 1) + '\n');
  }

  // Reparto de las casas entre zonas según su peso, sin pasar de las direcciones encontradas
  const generadas = TOTAL - manuales.length;
  const pesoTotal = ZONAS.reduce((s, z) => s + z.n, 0);
  const cupos = ZONAS.map((z) => Math.min((direcciones[z.id] || []).length, Math.round((z.n * generadas) / pesoTotal)));
  let faltan = generadas - cupos.reduce((a, b) => a + b, 0);
  // Si faltan, se toman de las zonas con más direcciones de sobra
  while (faltan > 0) {
    let mejor = -1;
    let sobra = 0;
    ZONAS.forEach((z, i) => {
      const s = (direcciones[z.id] || []).length - cupos[i];
      if (s > sobra) {
        sobra = s;
        mejor = i;
      }
    });
    if (mejor < 0) break;
    cupos[mejor]++;
    faltan--;
  }
  while (faltan < 0) {
    const i = cupos.indexOf(Math.max(...cupos));
    cupos[i]--;
    faltan++;
  }

  const casas = [];
  const usadas = new Set(manuales.map((c) => `${c.address.street}|${c.address.number}|${c.address.city}`.toLowerCase()));
  ZONAS.forEach((zona, i) => {
    const disponibles = barajar(direcciones[zona.id] || []).filter((d) => !usadas.has(`${d.street}|${d.number}|${d.city}`.toLowerCase()));
    for (const direccion of disponibles.slice(0, cupos[i])) {
      usadas.add(`${direccion.street}|${direccion.number}|${direccion.city}`.toLowerCase());
      casas.push(crearCasa(zona, direccion));
    }
  });

  // Las casas en venta más caras llevan de portada las fachadas elegidas a mano (salen en el carrusel del inicio)
  const caras = casas.filter((c) => c.type === 'Casa' && c.status === 'En venta').sort((a, b) => b.price - a.price);
  PORTADAS.forEach((id, i) => {
    const casa = caras[i];
    if (!casa) return;
    casa.images = [URL_UNSPLASH + id, ...casa.images.slice(1)];
    casa.image = casa.images.join(' ');
  });

  // Orden de subida: mezcladas, para que las "recién llegadas" sean de sitios distintos.
  // Las manuales van al final: son las más recientes y salen en el inicio
  const resultado = [...barajar(casas), ...manuales.map(completarManual)];
  writeFileSync(ruta('./casas.json'), JSON.stringify(resultado, null, 2) + '\n');

  const cuenta = (clave) => resultado.reduce((m, c) => ((m[c[clave]] = (m[c[clave]] || 0) + 1), m), {});
  console.log(`\nscripts/casas.json: ${resultado.length} casas`);
  console.log('Por tipo:', cuenta('type'));
  console.log('Por estado:', cuenta('status'));
  console.log('Ciudades:', new Set(resultado.map((c) => c.address.city)).size);
  const numFotos = resultado.map((c) => c.images.length);
  console.log(`Fotos por casa: entre ${Math.min(...numFotos)} y ${Math.max(...numFotos)}. Fotos distintas usadas: ${usos.size} de ${fotos.length}`);
  if (resultado.length < TOTAL) console.log(`Aviso: solo se han podido generar ${resultado.length} (faltan direcciones).`);
}

await main();
