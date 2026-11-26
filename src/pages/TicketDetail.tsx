import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import './TicketDetail.css';
import { addMessage, assignTicket, getMessages, getStatusHistory, getTicket, reopenTicket, updatePriority, updateStatus } from '../api/tickets';
import { getUsers } from '../api/users';
import { getErrorMessage, getErrorStatus } from '../api/client';
import { useAuth } from '../context/useAuth';
import type { Message, StatusChange, Ticket, User } from '../types';
import { TableSkeleton } from '../components/Skeleton';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  categoryLabels,
  formatDate,
  formatDateTime,
  priorityLabels,
  roleLabels,
  statusLabels,
} from '../utils/labels';

// Detalle compartido por cliente, agente y admin. Las acciones dependen del rol
function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isCustomer = user!.role === 'CLIENTE' || user!.role === 'PROPIETARIO';
  const isAdmin = user!.role === 'ADMIN';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [reply, setReply] = useState('');
  const [history, setHistory] = useState<StatusChange[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loadStatus, setLoadStatus] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTicket() {
      try {
        // El ticket y sus mensajes se piden por separado
        const [ticketData, messageList] = await Promise.all([getTicket(id!), getMessages(id!)]);
        setTicket(ticketData);
        setMessages(messageList);
      } catch (err) {
        setLoadError(getErrorMessage(err));
        setLoadStatus(getErrorStatus(err));
      }
    }
    loadTicket();
  }, [id]);

  // Historial de estados: el backend (GET /api/ticket-history/:id) solo se lo da al ADMIN
  useEffect(() => {
    async function loadHistory() {
      try {
        setHistory(await getStatusHistory(id!));
      } catch {
        setHistory([]);
      }
    }
    if (isAdmin) {
      loadHistory();
    }
  }, [id, isAdmin]);

  useEffect(() => {
    async function loadAgents() {
      try {
        setAgents(await getUsers({ role: 'AGENTE', isActive: true }));
      } catch {
        setAgents([]);
      }
    }
    if (isAdmin) {
      loadAgents();
    }
  }, [isAdmin]);

  // 403: la consulta es de otra persona. 404: no existe. Otro error: se muestra el del servidor
  if (loadError) {
    const backText = isCustomer ? 'Ver mis consultas' : 'Volver a la lista';
    return (
      <main className="page">
        <div className="ticket-denied">
          {loadStatus === 403 ? (
            <>
              <h1 className="page-title">No tienes acceso a esta consulta.</h1>
              <p className="page-subtitle">
                Cada consulta solo la ven quien la escribió, el agente que la atiende y la administración.
              </p>
            </>
          ) : loadStatus === 404 ? (
            <>
              <h1 className="page-title">Esta consulta no existe.</h1>
              <p className="page-subtitle">Puede que el enlace esté mal copiado o que la consulta se haya borrado.</p>
            </>
          ) : (
            <>
              <h1 className="page-title">No se ha podido abrir esta consulta.</h1>
              <p className="page-subtitle">{loadError}</p>
            </>
          )}
          <Link to=".." relative="path" className="btn">{backText}</Link>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return <main className="page"><TableSkeleton rows={4} /></main>;
  }

  async function changeStatus(status: string) {
    try {
      await updateStatus(ticket!._id, status);
      setTicket({ ...ticket!, status, updatedAt: new Date().toISOString() });
      setError('');
      if (isAdmin) {
        setHistory(await getStatusHistory(ticket!._id));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function changePriority(priority: string) {
    try {
      await updatePriority(ticket!._id, priority);
      setTicket({ ...ticket!, priority, updatedAt: new Date().toISOString() });
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function changeAgent(agentId: string) {
    try {
      await assignTicket(ticket!._id, agentId);
      const agent = agents.find((a) => a._id === agentId)!;
      setTicket({ ...ticket!, agent: { _id: agent._id, name: agent.name }, updatedAt: new Date().toISOString() });
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function askReopen() {
    try {
      await reopenTicket(ticket!._id);
      setTicket({ ...ticket!, reopenRequested: true });
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function sendReply(e: SyntheticEvent) {
    e.preventDefault();
    try {
      await addMessage(ticket!, reply);
      // Se vuelven a pedir para tener el autor con su nombre
      setMessages(await getMessages(ticket!._id));
      setTicket({ ...ticket!, updatedAt: new Date().toISOString() });
      setReply('');
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const closed = ticket.status === 'CERRADO';

  return (
    <main className="page">
      {/* ".." vuelve a la lista de la que se viene */}
      <p className="breadcrumb"><Link to=".." relative="path">{isCustomer ? 'Volver a mis consultas' : 'Volver a la lista'}</Link></p>

      <div className="ticket-head">
        <div>
          <p className="ticket-meta">
            <span className={'status-badge status-' + ticket.status.toLowerCase()}>{statusLabels[ticket.status]}</span>
            <span className="cell-code">{ticket.code}</span>
            <span>Creado el {formatDate(ticket.createdAt)}</span>
            {ticket.updatedAt && <span>Actualizado el {formatDateTime(ticket.updatedAt)}</span>}
          </p>
          <h1 className="page-title">{ticket.subject}</h1>
        </div>

        <div className="ticket-actions">
          {isCustomer && ticket.status === 'RESUELTO' && (
            <>
              {!ticket.reopenRequested && <button className="btn btn-outline" onClick={askReopen}>Solicitar reapertura</button>}
              <button className="btn" onClick={() => changeStatus('CERRADO')}>Confirmar cierre</button>
            </>
          )}
          {isAdmin && !closed && <button className="btn" onClick={() => changeStatus('CERRADO')}>Cerrar ticket</button>}
        </div>
      </div>

      {error && <p className="field-error" role="alert">{error}</p>}
      {ticket.reopenRequested && ticket.status === 'RESUELTO' && <p className="notice">Se ha pedido reabrir este ticket.</p>}

      <div className="ticket-layout">
        <section className="ticket-box">
          <h2>Conversación</h2>

          {/* La descripción del ticket se muestra como primer mensaje */}
          <div className="ticket-message">
            <span className="avatar">{ticket.customer.name[0]}</span>
            <div>
              <p className="ticket-message-head">
                <strong>{ticket.customer.name}</strong> <span className="ticket-role">Cliente</span> <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
              </p>
              <p>{ticket.description}</p>
            </div>
          </div>

          {messages.map((m) => (
            <div key={m._id} className={m.author._id === ticket.customer._id ? 'ticket-message' : 'ticket-message ticket-message-team'}>
              <span className="avatar">{m.author.name[0]}</span>
              <div>
                <p className="ticket-message-head">
                  <strong>{m.author.name}</strong> {m.author.role && <span className="ticket-role">{roleLabels[m.author.role]}</span>} <span className="ticket-date">{formatDate(m.createdAt)}</span>
                </p>
                <p>{m.body}</p>
              </div>
            </div>
          ))}

          {closed ? (
            <p className="ticket-closed">Esta consulta está cerrada. Si necesitas algo más, abre una nueva.</p>
          ) : (
            <form onSubmit={sendReply}>
              <label className="field">
                Tu respuesta
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escribe aquí tu mensaje…" />
              </label>
              <button type="submit" className="btn" disabled={!reply.trim()}>Enviar respuesta</button>
            </form>
          )}
        </section>

        <aside className="ticket-box">
          <h2>Detalles</h2>
          <dl className="ticket-data">
            <dt>Categoría</dt>
            <dd>{categoryLabels[ticket.category]}</dd>

            <dt>Cliente</dt>
            <dd>{ticket.customer.name}</dd>

            <dt>Prioridad</dt>
            <dd>
              {!isCustomer && !closed ? (
                <select aria-label="Prioridad" value={ticket.priority} onChange={(e) => changePriority(e.target.value)}>
                  {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabels[p]}</option>)}
                </select>
              ) : <span className={'priority priority-' + ticket.priority.toLowerCase()}>{priorityLabels[ticket.priority]}</span>}
            </dd>

            <dt>Estado</dt>
            <dd>
              {!isCustomer && !closed ? (
                <select aria-label="Estado" value={ticket.status} onChange={(e) => changeStatus(e.target.value)}>
                  {TICKET_STATUSES.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
                </select>
              ) : statusLabels[ticket.status]}
            </dd>

            <dt>Agente asignado</dt>
            <dd>
              {isAdmin && !closed ? (
                <select aria-label="Agente asignado" value={ticket.agent ? ticket.agent._id : ''} onChange={(e) => changeAgent(e.target.value)}>
                  <option value="" disabled>Sin asignar</option>
                  {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              ) : ticket.agent ? ticket.agent.name : 'Sin asignar'}
            </dd>
          </dl>

          {isAdmin && (
            <section className="ticket-history" aria-labelledby="ticket-history-title">
              <h3 id="ticket-history-title">Historial de estados</h3>
              {history.length === 0 ? (
                <p className="cell-muted">Todavía no hay cambios de estado.</p>
              ) : (
                <ol>
                  {history.map((h) => (
                    <li key={h._id}>
                      <strong>
                        {h.oldStatus ? `De ${statusLabels[h.oldStatus]} a ${statusLabels[h.newStatus]}` : `Creada como ${statusLabels[h.newStatus]}`}
                      </strong>
                      <span>{h.changedBy.name} · {formatDateTime(h.changedAt)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

export default TicketDetail;
