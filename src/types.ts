export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  price: number;
  area?: number;
  // Una o varias direcciones de fotos separadas por espacios (la primera es la portada). Ver utils/photos.ts
  image?: string;
  // Solo si el backend llega a guardar la galería como lista
  images?: string[];
  isActive: boolean;
  createdAt?: string;
  address: {
    street: string;
    number?: string;
    city: string;
    province: string;
    postalCode: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface Ticket {
  _id: string;
  code: string;
  subject: string;
  description: string;
  category: string;
  // 1 baja, 2 media, 3 alta
  priority: number;
  status: string;
  customer: { _id: string; name: string; email?: string };
  agent: { _id: string; name: string; email?: string } | null;
  reopenRequested: boolean;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// GET /api/tickets/:id devuelve el ticket con sus mensajes y su historial de estados
export interface TicketDetailData {
  ticket: Ticket;
  messages: Message[];
  history: StatusChange[];
}

// Una entrada del historial de estados de un ticket
export interface StatusChange {
  _id: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: string;
  changedBy: { _id: string; name: string; email?: string; role?: string };
}

export interface Message {
  _id: string;
  body: string;
  createdAt: string;
  // El backend solo devuelve nombre y email del autor
  author: { _id: string; name: string; email?: string; role?: string };
}

export interface TicketStats {
  total: number;
  abiertos: number;
  enCurso: number;
  pendienteCliente: number;
  resueltos: number;
  cerrados: number;
  sinAsignar: number;
}

// Respuesta paginada de los listados: { data, pagesData }
export interface Page<T> {
  data: T[];
  pagesData: { page: number; limit: number; total: number; totalPages: number };
}
