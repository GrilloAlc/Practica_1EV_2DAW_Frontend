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
  image?: string;
  isActive: boolean;
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
  priority: string;
  status: string;
  customer: { _id: string; name: string; email?: string };
  agent: { _id: string; name: string; email?: string } | null;
  reopenRequested: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Una entrada de GET /api/ticket-history/:id (cambio de estado de un ticket)
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
  sinAsignar?: number;
}
