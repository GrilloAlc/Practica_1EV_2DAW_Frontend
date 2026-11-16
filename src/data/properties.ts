// Fotos de ejemplo (aleatorias, no son casas reales).
// Para poner las tuyas, cambia cada foto('...') por una dirección web ('https://.../casa.jpg')
// o por un archivo de la carpeta public ('/img/casa.jpg').
const foto = (nombre: string) => `https://picsum.photos/seed/${nombre}/800/600`;

export interface Property {
  id: string;
  operation: string; // 'Venta' o 'Alquiler'
  type: string; // 'Piso' o 'Casa'
  city: string;
  title: string;
  price: number;
  area: number;
  rooms: number;
  bathrooms: number;
  floor: string;
  active: boolean;
  images: string[]; // la primera es la foto principal
}

export const properties: Property[] = [
  { id: '1', operation: 'Venta', type: 'Piso', city: 'Madrid', title: 'Piso luminoso en el centro', price: 325000, area: 98, rooms: 3, bathrooms: 2, floor: '4ª', active: true, images: [foto('p1a'), foto('p1b'), foto('p1c')] },
  { id: '2', operation: 'Venta', type: 'Casa', city: 'Madrid', title: 'Casa con jardín privado', price: 485000, area: 176, rooms: 4, bathrooms: 3, floor: '-', active: true, images: [foto('p2a'), foto('p2b'), foto('p2c')] },
  { id: '3', operation: 'Venta', type: 'Piso', city: 'Madrid', title: 'Ático con terraza', price: 410000, area: 112, rooms: 3, bathrooms: 2, floor: '8ª', active: true, images: [foto('p3a'), foto('p3b'), foto('p3c')] },
  { id: '4', operation: 'Venta', type: 'Piso', city: 'Barcelona', title: 'Apartamento reformado', price: 245000, area: 74, rooms: 2, bathrooms: 1, floor: '2ª', active: true, images: [foto('p4a'), foto('p4b'), foto('p4c')] },
  { id: '5', operation: 'Venta', type: 'Casa', city: 'Valencia', title: 'Chalet en zona residencial', price: 595000, area: 220, rooms: 5, bathrooms: 3, floor: '-', active: true, images: [foto('p5a'), foto('p5b'), foto('p5c')] },
  { id: '6', operation: 'Venta', type: 'Piso', city: 'Madrid', title: 'Estudio cerca del parque', price: 185000, area: 48, rooms: 1, bathrooms: 1, floor: '1ª', active: true, images: [foto('p6a'), foto('p6b'), foto('p6c')] },
  { id: '7', operation: 'Alquiler', type: 'Piso', city: 'Madrid', title: 'Piso amueblado junto al metro', price: 1100, area: 70, rooms: 2, bathrooms: 1, floor: '3ª', active: true, images: [foto('p7a'), foto('p7b'), foto('p7c')] },
  { id: '8', operation: 'Alquiler', type: 'Piso', city: 'Barcelona', title: 'Loft diáfano en el Born', price: 1450, area: 65, rooms: 1, bathrooms: 1, floor: '5ª', active: true, images: [foto('p8a'), foto('p8b'), foto('p8c')] },
  { id: '9', operation: 'Alquiler', type: 'Casa', city: 'Valencia', title: 'Casa adosada con patio', price: 1300, area: 130, rooms: 3, bathrooms: 2, floor: '-', active: true, images: [foto('p9a'), foto('p9b'), foto('p9c')] },
  { id: '10', operation: 'Venta', type: 'Piso', city: 'Valencia', title: 'Piso con vistas al mar', price: 360000, area: 95, rooms: 3, bathrooms: 2, floor: '6ª', active: true, images: [foto('p10a'), foto('p10b'), foto('p10c')] },
  { id: '11', operation: 'Venta', type: 'Casa', city: 'Barcelona', title: 'Casa de pueblo rehabilitada', price: 520000, area: 190, rooms: 4, bathrooms: 2, floor: '-', active: false, images: [foto('p11a'), foto('p11b'), foto('p11c')] },
  { id: '12', operation: 'Alquiler', type: 'Piso', city: 'Madrid', title: 'Dúplex con terraza', price: 1800, area: 120, rooms: 3, bathrooms: 2, floor: '7ª', active: true, images: [foto('p12a'), foto('p12b'), foto('p12c')] },
];
