import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import './TicketDetail.css';
import './admin/Admin.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdminSidebar from '../components/AdminSidebar';
import StatusBadge from '../components/StatusBadge';
import { tickets, statuses, priorities, agents } from '../data/tickets';
import type { Ticket } from '../data/tickets';
import { properties } from '../data/properties';

function TicketDetail({ role }: { role: string }) {
  const { id } = useParams();
  const ticket = tickets.find((t) => t.id === id);

  let backTo = '/mis-tickets';
  if (role === 'admin') backTo = '/admin/tickets';
  if (role === 'agente') backTo = '/agente/tickets';

  let content;
  if (!ticket || (role === 'cliente' && ticket.client !== 'María Ruiz')) {
    content = (
      <div className="page">
        <div className="empty table-box">
          <strong>No hemos encontrado este ticket</strong>
          Puede que no exista o que no tengas acceso. <Link to={backTo}>Volver</Link>
        </div>
      </div>
    );
  } else {
    content = <TicketView ticket={ticket} role={role} backTo={backTo} />;
  }

  if (role === 'admin') {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">{content}</main>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main>{content}</main>
      <Footer />
    </>
  );
}

function TicketView({ ticket, role, backTo }: { ticket: Ticket; role: string; backTo: string }) {
  let roleName = 'Cliente';
  let authorName = ticket.client;
  if (role === 'admin') {
    roleName = 'Admin';
    authorName = 'Admin';
  }
  if (role === 'agente') {
    roleName = 'Agente';
    authorName = 'Ana García';
  }

  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [agent, setAgent] = useState(ticket.agent);
  const [messages, setMessages] = useState(ticket.messages);
  const [log, setLog] = useState<string[]>([]);
  const [reply, setReply] = useState('');

  const property = properties.find((p) => p.id === ticket.propertyId);

  function changeStatus(newStatus: string) {
    setLog([...log, `${status} → ${newStatus} (${authorName})`]);
    setStatus(newStatus);
  }

  function sendReply(e: SyntheticEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setMessages([...messages, { author: authorName, role: roleName, date: 'Ahora', body: reply }]);
    setReply('');
  }

  return (
    <div className="page">
      <p className="breadcrumb"><Link to={backTo}>← Volver a tickets</Link></p>

      <div className="ticket-head">
        <div>
          <p className="ticket-meta">
            <StatusBadge status={status} /> #{ticket.id} · Creado el {ticket.date}
          </p>
          <h1 className="page-title">{ticket.subject}</h1>
        </div>

        <div className="ticket-actions">
          {role === 'cliente' && status === 'Resuelto' && (
            <>
              <button className="btn btn-outline" onClick={() => changeStatus('En curso')}>Solicitar reapertura</button>
              <button className="btn" onClick={() => changeStatus('Cerrado')}>Confirmar cierre</button>
            </>
          )}
          {role === 'admin' && status !== 'Cerrado' && (
            <button className="btn" onClick={() => changeStatus('Cerrado')}>Cerrar ticket</button>
          )}
        </div>
      </div>

      <div className="ticket-layout">
        <section className="ticket-box">
          <h2>Historial</h2>
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'Cliente' ? 'ticket-message' : 'ticket-message ticket-message-team'}>
              <span className="avatar">{m.author[0]}</span>
              <div>
                <p className="ticket-message-head">
                  <strong>{m.author}</strong> · {m.role} <span>{m.date}</span>
                </p>
                <p>{m.body}</p>
              </div>
            </div>
          ))}

          {status === 'Cerrado' ? (
            <p className="ticket-closed">Este ticket está cerrado.</p>
          ) : (
            <form onSubmit={sendReply}>
              <label className="field">
                Escribir respuesta
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Escribe aquí tu mensaje..." />
              </label>
              <button type="submit" className="btn" disabled={!reply.trim()}>Enviar respuesta</button>
            </form>
          )}
        </section>

        <aside className="ticket-box">
          <h2>Datos del ticket</h2>
          <dl className="ticket-data">
            <dt>Categoría</dt>
            <dd>{ticket.category}</dd>

            <dt>Cliente</dt>
            <dd>{ticket.client}</dd>

            <dt>Prioridad</dt>
            <dd>
              {role === 'agente' || role === 'admin' ? (
                <select aria-label="Prioridad" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {priorities.map((p) => <option key={p}>{p}</option>)}
                </select>
              ) : priority}
            </dd>

            <dt>Estado</dt>
            <dd>
              {role === 'cliente' ? status : (
                <select aria-label="Estado" value={status} onChange={(e) => changeStatus(e.target.value)}>
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              )}
            </dd>

            <dt>Agente asignado</dt>
            <dd>
              {role === 'admin' ? (
                <select aria-label="Agente asignado" value={agent} onChange={(e) => setAgent(e.target.value)}>
                  {agents.map((a) => <option key={a}>{a}</option>)}
                </select>
              ) : agent}
            </dd>

            {property && (
              <>
                <dt>Propiedad asociada</dt>
                <dd><Link to={`/propiedades/${property.id}`}>{property.title}</Link></dd>
              </>
            )}
          </dl>

          {log.length > 0 && (
            <>
              <h3>Cambios de estado</h3>
              <ul className="ticket-log">
                {log.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default TicketDetail;
