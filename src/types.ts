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
  customer: { _id: string; name: string };
  agent: { _id: string; name: string } | null;
  reopenRequested: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  body: string;
  createdAt: string;
  author: { _id: string; name: string; role: string };
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketStats {
  total: number;
  abiertos: number;
  enCurso: number;
  pendienteCliente: number;
  resueltos: number;
  cerrados: number;
}
