// Ciudades para las sugerencias del buscador.
// El backend filtra por ciudad exacta ("Málaga" no es "malaga"), así que lo que se escribe se convierte al
// nombre con el que se guardan las casas: sin importar mayúsculas ni tildes y con algunos nombres alternativos.

export const CITIES = [
  'A Coruña', 'Adeje', 'Albacete', 'Alcobendas', 'Alicante', 'Almería', 'Altea', 'Andratx', 'Ávila', 'Badajoz',
  'Barcelona', 'Begur', 'Benahavís', 'Bilbao', 'Burgos', 'Cáceres', 'Cadaqués', 'Cádiz', 'Castelldefels',
  'Castellón de la Plana', 'Ciudad Real', 'Ciutadella de Menorca', 'Córdoba', 'Cuenca', 'Dénia', 'Estepona', 'Getxo',
  'Gijón', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca', 'Ibiza', 'Jaén', 'Jávea', 'Las Palmas de Gran Canaria',
  'Las Rozas de Madrid', 'León', 'Lleida', 'Logroño', 'Lugo', 'Madrid', 'Majadahonda', 'Málaga', 'Marbella', 'Mijas',
  'Murcia', 'Nerja', 'Ourense', 'Oviedo', 'Palencia', 'Palma', 'Pamplona', 'Pollença', 'Pontevedra', 'Pozuelo de Alarcón',
  'Salamanca', 'San Roque', 'San Sebastián', 'Santa Cruz de Tenerife', 'Santa Eulària des Riu', 'Santander', 'Segovia',
  'Sevilla', 'Sitges', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vejer de la Frontera', 'Vigo',
  'Vitoria-Gasteiz', 'Zamora', 'Zaragoza',
];

// Otros nombres con los que se busca una ciudad (o un barrio que pertenece a otro municipio)
const ALIASES: Record<string, string> = {
  'la coruna': 'A Coruña',
  coruna: 'A Coruña',
  alacant: 'Alicante',
  castellon: 'Castellón de la Plana',
  ciutadella: 'Ciutadella de Menorca',
  donostia: 'San Sebastián',
  'donostia san sebastian': 'San Sebastián',
  eivissa: 'Ibiza',
  gerona: 'Girona',
  lerida: 'Lleida',
  'la moraleja': 'Alcobendas',
  moraleja: 'Alcobendas',
  'las palmas': 'Las Palmas de Gran Canaria',
  'las rozas': 'Las Rozas de Madrid',
  'palma de mallorca': 'Palma',
  pozuelo: 'Pozuelo de Alarcón',
  'puerto banus': 'Marbella',
  'nueva andalucia': 'Marbella',
  'santa eulalia': 'Santa Eulària des Riu',
  'santa eularia': 'Santa Eulària des Riu',
  sotogrande: 'San Roque',
  tenerife: 'Santa Cruz de Tenerife',
  valencia: 'Valencia',
  vejer: 'Vejer de la Frontera',
  vitoria: 'Vitoria-Gasteiz',
  xabia: 'Jávea',
};

// "Málaga" → "malaga"; "Donostia / San Sebastián" → "donostia san sebastian"
function simplify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const BY_NAME = new Map(CITIES.map((c) => [simplify(c), c]));
const SMALL_WORDS = ['de', 'del', 'la', 'las', 'los', 'el', 'y', 'des', 'a'];

// Nombre de la ciudad tal y como está guardado. Si no se conoce y está escrito todo en minúsculas,
// se pone mayúscula al inicio de cada palabra; si ya trae mayúsculas ("Sant Sadurní d'Anoia"), se deja igual
export function canonicalCity(input: string) {
  const text = input.trim().replace(/\s+/g, ' ');
  if (!text) return '';
  const key = simplify(text);
  const known = ALIASES[key] || BY_NAME.get(key);
  if (known) return known;
  if (text !== text.toLowerCase()) return text;
  return text
    .split(' ')
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && SMALL_WORDS.includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
