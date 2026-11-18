// Datos falsos para usar mientras el backend no funcione (ver USE_FAKE_DATA en api/client.ts)
import type { Message, Property, Ticket, User } from '../types';

const photo = (name: string) => `https://picsum.photos/seed/${name}/800/600`;

const description =
  'Vivienda amplia y luminosa situada en una zona céntrica y bien comunicada. Cuenta con salón comedor, cocina independiente y dormitorios exteriores.';

const madrid = { street: 'Calle Mayor', number: '10', city: 'Madrid', province: 'Madrid', postalCode: '28013' };
const barcelona = { street: 'Carrer de Mallorca', number: '25', city: 'Barcelona', province: 'Barcelona', postalCode: '08008' };
const valencia = { street: 'Calle de Colón', number: '5', city: 'Valencia', province: 'Valencia', postalCode: '46004' };

export const fakeProperties: Property[] = [
  { _id: '1', title: 'Piso luminoso en el centro', description, type: 'Piso', status: 'En venta', price: 325000, area: 98, image: photo('p1a'), isActive: true, address: madrid },
  { _id: '2', title: 'Casa con jardín privado', description, type: 'Casa', status: 'En venta', price: 485000, area: 176, image: photo('p2a'), isActive: true, address: madrid },
  { _id: '3', title: 'Ático con terraza', description, type: 'Piso', status: 'En venta', price: 410000, area: 112, image: photo('p3a'), isActive: true, address: madrid },
  { _id: '4', title: 'Apartamento reformado', description, type: 'Piso', status: 'En venta', price: 245000, area: 74, image: photo('p4a'), isActive: true, address: barcelona },
  { _id: '5', title: 'Chalet en zona residencial', description, type: 'Casa', status: 'En venta', price: 595000, area: 220, image: photo('p5a'), isActive: true, address: valencia },
  { _id: '6', title: 'Estudio cerca del parque', description, type: 'Piso', status: 'En venta', price: 185000, area: 48, image: photo('p6a'), isActive: true, address: madrid },
  { _id: '7', title: 'Piso amueblado junto al metro', description, type: 'Piso', status: 'Disponible para alquilar', price: 1100, area: 70, image: photo('p7a'), isActive: true, address: madrid },
  { _id: '8', title: 'Loft diáfano en el Born', description, type: 'Piso', status: 'Disponible para alquilar', price: 1450, area: 65, image: photo('p8a'), isActive: true, address: barcelona },
  { _id: '9', title: 'Casa adosada con patio', description, type: 'Casa', status: 'Disponible para alquilar', price: 1300, area: 130, image: photo('p9a'), isActive: true, address: valencia },
  { _id: '10', title: 'Piso con vistas al mar', description, type: 'Piso', status: 'En venta', price: 360000, area: 95, image: photo('p10a'), isActive: true, address: valencia },
  { _id: '11', title: 'Casa de pueblo rehabilitada', description, type: 'Casa', status: 'En venta', price: 520000, area: 190, image: photo('p11a'), isActive: false, address: barcelona },
  { _id: '12', title: 'Dúplex con terraza', description, type: 'Piso', status: 'Disponible para alquilar', price: 1800, area: 120, image: photo('p12a'), isActive: true, address: madrid },
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
    _id: '1', code: 'TK-1048', subject: 'Consulta sobre piso centro', category: 'CONSULTA_PROPIEDAD', priority: 'ALTA', status: 'ABIERTO',
    customer: maria, agent: ana, reopenRequested: false, createdAt: '2025-05-12T10:32:00',
    description: 'Hola, me gustaría saber si el piso luminoso del centro sigue disponible y si sería posible concertar una visita esta semana.',
  },
  {
    _id: '2', code: 'TK-1036', subject: 'Visita a un chalet residencial', category: 'SOLICITUD_VISITA', priority: 'MEDIA', status: 'EN_CURSO',
    customer: carlos, agent: ana, reopenRequested: false, createdAt: '2025-05-09T09:10:00',
    description: 'Quiero visitar el chalet en zona residencial el próximo sábado.',
  },
  {
    _id: '3', code: 'TK-1019', subject: 'Documentación compraventa', category: 'DOCUMENTACION', priority: 'BAJA', status: 'RESUELTO',
    customer: maria, agent: luis, reopenRequested: false, createdAt: '2025-04-28T17:45:00',
    description: '¿Qué documentos necesito para la compraventa?',
  },
  {
    _id: '4', code: 'TK-0987', subject: 'Información sobre alquiler', category: 'CONSULTA_PROPIEDAD', priority: 'MEDIA', status: 'CERRADO',
    customer: maria, agent: luis, reopenRequested: false, createdAt: '2025-04-15T11:00:00',
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


// Usuario con sesión iniciada (en el backend se saca del token)
export function getLoggedUser(): User {
  return JSON.parse(localStorage.getItem('user')!);
}

// Devuelve la lista con el mismo formato paginado que el backend
export function paginate<T>(list: T[], params: { page?: number | string; limit?: number | string }) {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  return {
    data: list.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / limit)),
  };
}
