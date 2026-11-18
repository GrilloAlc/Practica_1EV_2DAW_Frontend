import { api, USE_FAKE_DATA } from './client';
import { fakeMessages, fakeTickets, fakeUsers, getLoggedUser, paginate } from '../data/fakeData';
import type { Message, Paginated, Ticket, TicketStats } from '../types';

function findFakeTicket(id: string) {
  const ticket = fakeTickets.find((t) => t._id === id);
  if (!ticket) throw new Error('Ticket no encontrado.');
  return ticket;
}

// Cada usuario recibe solo los tickets que puede ver según su rol
export async function getTickets(params: { limit?: number; unassigned?: boolean }): Promise<Paginated<Ticket>> {
  if (USE_FAKE_DATA) {
    const user = getLoggedUser();
    let list = fakeTickets;
    if (user.role === 'CLIENTE' || user.role === 'PROPIETARIO') list = list.filter((t) => t.customer._id === user._id);
    if (user.role === 'AGENTE') list = list.filter((t) => t.agent?._id === user._id);
    if (params.unassigned) list = list.filter((t) => !t.agent);
    return paginate(list, params);
  }

  const res = await api.get('/tickets', { params });
  return res.data;
}

export async function getTicket(id: string): Promise<{ ticket: Ticket; messages: Message[] }> {
  if (USE_FAKE_DATA) {
    const ticket = findFakeTicket(id);
    const messages = fakeMessages.filter((m) => m.ticket === id);
    return { ticket, messages };
  }

  const res = await api.get('/tickets/' + id);
  return res.data;
}

// La prioridad no la elige el cliente: el backend pone MEDIA y luego la cambia el agente o el admin
export async function createTicket(data: { subject: string; description: string; category: string }): Promise<Ticket> {
  if (USE_FAKE_DATA) {
    const user = getLoggedUser();
    const ticket = {
      ...data,
      _id: String(Date.now()),
      code: 'TK-' + (2000 + fakeTickets.length),
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

  const res = await api.post('/tickets', data);
  return res.data;
}

export async function addMessage(id: string, body: string): Promise<Message> {
  if (USE_FAKE_DATA) {
    const user = getLoggedUser();
    const message = {
      _id: String(Date.now()),
      ticket: id,
      body,
      createdAt: new Date().toISOString(),
      author: { _id: user._id, name: user.name, role: user.role },
    };
    fakeMessages.push(message);
    return message;
  }

  const res = await api.post('/tickets/' + id + '/messages', { body });
  return res.data;
}

export async function assignTicket(id: string, agentId: string) {
  if (USE_FAKE_DATA) {
    const agent = fakeUsers.find((u) => u._id === agentId)!;
    findFakeTicket(id).agent = { _id: agent._id, name: agent.name };
    return;
  }

  await api.patch('/tickets/' + id + '/assign', { agentId });
}

export async function updatePriority(id: string, priority: string) {
  if (USE_FAKE_DATA) {
    findFakeTicket(id).priority = priority;
    return;
  }

  await api.patch('/tickets/' + id + '/priority', { priority });
}

export async function updateStatus(id: string, status: string) {
  if (USE_FAKE_DATA) {
    findFakeTicket(id).status = status;
    return;
  }

  await api.patch('/tickets/' + id + '/status', { status });
}

export async function reopenTicket(id: string) {
  if (USE_FAKE_DATA) {
    findFakeTicket(id).reopenRequested = true;
    return;
  }

  await api.post('/tickets/' + id + '/reopen');
}

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
    };
  }

  const res = await api.get('/stats/tickets');
  return res.data;
}
