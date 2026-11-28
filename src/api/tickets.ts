import { api, ApiError, USE_FAKE_DATA } from './client';
import { fakeHistory, fakeMessages, fakeTickets, fakeUsers, getLoggedUser, pageOf } from '../data/fakeData';
import type { Page, Ticket, TicketDetailData, TicketStats } from '../types';
import { useEffect, useState } from 'react';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../utils/labels';
import { rangeParams } from './stats';
import type { StatsRange } from './stats';

// La prioridad siempre como número (1, 2 o 3), aunque llegue como texto ("2")
// o con el formato antiguo ("BAJA", "MEDIA", "ALTA") de tickets creados antes del cambio
const OLD_PRIORITIES: Record<string, number> = { BAJA: 1, MEDIA: 2, ALTA: 3 };

export function toPriority(value: unknown): number {
  const n = Number(value);
  if (n === 1 || n === 2 || n === 3) return n;
  return OLD_PRIORITIES[String(value).toUpperCase()] || 2;
}

// Si un usuario ya no existe, el backend devuelve null en su lugar: se muestra así en vez de fallar
const MISSING_USER = { _id: '', name: 'Usuario eliminado' };

function normalizeTicket(t: Ticket): Ticket {
  return { ...t, priority: toPriority(t.priority), customer: t.customer || MISSING_USER, agent: t.agent || null };
}

function normalizeDetail(d: TicketDetailData): TicketDetailData {
  return {
    ticket: normalizeTicket(d.ticket),
    messages: (d.messages || []).map((m) => ({ ...m, author: m.author || MISSING_USER })),
    history: (d.history || []).map((h) => ({ ...h, changedBy: h.changedBy || MISSING_USER })),
  };
}

// Imita al backend: 404 si no existe y 403 si el cliente no es el dueño o el agente no está asignado
function findFakeTicket(id: string) {
  const ticket = fakeTickets.find((t) => t._id === id);
  if (!ticket) throw new ApiError('Ticket no encontrado', 404);
  const user = getLoggedUser();
  const isCustomer = user.role === 'CLIENTE';
  if ((isCustomer && ticket.customer._id !== user._id) || (user.role === 'AGENTE' && ticket.agent?._id !== user._id)) {
    throw new ApiError('No tienes permiso para ver este ticket', 403);
  }
  return ticket;
}

// Filtros que acepta GET /api/tickets. Los aplica el backend
export interface TicketFilters {
  status?: string;
  priority?: number;
  category?: string;
  // Solo admin: nombre exacto del cliente o del agente
  customerName?: string;
  agentName?: string;
  unassigned?: boolean;
  reopenRequested?: boolean;
  // Orden: por fecha (lo normal) o por prioridad ('prioridad'), de mayor a menor ('desc') o al revés
  sortBy?: 'prioridad';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// GET /api/tickets/options: categorías, prioridades y estados válidos según el backend.
// Se pide una vez; si falla, se usan las listas de utils/labels.ts, que son las mismas
export interface TicketOptions {
  categories: string[];
  priorities: number[];
  statuses: string[];
}

let optionsCache: Promise<TicketOptions> | null = null;

export function getTicketOptions(): Promise<TicketOptions> {
  const fallback = { categories: TICKET_CATEGORIES, priorities: TICKET_PRIORITIES, statuses: TICKET_STATUSES };
  if (USE_FAKE_DATA) return Promise.resolve(fallback);
  if (!optionsCache) {
    optionsCache = api.get('/tickets/options').then(
      (res: Partial<TicketOptions>) => ({
        categories: Array.isArray(res?.categories) && res.categories.length ? res.categories : fallback.categories,
        priorities: Array.isArray(res?.priorities) && res.priorities.length ? res.priorities.map(Number) : fallback.priorities,
        statuses: Array.isArray(res?.statuses) && res.statuses.length ? res.statuses : fallback.statuses,
      }),
      () => {
        optionsCache = null;
        return fallback;
      },
    );
  }
  return optionsCache;
}

// Las opciones de tickets para una pantalla: empiezan con las de labels.ts y se cambian por las del backend al llegar
export function useTicketOptions() {
  const [options, setOptions] = useState<TicketOptions>({ categories: TICKET_CATEGORIES, priorities: TICKET_PRIORITIES, statuses: TICKET_STATUSES });
  useEffect(() => {
    let current = true;
    getTicketOptions().then((o) => {
      if (current) setOptions(o);
    });
    return () => {
      current = false;
    };
  }, []);
  return options;
}

// GET /api/tickets → { data, pagesData }. El backend ya filtra según el rol:
// el cliente ve los suyos, el agente los asignados y el admin todos. Máximo 50 por página
export async function getTicketsPage(filters: TicketFilters = {}): Promise<Page<Ticket>> {
  if (USE_FAKE_DATA) {
    const user = getLoggedUser();
    let list = fakeTickets;
    if (user.role === 'CLIENTE') list = list.filter((t) => t.customer._id === user._id);
    if (user.role === 'AGENTE') list = list.filter((t) => t.agent?._id === user._id);
    if (filters.status) list = list.filter((t) => t.status === filters.status);
    if (filters.priority) list = list.filter((t) => t.priority === filters.priority);
    if (filters.category) list = list.filter((t) => t.category === filters.category);
    if (filters.customerName) list = list.filter((t) => t.customer.name === filters.customerName);
    if (filters.agentName) list = list.filter((t) => t.agent?.name === filters.agentName);
    if (filters.unassigned) list = list.filter((t) => !t.agent);
    if (filters.reopenRequested) list = list.filter((t) => t.reopenRequested);
    const dir = filters.order === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) =>
      filters.sortBy === 'prioridad' ? (a.priority - b.priority) * dir : (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * dir,
    );
    const limit = filters.limit || 10;
    return {
      data: pageOf(list, filters, limit),
      pagesData: { page: filters.page || 1, limit, total: list.length, totalPages: Math.max(1, Math.ceil(list.length / limit)) },
    };
  }

  // El backend espera "true" como texto, y sin el parámetro si no se filtra
  const res: Page<Ticket> = await api.page('/tickets', {
    ...filters,
    unassigned: filters.unassigned ? 'true' : undefined,
    reopenRequested: filters.reopenRequested ? 'true' : undefined,
  });
  return { ...res, data: res.data.map(normalizeTicket) };
}

// Solo la lista, para pantallas que no necesitan paginar
export async function getTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  return (await getTicketsPage(filters)).data;
}

// GET /api/tickets/:id → { ticket, messages, history }: el ticket con sus mensajes (con el rol del autor)
// y su historial de estados, del más antiguo al más reciente. 403 si no es tuyo, 404 si no existe
export async function getTicket(id: string): Promise<TicketDetailData> {
  if (USE_FAKE_DATA) {
    return {
      ticket: findFakeTicket(id),
      messages: fakeMessages.filter((m) => m.ticket === id),
      history: fakeHistory.filter((h) => h.ticket === id).sort((a, b) => a.changedAt.localeCompare(b.changedAt)),
    };
  }

  return normalizeDetail(await api.get('/tickets/' + id));
}

// POST /api/ticket-messages → { ticketId, body }
export async function addMessage(ticket: Ticket, body: string) {
  if (USE_FAKE_DATA) {
    const user = getLoggedUser();
    fakeMessages.push({
      _id: String(Date.now()),
      ticket: ticket._id,
      body,
      createdAt: new Date().toISOString(),
      author: { _id: user._id, name: user.name },
    });
    findFakeTicket(ticket._id).updatedAt = new Date().toISOString();
    return;
  }

  await api.post('/ticket-messages', { ticketId: ticket._id, body });
}

// POST /api/tickets → { subject, description, category }. El backend pone el código, el estado, el cliente
// y la prioridad (2, media). El cliente no la elige: la ajusta después el agente o el admin
export async function createTicket(data: { subject: string; description: string; category: string }): Promise<Ticket> {
  if (USE_FAKE_DATA) {
    const user = getLoggedUser();
    const ticket = {
      ...data,
      _id: String(Date.now()),
      code: 'TK-' + String(fakeTickets.length).padStart(4, '0'),
      customer: { _id: user._id, name: user.name },
      agent: null,
      priority: 2,
      status: 'ABIERTO',
      reopenRequested: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fakeTickets.push(ticket);
    fakeHistory.push({ _id: String(Date.now()), ticket: ticket._id, oldStatus: null, newStatus: 'ABIERTO', changedAt: ticket.createdAt, changedBy: { _id: user._id, name: user.name } });
    return ticket;
  }

  return api.post('/tickets', data);
}

// PUT /api/tickets/:id/assign (ADMIN) → { agentId }. Con agentId vacío el ticket queda sin agente
export async function assignTicket(id: string, agentId: string) {
  if (USE_FAKE_DATA) {
    const agent = fakeUsers.find((u) => u._id === agentId);
    const ticket = findFakeTicket(id);
    ticket.agent = agent ? { _id: agent._id, name: agent.name } : null;
    ticket.updatedAt = new Date().toISOString();
    return;
  }

  await api.put('/tickets/' + id + '/assign', { agentId });
}

// PUT /api/tickets/:id/priority (AGENTE asignado o ADMIN) → { priority: 1 | 2 | 3 }
export async function updatePriority(id: string, priority: number) {
  if (USE_FAKE_DATA) {
    const ticket = findFakeTicket(id);
    ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();
    return;
  }

  await api.put('/tickets/' + id + '/priority', { priority });
}

// PUT /api/tickets/:id/status → { newStatus }
export async function updateStatus(id: string, status: string) {
  if (USE_FAKE_DATA) {
    const ticket = findFakeTicket(id);
    const user = getLoggedUser();
    const now = new Date().toISOString();
    fakeHistory.push({ _id: String(Date.now()), ticket: id, oldStatus: ticket.status, newStatus: status, changedAt: now, changedBy: { _id: user._id, name: user.name } });
    // Como el backend: al salir de RESUELTO se olvida la petición de reapertura
    if (ticket.status === 'RESUELTO' && status !== 'RESUELTO') ticket.reopenRequested = false;
    ticket.status = status;
    ticket.updatedAt = now;
    return;
  }

  await api.put('/tickets/' + id + '/status', { newStatus: status });
}

// POST /api/tickets/:id/reopen (cliente dueño del ticket)
export async function reopenTicket(id: string) {
  if (USE_FAKE_DATA) {
    findFakeTicket(id).reopenRequested = true;
    return;
  }

  await api.post('/tickets/' + id + '/reopen');
}

// PUT /api/tickets/:id/reopen-request/deny (ADMIN): rechaza la petición de reapertura
export async function denyReopen(id: string) {
  if (USE_FAKE_DATA) {
    findFakeTicket(id).reopenRequested = false;
    return;
  }

  await api.put('/tickets/' + id + '/reopen-request/deny');
}

// GET /api/stats/tickets (ADMIN)
// Con agentId, solo los tickets de ese agente; con from/to, solo los creados en esas fechas
export async function getTicketStats(options: StatsRange & { agentId?: string } = {}): Promise<TicketStats> {
  if (USE_FAKE_DATA) {
    const list = options.agentId ? fakeTickets.filter((t) => t.agent?._id === options.agentId) : fakeTickets;
    function count(status: string) {
      return list.filter((t) => t.status === status).length;
    }
    return {
      total: list.length,
      abiertos: count('ABIERTO'),
      enCurso: count('EN_CURSO'),
      pendienteCliente: count('PENDIENTE_CLIENTE'),
      resueltos: count('RESUELTO'),
      cerrados: count('CERRADO'),
      sinAsignar: list.filter((t) => !t.agent).length,
    };
  }

  return api.get('/stats/tickets', { ...rangeParams(options), agentId: options.agentId });
}
