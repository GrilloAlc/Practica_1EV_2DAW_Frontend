// Datos falsos para usar mientras el backend no funcione (ver USE_FAKE_DATA en api/client.ts)
import type { Message, Property, StatusChange, Ticket, User } from '../types';

// Fotos de Unsplash de cada casa (nombre → id de la foto)
const PHOTO_IDS: Record<string, string> = {
  'piso-luminoso-centro': '1493809842364-78817add7ffb',
  'casa-jardin-privado': '1570129477492-45c003edd2be',
  'atico-terraza': '1560448204-e02f11c3d0e2',
  'apartamento-reformado': '1484154218962-a197022b5858',
  'chalet-zona-residencial': '1605276374104-dee2a0ed3cd6',
  'estudio-cerca-parque': '1502672260266-1c1ef2d93688',
  'piso-amueblado-metro': '1522708323590-d24dbb6b0267',
  'loft-born': '1600607687939-ce8a6c25118c',
  'casa-adosada-patio': '1600566753190-17f0baa2a6c3',
  'piso-vistas-mar': '1545324418-cc1a3fa10c00',
  'casa-pueblo-rehabilitada': '1568605114967-8130f3a36994',
  'duplex-terraza': '1598928506311-c55ded91a20c'
};
const photo = (name: string) => `https://images.unsplash.com/photo-${PHOTO_IDS[name]}`;

// Cada casa con su dirección (calle real, código postal y coordenadas) y su propia descripción
export const fakeProperties: Property[] = [
  {
    _id: '1', title: 'Piso luminoso en el centro', type: 'Piso', status: 'En venta', price: 325000, area: 98, image: photo('piso-luminoso-centro'), isActive: true,
    address: { street: 'Calle de Atocha', number: '34', city: 'Madrid', province: 'Madrid', postalCode: '28012', coordinates: { lat: 40.4123, lng: -3.6997 } },
    description: 'Tercera planta con ascensor y cuatro balcones a la calle. Entra sol toda la mañana en el salón y en los dos dormitorios.\n\nSuelos de tarima, techos altos y cocina independiente. A cinco minutos andando de la Puerta del Sol.',
  },
  {
    _id: '2', title: 'Casa con jardín privado', type: 'Casa', status: 'En venta', price: 485000, area: 176, image: photo('casa-jardin-privado'), isActive: true,
    address: { street: 'Calle de Arturo Soria', number: '210', city: 'Madrid', province: 'Madrid', postalCode: '28043', coordinates: { lat: 40.4561, lng: -3.6531 } },
    description: 'Casa de dos plantas con un jardín de 120 m² y árboles ya crecidos. Cuatro dormitorios, tres baños y un garaje para dos coches.\n\nCalle tranquila, con colegios y el metro a diez minutos.',
  },
  {
    _id: '3', title: 'Ático con terraza', type: 'Piso', status: 'En venta', price: 410000, area: 112, image: photo('atico-terraza'), isActive: true,
    address: { street: 'Calle de Velázquez', number: '57', city: 'Madrid', province: 'Madrid', postalCode: '28001', coordinates: { lat: 40.4297, lng: -3.6836 } },
    description: 'Última planta en el barrio de Salamanca con una terraza de 35 m² que da a los tejados. El salón se abre por completo a la terraza.\n\nDos dormitorios, dos baños y portero físico.',
  },
  {
    _id: '4', title: 'Apartamento reformado', type: 'Piso', status: 'En venta', price: 245000, area: 74, image: photo('apartamento-reformado'), isActive: true,
    address: { street: 'Carrer de Sants', number: '120', city: 'Barcelona', province: 'Barcelona', postalCode: '08028', coordinates: { lat: 41.3757, lng: 2.1339 } },
    description: 'Reformado entero el año pasado: instalación eléctrica, ventanas con doble cristal y cocina abierta al salón.\n\nDos dormitorios y un baño con plato de ducha. Listo para entrar a vivir.',
  },
  {
    _id: '5', title: 'Chalet en zona residencial', type: 'Casa', status: 'En venta', price: 595000, area: 220, image: photo('chalet-zona-residencial'), isActive: true,
    address: { street: 'Carrer de Sant Sebastià', number: '18', city: 'Rocafort', province: 'Valencia', postalCode: '46111', coordinates: { lat: 39.5308, lng: -0.4103 } },
    description: 'Chalet independiente en una parcela de 600 m² con piscina y porche. Cinco dormitorios, uno de ellos en la planta baja.\n\nA quince minutos de Valencia en coche y con el metro en el pueblo.',
  },
  {
    _id: '6', title: 'Estudio cerca del parque', type: 'Piso', status: 'En venta', price: 185000, area: 48, image: photo('estudio-cerca-parque'), isActive: true,
    address: { street: 'Calle de Alfonso XII', number: '12', city: 'Madrid', province: 'Madrid', postalCode: '28014', coordinates: { lat: 40.4185, lng: -3.6882 } },
    description: 'Estudio exterior frente al Retiro, con la zona de dormir separada por una puerta corredera.\n\nCocina equipada y armarios empotrados. Buena opción como primera casa o para alquilar.',
  },
  {
    _id: '7', title: 'Piso amueblado junto al metro', type: 'Piso', status: 'Disponible para alquilar', price: 1100, area: 70, image: photo('piso-amueblado-metro'), isActive: true,
    address: { street: 'Calle de Bravo Murillo', number: '150', city: 'Madrid', province: 'Madrid', postalCode: '28020', coordinates: { lat: 40.4562, lng: -3.7039 } },
    description: 'Se alquila amueblado y con electrodomésticos. Dos dormitorios, salón con balcón y calefacción central.\n\nLa boca de metro de Estrecho está a pocos pasos del portal.',
  },
  {
    _id: '8', title: 'Loft diáfano en el Born', type: 'Piso', status: 'Disponible para alquilar', price: 1450, area: 65, image: photo('loft-born'), isActive: true,
    address: { street: 'Carrer de la Princesa', number: '30', city: 'Barcelona', province: 'Barcelona', postalCode: '08003', coordinates: { lat: 41.3856, lng: 2.1806 } },
    description: 'Antiguo taller convertido en loft, con vigas de madera y cuatro metros de altura. Todo es un espacio abierto, salvo el baño.\n\nA un paso del Parc de la Ciutadella y del mercado de Santa Caterina.',
  },
  {
    _id: '9', title: 'Casa adosada con patio', type: 'Casa', status: 'Disponible para alquilar', price: 1300, area: 130, image: photo('casa-adosada-patio'), isActive: true,
    address: { street: 'Carrer de Sueca', number: '40', city: 'Valencia', province: 'Valencia', postalCode: '46006', coordinates: { lat: 39.4618, lng: -0.3741 } },
    description: 'Casa adosada en Russafa con un patio trasero donde cabe una mesa para seis. Tres dormitorios en la planta de arriba.\n\nSe aceptan mascotas. Contrato mínimo de un año.',
  },
  {
    _id: '10', title: 'Piso con vistas al mar', type: 'Piso', status: 'En venta', price: 360000, area: 95, image: photo('piso-vistas-mar'), isActive: true,
    address: { street: 'Passeig de Neptú', number: '20', city: 'Valencia', province: 'Valencia', postalCode: '46011', coordinates: { lat: 39.4629, lng: -0.3238 } },
    description: 'Primera línea de la playa de la Malva-rosa. Desde el salón y el dormitorio principal se ve el mar.\n\nTres dormitorios, terraza acristalada y plaza de garaje incluida en el precio.',
  },
  {
    _id: '11', title: 'Casa de pueblo rehabilitada', type: 'Casa', status: 'En venta', price: 520000, area: 190, image: photo('casa-pueblo-rehabilitada'), isActive: false,
    address: { street: 'Carrer Major', number: '8', city: "Sant Sadurní d'Anoia", province: 'Barcelona', postalCode: '08770', coordinates: { lat: 41.4251, lng: 1.7858 } },
    description: 'Casa de piedra del siglo XIX rehabilitada respetando muros y bóvedas. Bodega en el sótano y patio con una parra.\n\nRodeada de viñedos, a cuarenta minutos de Barcelona.',
  },
  {
    _id: '12', title: 'Dúplex con terraza', type: 'Piso', status: 'Disponible para alquilar', price: 1800, area: 120, image: photo('duplex-terraza'), isActive: true,
    address: { street: 'Calle de Ponzano', number: '40', city: 'Madrid', province: 'Madrid', postalCode: '28003', coordinates: { lat: 40.4398, lng: -3.6992 } },
    description: 'Dúplex en Chamberí: abajo, salón y cocina; arriba, dos dormitorios y una terraza de 20 m².\n\nSin muebles. Calle llena de restaurantes y a dos minutos del metro de Ríos Rosas.',
  },
];

export const fakeUsers: (User & { password: string })[] = [
  { _id: '1', name: 'María Ruiz', email: 'maria@correo.com', password: 'maria1234', role: 'CLIENTE', phone: '600000000', isActive: true },
  { _id: '2', name: 'Carlos Soto', email: 'carlos@correo.com', password: 'carlos1234', role: 'CLIENTE', isActive: true },
  { _id: '3', name: 'Ana García', email: 'ana@inmobiliaria.es', password: 'ana12345', role: 'AGENTE', isActive: true },
  { _id: '4', name: 'Luis Pérez', email: 'luis@inmobiliaria.es', password: 'luis12345', role: 'AGENTE', isActive: true },
  { _id: '5', name: 'Admin', email: 'admin@inmobiliaria.es', password: 'admin1234', role: 'ADMIN', isActive: true },
  { _id: '6', name: 'Laura Martín', email: 'laura@correo.com', password: 'laura1234', role: 'CLIENTE', isActive: true },
  { _id: '7', name: 'Pedro Sánchez', email: 'pedro@correo.com', password: 'pedro1234', role: 'CLIENTE', isActive: true },
  { _id: '8', name: 'Lucía Fernández', email: 'lucia@correo.com', password: 'lucia1234', role: 'CLIENTE', isActive: true },
  { _id: '9', name: 'Javier Gómez', email: 'javier@correo.com', password: 'javier1234', role: 'CLIENTE', isActive: true },
  { _id: '10', name: 'Elena Torres', email: 'elena@correo.com', password: 'elena1234', role: 'CLIENTE', isActive: true },
  { _id: '11', name: 'Sergio Navarro', email: 'sergio@correo.com', password: 'sergio1234', role: 'CLIENTE', isActive: true },
  { _id: '12', name: 'Marta Díaz', email: 'marta@inmobiliaria.es', password: 'marta1234', role: 'AGENTE', isActive: true },
  { _id: '13', name: 'Pablo Romero', email: 'pablo@inmobiliaria.es', password: 'pablo1234', role: 'AGENTE', isActive: true },
  { _id: '14', name: 'Carmen Vega', email: 'carmen@inmobiliaria.es', password: 'carmen1234', role: 'AGENTE', isActive: true },
  { _id: '15', name: 'Raúl Ortega', email: 'raul@inmobiliaria.es', password: 'raul12345', role: 'ADMIN', isActive: true },
];

const maria = { _id: '1', name: 'María Ruiz' };
const carlos = { _id: '2', name: 'Carlos Soto' };
const ana = { _id: '3', name: 'Ana García' };
const luis = { _id: '4', name: 'Luis Pérez' };

export const fakeTickets: Ticket[] = [
  {
    _id: '1', code: 'TK-1048', subject: 'Consulta sobre piso centro', category: 'CONSULTA_PROPIEDAD', priority: 3, status: 'ABIERTO',
    customer: maria, agent: ana, reopenRequested: false, createdAt: '2025-05-12T10:32:00', updatedAt: '2025-05-12T12:14:00',
    description: 'Hola, me gustaría saber si el piso luminoso del centro sigue disponible y si sería posible concertar una visita esta semana.',
  },
  {
    _id: '2', code: 'TK-1036', subject: 'Visita a un chalet residencial', category: 'SOLICITUD_VISITA', priority: 2, status: 'EN_CURSO',
    customer: carlos, agent: ana, reopenRequested: false, createdAt: '2025-05-09T09:10:00', updatedAt: '2025-05-09T12:40:00',
    description: 'Quiero visitar el chalet en zona residencial el próximo sábado.',
  },
  {
    _id: '3', code: 'TK-1019', subject: 'Documentación compraventa', category: 'DOCUMENTACION', priority: 1, status: 'RESUELTO',
    customer: maria, agent: luis, reopenRequested: false, createdAt: '2025-04-28T17:45:00', updatedAt: '2025-04-30T10:05:00',
    description: '¿Qué documentos necesito para la compraventa?',
  },
  {
    _id: '4', code: 'TK-0987', subject: 'Información sobre alquiler', category: 'CONSULTA_PROPIEDAD', priority: 2, status: 'CERRADO',
    customer: maria, agent: luis, reopenRequested: false, createdAt: '2025-04-15T11:00:00', updatedAt: '2025-04-18T16:30:00',
    description: '¿Se admiten mascotas en el piso del metro?',
  },
];

export const fakeMessages: (Message & { ticket: string })[] = [
  {
    _id: '1', ticket: '1', createdAt: '2025-05-12T12:14:00', author: { ...ana, role: 'AGENTE' },
    body: 'Hola María, la propiedad sigue disponible. Podemos organizar una visita el jueves por la tarde o el viernes por la mañana. ¿Qué opción te viene mejor?',
  },
  {
    _id: '2', ticket: '3', createdAt: '2025-04-29T09:20:00', author: { ...luis, role: 'AGENTE' },
    body: 'Te hemos enviado por correo la lista completa. Dime si tienes dudas.',
  },
];


// Cambios de estado de cada ticket (en el backend se guardan solos al cambiar el estado)
export const fakeHistory: (StatusChange & { ticket: string })[] = [
  { _id: '1', ticket: '1', oldStatus: null, newStatus: 'ABIERTO', changedAt: '2025-05-12T10:32:00', changedBy: maria },
  { _id: '2', ticket: '2', oldStatus: null, newStatus: 'ABIERTO', changedAt: '2025-05-09T09:10:00', changedBy: carlos },
  { _id: '3', ticket: '2', oldStatus: 'ABIERTO', newStatus: 'EN_CURSO', changedAt: '2025-05-09T12:40:00', changedBy: ana },
  { _id: '4', ticket: '3', oldStatus: null, newStatus: 'ABIERTO', changedAt: '2025-04-28T17:45:00', changedBy: maria },
  { _id: '5', ticket: '3', oldStatus: 'ABIERTO', newStatus: 'EN_CURSO', changedAt: '2025-04-29T09:15:00', changedBy: luis },
  { _id: '6', ticket: '3', oldStatus: 'EN_CURSO', newStatus: 'RESUELTO', changedAt: '2025-04-30T10:05:00', changedBy: luis },
  { _id: '7', ticket: '4', oldStatus: null, newStatus: 'ABIERTO', changedAt: '2025-04-15T11:00:00', changedBy: maria },
  { _id: '8', ticket: '4', oldStatus: 'ABIERTO', newStatus: 'RESUELTO', changedAt: '2025-04-16T13:20:00', changedBy: luis },
  { _id: '9', ticket: '4', oldStatus: 'RESUELTO', newStatus: 'CERRADO', changedAt: '2025-04-18T16:30:00', changedBy: maria },
];


// Usuario con sesión iniciada (en el backend se saca del token)
export function getLoggedUser(): User {
  return JSON.parse(localStorage.getItem('user')!);
}

// Devuelve una página de la lista, como hace el backend con page y limit
export function pageOf<T>(list: T[], params: { page?: number | string; limit?: number | string }, defaultLimit: number) {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || defaultLimit;
  return list.slice((page - 1) * limit, page * limit);
}
