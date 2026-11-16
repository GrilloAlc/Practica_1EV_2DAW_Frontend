export interface Message {
  author: string;
  role: string; // 'Cliente', 'Agente' o 'Admin'
  date: string;
  body: string;
}

export interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  client: string;
  agent: string;
  propertyId: string;
  date: string;
  messages: Message[];
}

export const statuses = ['Abierto', 'En curso', 'Pendiente del cliente', 'Resuelto', 'Cerrado'];
export const priorities = ['Baja', 'Media', 'Alta'];
export const agents = ['Sin asignar', 'Ana García', 'Luis Pérez'];

export const tickets: Ticket[] = [
  {
    id: 'TK-1048', subject: 'Consulta sobre piso centro', category: 'Propiedad', priority: 'Alta', status: 'Abierto',
    client: 'María Ruiz', agent: 'Ana García', propertyId: '1', date: '12/05/2025',
    messages: [
      { author: 'María Ruiz', role: 'Cliente', date: '12/05/2025 · 10:32', body: 'Hola, me gustaría saber si el piso luminoso del centro sigue disponible y si sería posible concertar una visita esta semana.' },
      { author: 'Ana García', role: 'Agente', date: '12/05/2025 · 12:14', body: 'Hola María, la propiedad sigue disponible. Podemos organizar una visita el jueves por la tarde o el viernes por la mañana. ¿Qué opción te viene mejor?' },
    ],
  },
  {
    id: 'TK-1036', subject: 'Visita a un chalet residencial', category: 'Visita', priority: 'Media', status: 'En curso',
    client: 'Carlos Soto', agent: 'Ana García', propertyId: '5', date: '09/05/2025',
    messages: [{ author: 'Carlos Soto', role: 'Cliente', date: '09/05/2025 · 09:10', body: 'Quiero visitar el chalet en zona residencial el próximo sábado.' }],
  },
  {
    id: 'TK-1019', subject: 'Documentación compraventa', category: 'Documentación', priority: 'Baja', status: 'Resuelto',
    client: 'María Ruiz', agent: 'Luis Pérez', propertyId: '3', date: '28/04/2025',
    messages: [
      { author: 'María Ruiz', role: 'Cliente', date: '28/04/2025 · 17:45', body: '¿Qué documentos necesito para la compraventa?' },
      { author: 'Luis Pérez', role: 'Agente', date: '29/04/2025 · 09:20', body: 'Te hemos enviado por correo la lista completa. Dime si tienes dudas.' },
    ],
  },
  {
    id: 'TK-0987', subject: 'Información sobre alquiler', category: 'General', priority: 'Media', status: 'Cerrado',
    client: 'María Ruiz', agent: 'Luis Pérez', propertyId: '7', date: '15/04/2025',
    messages: [{ author: 'María Ruiz', role: 'Cliente', date: '15/04/2025 · 11:00', body: '¿Se admiten mascotas en el piso del metro?' }],
  },
];

export const categories = ['Propiedad', 'Visita', 'Documentación', 'General'];

export const users = [
  { id: '1', name: 'María Ruiz', email: 'maria@correo.com', role: 'Cliente' },
  { id: '2', name: 'Carlos Soto', email: 'carlos@correo.com', role: 'Cliente' },
  { id: '3', name: 'Ana García', email: 'ana@inmobiliaria.es', role: 'Agente' },
  { id: '4', name: 'Luis Pérez', email: 'luis@inmobiliaria.es', role: 'Agente' },
  { id: '5', name: 'Admin', email: 'admin@inmobiliaria.es', role: 'Administrador' },
];
