// Dirección real elegida de las sugerencias
export interface FoundAddress {
  street: string;
  number: string;
  postalCode: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
}

export function formatAddress(a: FoundAddress) {
  return `${a.street}${a.number ? ' ' + a.number : ''}, ${a.postalCode ? a.postalCode + ' ' : ''}${a.city} (${a.province})`;
}


// Las dos primeras cifras del código postal indican la provincia
const PROVINCES: Record<string, string> = {
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

export function provinceFromPostalCode(postalCode: string) {
  return PROVINCES[postalCode.slice(0, 2)] || '';
}

// Respuesta de Photon (buscador de direcciones de OpenStreetMap): https://photon.komoot.io
interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    countrycode?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    locality?: string;
    district?: string;
    county?: string;
    state?: string;
  };
}

// Solo España: mismos límites de latitud y longitud que valida el backend
const SPAIN_BBOX = '-18,27,5,44';

function toAddress(feature: PhotonFeature): FoundAddress | null {
  const p = feature.properties;
  const street = p.street || p.name;
  const city = p.city || p.locality || p.district;
  if (p.countrycode !== 'ES' || !street || !city) return null;
  const [lng, lat] = feature.geometry.coordinates;
  return {
    street,
    number: p.housenumber || '',
    postalCode: p.postcode || '',
    city,
    province: provinceFromPostalCode(p.postcode || '') || p.state || city,
    lat,
    lng,
  };
}

// Busca direcciones reales en España a partir de un texto.
// Con "near" salen antes los resultados cercanos a ese punto.
export async function searchAddresses(text: string, signal?: AbortSignal, near?: { lat: number; lng: number }) {
  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=${near ? 15 : 8}&bbox=${SPAIN_BBOX}`;
  if (near) url += `&lat=${near.lat}&lon=${near.lng}`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  return (data.features as PhotonFeature[]).map(toAddress).filter((a): a is FoundAddress => a !== null);
}

// Quita tildes, mayúsculas y palabras como "calle" o "de" para comparar nombres de calle
// ("Calle de Alcalá" y "Calle Alcalá" son la misma)
function simplify(text: string) {
  const skip = ['calle', 'c', 'avenida', 'av', 'avda', 'plaza', 'pl', 'paseo', 'de', 'del', 'la', 'el', 'los', 'las', 'en', "d'", 'carrer', 'rua'];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !skip.includes(w))
    .join(' ');
}

// Busca el portal exacto (calle + número) para colocar bien el punto en el mapa.
// Devuelve null si OpenStreetMap no tiene ese número en esa calle.
export async function findHouse(a: FoundAddress, signal?: AbortSignal) {
  const number = a.number.trim().toLowerCase();
  if (!number) return null;
  // Sin código postal: una calle larga tiene varios y el de la calle elegida puede no ser el del portal
  const list = await searchAddresses(`${a.street} ${number}, ${a.city}`, signal, a);
  return list.find((b) =>
    b.number.toLowerCase() === number &&
    simplify(b.street) === simplify(a.street) &&
    b.city === a.city,
  ) || null;
}
