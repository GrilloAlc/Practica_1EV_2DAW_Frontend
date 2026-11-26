import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTickets } from '../api/tickets';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/useAuth';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, categoryLabels, formatDate, priorityLabels, statusLabels } from '../utils/labels';
import type { Ticket } from '../types';
import { TableSkeleton } from '../components/Skeleton';

// Quita personas repetidas (o vacías) y las ordena por nombre
function uniquePeople(people: ({ _id: string; name: string } | null)[]) {
  const byId = new Map<string, { _id: string; name: string }>();
  for (const p of people) {
    if (p) byId.set(p._id, p);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

// Lista compartida por cliente, agente y admin. Las columnas cambian según el rol
function Tickets({ title, subtitle }: { title: string; subtitle: string }) {
  const { user } = useAuth();
  const isCustomer = user!.role === 'CLIENTE';
  const isAdmin = user!.role === 'ADMIN';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [agentId, setAgentId] = useState('');

  useEffect(() => {
    async function loadTickets() {
      try {
        setTickets(await getTickets({ limit: 50 }));
      } catch (err) {
        setError(getErrorMessage(err));
      }
      setLoading(false);
    }
    loadTickets();
  }, []);

  // Clientes y agentes que aparecen en las consultas, para los filtros del admin (sin repetir)
  const customers = uniquePeople(tickets.map((t) => t.customer));
  const agents = uniquePeople(tickets.map((t) => t.agent));

  let visible = tickets;
  if (customerId) {
    visible = visible.filter((t) => t.customer._id === customerId);
  }
  if (agentId === 'sin-asignar') {
    visible = visible.filter((t) => !t.agent);
  } else if (agentId) {
    visible = visible.filter((t) => t.agent?._id === agentId);
  }
  if (status) {
    visible = visible.filter((t) => t.status === status);
  }
  if (priority) {
    visible = visible.filter((t) => t.priority === priority);
  }
  if (category) {
    visible = visible.filter((t) => t.category === category);
  }
  if (search) {
    visible = visible.filter((t) => {
      const text = t.code + t.subject + t.customer.name + t.agent?.name;
      return text.toLowerCase().includes(search.toLowerCase());
    });
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        {isCustomer && <Link to="/mis-tickets/nuevo" className="btn btn-acento">Nueva consulta</Link>}
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="table-box">
        <div className="table-tools">
          <div className="tabs">
            <button className={status === '' ? 'tab tab-active' : 'tab'} onClick={() => setStatus('')}>Todos</button>
            {TICKET_STATUSES.map((s) => (
              <button key={s} className={status === s ? 'tab tab-active' : 'tab'} onClick={() => setStatus(s)}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="tabs">
            <select className="table-search" aria-label="Filtrar por prioridad" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Toda prioridad</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabels[p]}</option>
              ))}
            </select>
            {/* Las categorías son los tipos de consulta (las mismas que elige el cliente al escribir) */}
            {!isCustomer && (
              <select className="table-search" aria-label="Filtrar por categoría" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Todas las categorías</option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
            )}
            {isAdmin && (
              <>
                <select className="table-search" aria-label="Filtrar por cliente" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Todos los clientes</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <select className="table-search" aria-label="Filtrar por agente" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                  <option value="">Todos los agentes</option>
                  <option value="sin-asignar">Sin asignar</option>
                  {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </>
            )}
            <input className="table-search" type="search" aria-label="Buscar consulta" placeholder="Código, asunto o nombre…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <div className="empty">
            {tickets.length === 0 && !loading ? (
              <>
                <strong>{isCustomer ? 'Aún no has hecho ninguna consulta' : 'Todavía no hay consultas'}</strong>
                {isCustomer ? <>Cuando preguntes por una casa, la verás aquí. <Link to="/propiedades">Buscar casas</Link></> : 'Cuando entre una consulta aparecerá aquí.'}
              </>
            ) : (
              <>
                <strong>Ninguna consulta coincide</strong>
                {isAdmin
                  ? 'Cambia el estado, la prioridad, la categoría, el cliente, el agente o el texto de búsqueda.'
                  : isCustomer
                    ? 'Cambia el estado, la prioridad o el texto de búsqueda.'
                    : 'Cambia el estado, la prioridad, la categoría o el texto de búsqueda.'}
              </>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Asunto</th>
                {!isCustomer && <th>Cliente</th>}
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Estado</th>
                {isAdmin && <th>Agente</th>}
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t._id}>
                  {/* Enlace relativo: lleva al detalle dentro de la ruta actual */}
                  <td className="cell-code"><Link to={t._id}>{t.code}</Link></td>
                  <td>{t.subject}</td>
                  {!isCustomer && <td>{t.customer.name}</td>}
                  <td className="cell-muted">{categoryLabels[t.category]}</td>
                  <td><span className={'priority priority-' + t.priority.toLowerCase()}>{priorityLabels[t.priority]}</span></td>
                  <td><span className={'status-badge status-' + t.status.toLowerCase()}>{statusLabels[t.status]}</span></td>
                  {isAdmin && <td className={t.agent ? '' : 'cell-muted'}>{t.agent ? t.agent.name : 'Sin asignar'}</td>}
                  <td className="cell-muted cell-code">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="table-foot">{visible.length} de {tickets.length} {isCustomer ? "consultas" : "tickets"}</p>
    </main>
  );
}

export default Tickets;
