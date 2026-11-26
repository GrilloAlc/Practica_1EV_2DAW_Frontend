import { api, ApiError, USE_FAKE_DATA } from './client';
import { fakeHistory, fakeMessages, fakeTickets, fakeUsers, getLoggedUser, pageOf } from '../data/fakeData';
import type { Message, StatusChange, Ticket, TicketStats } from '../types';

// Imita al backend: 404 si no existe y 403 si el cliente no es el dueño o el agente no está asignado
function findFakeTicket(id: string) {
  const ticket = fakeTickets.find((t) => t._id === id);
  if (!ticket) throw new ApiError('Ticket no encontrado', 404);
  const user = getLoggedUser();
  const isCustomer = user.role === 'CLIENTE' || user.role === 'PROPIETARIO';
  if ((isCustomer && ticket.customer._id !== user._id) || (user.role === 'AGENTE' && ticket.agent?._id !== user._id)) {
    throw new ApiError('No tienes permiso para ver este ticket', 403);
  }
  return ticket;
}

// GET /api/tickets → array. El backend ya filtra según el rol:
// cliente/propietario ve los suyos, agente los asignados y admin todos
export async function getTickets(params: { status?: string; priority?: string; unassigned?: boolean; page?: number; limit?: number } = {}): Promise<Ticket[]> {
  if (USE_FAKE_DATA) {
    const user = getLoggedUser();
    let list = fakeTickets;
    if (user.role === 'CLIENTE' || user.role === 'PROPIETARIO') list = list.filter((t) => t.customer._id === user._id);
    if (user.role === 'AGENTE') list = list.filter((t) => t.agent?._id === user._id);
    if (params.status) list = list.filter((t) => t.status === params.status);
    if (params.priority) list = list.filter((t) => t.priority === params.priority);
    if (params.unassigned) list = list.filter((t) => !t.agent);
    return pageOf(list, params, 10);
  }

  return api.get('/tickets', params);
}

// GET /api/tickets/:id
export async function getTicket(id: string): Promise<Ticket> {
  if (USE_FAKE_DATA) {
    return findFakeTicket(id);
  }

  return api.get('/tickets/' + id);
}

// GET /api/ticket-messages/:ticketId (el id es el del ticket)
export async function getMessages(ticketId: string): Promise<Message[]> {
  if (USE_FAKE_DATA) {
    return fakeMessages.filter((m) => m.ticket === ticketId);
  }

  return api.get('/ticket-messages/' + ticketId);
}

// POST /api/ticket-messages → { ticketCode, body }
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

  await api.post('/ticket-messages', { ticketCode: ticket.code, body });
}

// POST /api/tickets → { subject, description, category }. El backend pone estado, cliente y prioridad
export async function createTicket(data: { subject: string; description: string; category: string }): Promise<Ticket> {
  if (USE_FAKE_DATA) {
    const user = getLoggedUser();
    const ticket = {
      ...data,
      _id: String(Date.now()),
      code: 'TK-' + String(fakeTickets.length).padStart(4, '0'),
      customer: { _id: user._id, name: user.name },
      agent: null,
      priority: 'MEDIA',
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

// PUT /api/tickets/:id/assign (ADMIN) → { agentId }
export async function assignTicket(id: string, agentId: string) {
  if (USE_FAKE_DATA) {
    const agent = fakeUsers.find((u) => u._id === agentId)!;
    const ticket = findFakeTicket(id);
    ticket.agent = { _id: agent._id, name: agent.name };
    ticket.updatedAt = new Date().toISOString();
    return;
  }

  await api.put('/tickets/' + id + '/assign', { agentId });
}

// PUT /api/tickets/:id/priority (AGENTE asignado o ADMIN) → { priority }
export async function updatePriority(id: string, priority: string) {
  if (USE_FAKE_DATA) {
    const ticket = findFakeTicket(id);
    ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();
    return;
  }

  await api.put('/tickets/' + id + '/priority', { priority });
}

// PUT /api/tickets/:id/status → { status }
export async function updateStatus(id: string, status: string) {
  if (USE_FAKE_DATA) {
    const ticket = findFakeTicket(id);
    const user = getLoggedUser();
    const now = new Date().toISOString();
    fakeHistory.push({ _id: String(Date.now()), ticket: id, oldStatus: ticket.status, newStatus: status, changedAt: now, changedBy: { _id: user._id, name: user.name } });
    ticket.status = status;
    ticket.updatedAt = now;
    return;
  }

  await api.put('/tickets/' + id + '/status', { status });
}

// POST /api/tickets/:id/reopen (cliente dueño del ticket)
export async function reopenTicket(id: string) {
  if (USE_FAKE_DATA) {
    findFakeTicket(id).reopenRequested = true;
    return;
  }

  await api.post('/tickets/' + id + '/reopen');
}

// GET /api/ticket-history/:id → cambios de estado del ticket, del más reciente al más antiguo.
// Ahora el backend solo se lo da al ADMIN
export async function getStatusHistory(ticketId: string): Promise<StatusChange[]> {
  if (USE_FAKE_DATA) {
    return fakeHistory.filter((h) => h.ticket === ticketId).sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  }

  return api.get('/ticket-history/' + ticketId);
}

// GET /api/stats/tickets (ADMIN)
export async function getTicketStats(): Promise<TicketStats> {
  if (USE_FAKE_DATA) {
    function count(status: string) {
      return fakeTickets.filter((t) => t.status === status).length;
    }
    return {
      total: fakeTickets.length,
      abiertos: count('ABIERTO'),
      enCurso: count('EN_CURSO'),
      pendienteCliente: count('PENDIENTE_CLIENTE'),
      resueltos: count('RESUELTO'),
      cerrados: count('CERRADO'),
      sinAsignar: fakeTickets.filter((t) => !t.agent).length,
    };
  }

  return api.get('/stats/tickets');
}
