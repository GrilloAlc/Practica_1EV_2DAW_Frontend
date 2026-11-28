import { api } from './client';
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
  // El backend ordena siempre por prioridad (y, dentro de cada una, lo más nuevo primero):
  // 'desc' alta primero (lo normal) o 'asc' baja primero
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// GET /api/tickets/options: categorías, prioridades y estados válidos, tal y como los define el backend.
// Se pide una vez. Mientras llegan (o si falla) se usan las listas de utils/labels.ts
export interface TicketOptions {
  categories: string[];
  priorities: number[];
  statuses: string[];
}

const LOCAL_OPTIONS: TicketOptions = { categories: TICKET_CATEGORIES, priorities: TICKET_PRIORITIES, statuses: TICKET_STATUSES };
let optionsCache: Promise<TicketOptions> | null = null;

export function useTicketOptions() {
  const [options, setOptions] = useState(LOCAL_OPTIONS);
  useEffect(() => {
    optionsCache ??= api.get('/tickets/options').catch(() => {
      optionsCache = null;
      return LOCAL_OPTIONS;
    });
    let current = true;
    optionsCache.then((o) => {
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
  // El backend espera "true" como texto, y sin el parámetro si no se filtra
  const res: Page<Ticket> = await api.get('/tickets', {
    ...filters,
    unassigned: filters.unassigned ? 'true' : undefined,
    reopenRequested: filters.reopenRequested ? 'true' : undefined,
  });
  return { ...res, data: res.data.map(normalizeTicket) };
}

// GET /api/tickets/:id → { ticket, messages, history }: el ticket con sus mensajes (con el rol del autor)
// y su historial de estados, del más antiguo al más reciente. 403 si no es tuyo, 404 si no existe
export async function getTicket(id: string): Promise<TicketDetailData> {
  return normalizeDetail(await api.get('/tickets/' + id));
}

// POST /api/ticket-messages → { ticketId, body }
export async function addMessage(ticket: Ticket, body: string) {
  await api.post('/ticket-messages', { ticketId: ticket._id, body });
}

// POST /api/tickets → { subject, description, category }. El backend pone el código, el estado, el cliente
// y la prioridad (2, media). El cliente no la elige: la ajusta después el agente o el admin
export async function createTicket(data: { subject: string; description: string; category: string }): Promise<Ticket> {
  return api.post('/tickets', data);
}

// PUT /api/tickets/:id/assign (ADMIN) → { agentId }. Con agentId vacío el ticket queda sin agente
export async function assignTicket(id: string, agentId: string) {
  await api.put('/tickets/' + id + '/assign', { agentId });
}

// PUT /api/tickets/:id/priority (AGENTE asignado o ADMIN) → { priority: 1 | 2 | 3 }
export async function updatePriority(id: string, priority: number) {
  await api.put('/tickets/' + id + '/priority', { priority });
}

// PUT /api/tickets/:id/status → { newStatus }
export async function updateStatus(id: string, status: string) {
  await api.put('/tickets/' + id + '/status', { newStatus: status });
}

// POST /api/tickets/:id/reopen (cliente dueño del ticket)
export async function reopenTicket(id: string) {
  await api.post('/tickets/' + id + '/reopen');
}

// PUT /api/tickets/:id/reopen-request/deny (ADMIN): rechaza la petición de reapertura
export async function denyReopen(id: string) {
  await api.put('/tickets/' + id + '/reopen-request/deny');
}

// GET /api/stats/tickets (ADMIN)
// Con agentId, solo los tickets de ese agente; con from/to, solo los creados en esas fechas
export async function getTicketStats(options: StatsRange & { agentId?: string } = {}): Promise<TicketStats> {
  return api.get('/stats/tickets', { ...rangeParams(options), agentId: options.agentId });
}
