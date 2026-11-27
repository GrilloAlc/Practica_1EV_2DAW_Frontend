import { useEffect, useState } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './TicketDetail.css';
import { addMessage, assignTicket, denyReopen, getTicket, reopenTicket, updatePriority, updateStatus } from '../api/tickets';
import { getAllUsers } from '../api/users';
import { getErrorMessage, getErrorStatus } from '../api/client';
import { useAuth } from '../context/useAuth';
import type { Message, StatusChange, Ticket, User } from '../types';
import { TableSkeleton } from '../components/Skeleton';
import { useConfirm } from '../components/useConfirm';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  categoryLabels,
  formatDate,
  formatDateTime,
  priorityClass,
  priorityLabels,
  roleLabels,
  statusLabel,
} from '../utils/labels';

// Estados que puede poner el agente asignado (el backend no le deja abrir ni cerrar). El admin, todos
const AGENT_STATUSES = ['EN_CURSO', 'PENDIENTE_CLIENTE', 'RESUELTO'];
// El backend admite mensajes de hasta 2000 caracteres
const MAX_MESSAGE = 2000;

// Convierte en enlaces las direcciones web de un texto (por ejemplo, la de la casa por la que se pregunta).
// Los enlaces a esta misma web se abren en la misma pestaña
function linkify(text: string): ReactNode[] {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/g);
  return parts.map((part, i) => {
    if (!/^https?:\/\//.test(part)) return part;
    const clean = part.replace(/[.,;:!?)]+$/, '');
    const rest = part.slice(clean.length);
    let internal = '';
    try {
      const url = new URL(clean);
      if (url.origin === window.location.origin) internal = url.pathname + url.search;
    } catch {
      return part;
    }
    return (
      <span key={i}>
        {internal ? <Link to={internal}>{clean}</Link> : <a href={clean} target="_blank" rel="noreferrer">{clean}</a>}
        {rest}
      </span>
    );
  });
}

function TicketDetail() {
  const { id } = useParams();
  // Otra consulta = página nueva: no se mezclan mensajes ni errores de la anterior
  return <TicketPage key={id} id={id!} />;
}

function TicketPage({ id }: { id: string }) {
  const { user } = useAuth();
  const location = useLocation();
  const isCustomer = user!.role === 'CLIENTE';
  const isAdmin = user!.role === 'ADMIN';
  // Recién enviada desde "Nueva consulta": se confirma que ha llegado
  const justCreated = Boolean((location.state as { created?: boolean } | null)?.created);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<StatusChange[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [reply, setReply] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadStatus, setLoadStatus] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Acción en curso: mientras tanto los botones no se pueden volver a pulsar
  const [busy, setBusy] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  // El ticket llega con sus mensajes y su historial de estados en una sola petición
  useEffect(() => {
    let current = true;
    getTicket(id).then(
      (data) => {
        if (!current) return;
        setTicket(data.ticket);
        setMessages(data.messages);
        setHistory(data.history);
      },
      (err) => {
        if (!current) return;
        setLoadError(getErrorMessage(err));
        setLoadStatus(getErrorStatus(err));
      },
    );
    return () => {
      current = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isAdmin) return;
    let current = true;
    getAllUsers({ role: 'AGENTE', isActive: true }).then(
      (list) => {
        if (current) setAgents(list.sort((a, b) => a.name.localeCompare(b.name, 'es')));
      },
      () => {
        if (current) setAgents([]);
      },
    );
    return () => {
      current = false;
    };
  }, [isAdmin]);

  // 403: la consulta es de otra persona. 404: no existe (o el enlace está mal). Otro error: se muestra el del servidor
  if (loadError) {
    const backText = isCustomer ? 'Ver mis consultas' : 'Volver a la lista';
    const notFound = loadStatus === 404 || (loadStatus === 500 && !/^[0-9a-f]{24}$/i.test(id));
    return (
      <main className="page">
        <title>Consulta no disponible · CataHome</title>
        <div className="ticket-denied">
          {loadStatus === 403 ? (
            <>
              <h1 className="page-title">No tienes acceso a esta consulta.</h1>
              <p className="page-subtitle">
                Cada consulta solo la ven quien la escribió, el agente que la atiende y la administración.
              </p>
            </>
          ) : notFound ? (
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
    return (
      <main className="page">
        <title>Cargando consulta · CataHome</title>
        <TableSkeleton rows={4} />
      </main>
    );
  }

  // Vuelve a pedir el ticket para tener los mensajes, el estado y el historial al día
  async function reload() {
    const data = await getTicket(id);
    setTicket(data.ticket);
    setMessages(data.messages);
    setHistory(data.history);
  }

  // Ejecuta una acción con los botones bloqueados y recarga el ticket al terminar
  async function run(action: () => Promise<unknown>, done?: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await reload().catch(() => undefined);
      if (done) setNotice(done);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(false);
  }

  async function changeStatus(status: string) {
    if (status === 'CERRADO') {
      const ok = await confirm({
        title: isCustomer ? '¿Confirmas que está resuelta?' : '¿Cerrar este ticket?',
        message: <p>{isCustomer ? 'La consulta se cerrará y ya no se podrá escribir en ella. Si necesitas algo más, podrás abrir una nueva.' : 'Una vez cerrado no se pueden añadir mensajes ni cambiar el agente o la prioridad.'}</p>,
        confirmLabel: isCustomer ? 'Sí, cerrarla' : 'Cerrar ticket',
        danger: true,
      });
      if (!ok) return;
    }
    await run(() => updateStatus(id, status), 'Estado actualizado.');
  }

  async function askReopen() {
    await run(() => reopenTicket(id), 'Hemos recibido tu petición. Te avisaremos cuando la revisemos.');
  }

  // El admin rechaza la petición de reapertura: el ticket sigue resuelto
  async function rejectReopen() {
    const ok = await confirm({
      title: '¿Rechazar la reapertura?',
      message: <p>El ticket seguirá resuelto y el cliente podrá confirmar el cierre.</p>,
      confirmLabel: 'Rechazar',
    });
    if (ok) await run(() => denyReopen(id), 'Petición de reapertura rechazada.');
  }

  async function sendReply(e: SyntheticEvent) {
    e.preventDefault();
    const text = reply.trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await addMessage(ticket!, text);
      // El mensaje ya está enviado: se vacía aunque falle la recarga, para no mandarlo dos veces
      setReply('');
      await reload().catch(() => undefined);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(false);
  }

  const closed = ticket.status === 'CERRADO';
  // El cliente no escribe en una consulta resuelta: o pide reabrirla o confirma el cierre
  const canReply = !closed && !(isCustomer && ticket.status === 'RESUELTO');

  return (
    <main className="page">
      <title>{`${ticket.code} · ${ticket.subject} · CataHome`}</title>
      {confirmDialog}
      {/* ".." vuelve a la lista de la que se viene */}
      <p className="breadcrumb"><Link to=".." relative="path">{isCustomer ? 'Volver a mis consultas' : 'Volver a la lista'}</Link></p>

      <div className="ticket-head">
        <div>
          <p className="ticket-meta">
            <span className={'status-badge status-' + ticket.status.toLowerCase()}>{statusLabel(ticket.status, isCustomer)}</span>
            <span className="cell-code">{ticket.code}</span>
            {/* El cliente habla de "consultas" (femenino); agentes y administración, de "tickets" */}
            <span>{isCustomer ? 'Creada' : 'Creado'} el {formatDate(ticket.createdAt)}</span>
            {ticket.updatedAt && <span>{isCustomer ? 'Actualizada' : 'Actualizado'} el {formatDateTime(ticket.updatedAt)}</span>}
          </p>
          <h1 className="page-title">{ticket.subject}</h1>
        </div>

        <div className="ticket-actions">
          {isCustomer && ticket.status === 'RESUELTO' && (
            <>
              {!ticket.reopenRequested && <button className="btn btn-outline" disabled={busy} onClick={askReopen}>Pedir que se reabra</button>}
              <button className="btn" disabled={busy} onClick={() => changeStatus('CERRADO')}>Confirmar cierre</button>
            </>
          )}
          {isAdmin && !closed && <button className="btn" disabled={busy} onClick={() => changeStatus('CERRADO')}>Cerrar ticket</button>}
        </div>
      </div>

      {error && <p className="field-error" role="alert">{error}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {justCreated && !notice && messages.length === 0 && (
        <p className="notice" role="status">
          Hemos recibido tu consulta. Un agente te responderá por escrito aquí mismo, normalmente en menos de 24 horas.
        </p>
      )}
      {ticket.reopenRequested && ticket.status === 'RESUELTO' && (
        <div className="notice ticket-reopen">
          <p>{isCustomer ? 'Has pedido reabrir esta consulta. Te avisaremos cuando la revisemos.' : 'El cliente ha pedido reabrir este ticket.'}</p>
          {isAdmin && (
            <div className="ticket-reopen-actions">
              <button className="btn" disabled={busy} onClick={() => run(() => updateStatus(id, 'EN_CURSO'), 'Ticket reabierto.')}>Reabrir</button>
              <button className="btn btn-outline" disabled={busy} onClick={rejectReopen}>Rechazar</button>
            </div>
          )}
        </div>
      )}

      <div className={isCustomer ? 'ticket-layout' : 'ticket-layout ticket-layout-staff'}>
        <section className="ticket-box">
          <h2>Conversación</h2>

          {/* La descripción de la consulta se muestra como primer mensaje */}
          <div className="ticket-message">
            <span className="avatar" aria-hidden="true">{ticket.customer.name.charAt(0).toUpperCase()}</span>
            <div>
              <p className="ticket-message-head">
                <strong>{ticket.customer.name}</strong> <span className="ticket-role">Cliente</span>{' '}
                <time className="ticket-date" dateTime={ticket.createdAt}>{formatDateTime(ticket.createdAt)}</time>
              </p>
              <p>{linkify(ticket.description)}</p>
            </div>
          </div>

          {messages.map((m) => (
            <div key={m._id} className={m.author._id === ticket.customer._id ? 'ticket-message' : 'ticket-message ticket-message-team'}>
              <span className="avatar" aria-hidden="true">{m.author.name.charAt(0).toUpperCase()}</span>
              <div>
                <p className="ticket-message-head">
                  <strong>{m.author.name}</strong> {m.author.role && <span className="ticket-role">{roleLabels[m.author.role]}</span>}{' '}
                  <time className="ticket-date" dateTime={m.createdAt}>{formatDateTime(m.createdAt)}</time>
                </p>
                <p>{linkify(m.body)}</p>
              </div>
            </div>
          ))}

          {closed ? (
            <p className="ticket-closed">
              {isCustomer ? 'Esta consulta está cerrada. Si necesitas algo más, abre una nueva.' : 'Este ticket está cerrado: ya no admite mensajes.'}
            </p>
          ) : !canReply ? (
            <p className="ticket-closed">
              {ticket.reopenRequested
                ? 'Has pedido reabrirla: podrás escribir cuando la revisemos.'
                : 'La hemos dado por resuelta. Si no es así, pide que se reabra; si está todo bien, confirma el cierre.'}
            </p>
          ) : (
            <form onSubmit={sendReply}>
              <label className="field">
                {isCustomer ? 'Tu respuesta' : 'Respuesta al cliente'}
                <textarea
                  value={reply}
                  maxLength={MAX_MESSAGE}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Escribe aquí tu mensaje…"
                />
                <span className="field-help">
                  {reply.length} / {MAX_MESSAGE}
                  {!isCustomer && !isAdmin ? ' · Al responder, la consulta queda pendiente del cliente.' : ''}
                </span>
              </label>
              <button type="submit" className="btn" disabled={!reply.trim() || busy}>{busy ? 'Enviando…' : 'Enviar respuesta'}</button>
            </form>
          )}
        </section>

        <aside className="ticket-box">
          <h2>Detalles</h2>
          <dl className="ticket-data">
            <dt>Categoría</dt>
            <dd>{categoryLabels[ticket.category] || ticket.category}</dd>

            <dt>Cliente</dt>
            <dd>{ticket.customer.name}</dd>

            <dt>Prioridad</dt>
            <dd>
              {!isCustomer && !closed ? (
                <select aria-label="Prioridad" value={ticket.priority} disabled={busy} onChange={(e) => run(() => updatePriority(id, Number(e.target.value)), 'Prioridad actualizada.')}>
                  {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabels[p]}</option>)}
                </select>
              ) : <span className={priorityClass(ticket.priority)}>{priorityLabels[ticket.priority]}</span>}
            </dd>

            <dt>Estado</dt>
            <dd>
              {!isCustomer && !closed ? (
                <select aria-label="Estado" value={ticket.status} disabled={busy} onChange={(e) => changeStatus(e.target.value)}>
                  {TICKET_STATUSES.filter((s) => isAdmin || AGENT_STATUSES.includes(s) || s === ticket.status).map((s) => (
                    <option key={s} value={s} disabled={!isAdmin && !AGENT_STATUSES.includes(s)}>{statusLabel(s)}</option>
                  ))}
                </select>
              ) : statusLabel(ticket.status, isCustomer)}
            </dd>

            <dt>Agente asignado</dt>
            <dd>
              {isAdmin && !closed ? (
                <select aria-label="Agente asignado" value={ticket.agent ? ticket.agent._id : ''} disabled={busy} onChange={(e) => run(() => assignTicket(id, e.target.value), e.target.value ? 'Agente asignado.' : 'El ticket se ha quedado sin agente.')}>
                  <option value="">Sin asignar</option>
                  {ticket.agent && !agents.some((a) => a._id === ticket.agent!._id) && <option value={ticket.agent._id}>{ticket.agent.name}</option>}
                  {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              ) : ticket.agent ? ticket.agent.name : isCustomer ? 'Pendiente de asignar' : 'Sin asignar'}
            </dd>

            {ticket.closedAt && (
              <>
                <dt>Cerrada el</dt>
                <dd>{formatDateTime(ticket.closedAt)}</dd>
              </>
            )}
          </dl>

          {/* Historial de estados: lo ven el cliente, el agente asignado y el admin. El más reciente arriba */}
          <section className="ticket-history" aria-labelledby="ticket-history-title">
            <h3 id="ticket-history-title">Historial de estados</h3>
            {history.length === 0 ? (
              <p className="cell-muted">Todavía no hay cambios de estado.</p>
            ) : (
              <ol>
                {[...history].reverse().map((h) => (
                  <li key={h._id}>
                    <strong>
                      {h.oldStatus ? `De ${statusLabel(h.oldStatus, isCustomer)} a ${statusLabel(h.newStatus, isCustomer)}` : `Creada como ${statusLabel(h.newStatus, isCustomer)}`}
                    </strong>
                    <span>{h.changedBy.name} · {formatDateTime(h.changedAt)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

export default TicketDetail;
