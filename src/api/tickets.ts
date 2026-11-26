import { api, USE_FAKE_DATA } from './client';
import { fakeMessages, fakeTickets, fakeUsers, getLoggedUser, pageOf } from '../data/fakeData';
import type { Message, Ticket, TicketStats } from '../types';

function findFakeTicket(id: string) {
  const ticket = fakeTickets.find((t) => t._id === id);
  if (!ticket) throw new Error('Ticket no encontrado');
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
    };
    fakeTickets.push(ticket);
    return ticket;
  }

  return api.post('/tickets', data);
}

// PUT /api/tickets/:id/assign (ADMIN) → { agentId }
export async function assignTicket(id: string, agentId: string) {
  if (USE_FAKE_DATA) {
    const agent = fakeUsers.find((u) => u._id === agentId)!;
    findFakeTicket(id).agent = { _id: agent._id, name: agent.name };
    return;
  }

  await api.put('/tickets/' + id + '/assign', { agentId });
}

// PUT /api/tickets/:id/priority (AGENTE asignado o ADMIN) → { priority }
export async function updatePriority(id: string, priority: string) {
  if (USE_FAKE_DATA) {
    findFakeTicket(id).priority = priority;
    return;
  }

  await api.put('/tickets/' + id + '/priority', { priority });
}

// PUT /api/tickets/:id/status → { status }
export async function updateStatus(id: string, status: string) {
  if (USE_FAKE_DATA) {
    findFakeTicket(id).status = status;
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
