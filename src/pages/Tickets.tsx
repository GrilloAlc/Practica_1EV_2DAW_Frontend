import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTicketsPage } from '../api/tickets';
import { getUsers } from '../api/users';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/useAuth';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, categoryLabels, formatDate, priorityClass, priorityLabels, statusLabels } from '../utils/labels';
import type { Ticket, User } from '../types';
import { TableSkeleton } from '../components/Skeleton';

const PER_PAGE = 20;

// Lista compartida por cliente, agente y admin. Las columnas cambian según el rol.
// Los filtros los aplica el backend; la búsqueda por texto solo busca en la página cargada
function Tickets({ title, subtitle }: { title: string; subtitle: string }) {
  const { user } = useAuth();
  const isCustomer = user!.role === 'CLIENTE';
  const isAdmin = user!.role === 'ADMIN';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [customers, setCustomers] = useState<User[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  // Se vuelve a pedir la lista cada vez que cambia un filtro o la página
  useEffect(() => {
    let current = true;
    async function loadTickets() {
      setLoading(true);
      try {
        const res = await getTicketsPage({
          status: status || undefined,
          priority: priority ? Number(priority) : undefined,
          category: category || undefined,
          customerName: customerName || undefined,
          agentName: agentName && agentName !== 'sin-asignar' ? agentName : undefined,
          unassigned: agentName === 'sin-asignar',
          page,
          limit: PER_PAGE,
        });
        if (!current) return;
        setTickets(res.data);
        setTotal(res.pagesData.total);
        setTotalPages(Math.max(1, res.pagesData.totalPages));
        setError('');
      } catch (err) {
        if (current) setError(getErrorMessage(err));
      }
      if (current) setLoading(false);
    }
    loadTickets();
    return () => {
      current = false;
    };
  }, [status, priority, category, customerName, agentName, page]);

  // Clientes y agentes para los filtros del admin
  useEffect(() => {
    async function loadPeople() {
      try {
        const [c, a] = await Promise.all([getUsers({ role: 'CLIENTE' }), getUsers({ role: 'AGENTE' })]);
        const byName = (x: User, y: User) => x.name.localeCompare(y.name, 'es');
        setCustomers(c.sort(byName));
        setAgents(a.sort(byName));
      } catch {
        // Sin estas listas los filtros de cliente y agente se quedan vacíos, pero la página funciona
      }
    }
    if (isAdmin) loadPeople();
  }, [isAdmin]);

  // Al cambiar un filtro se vuelve a la primera página
  function filterBy(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  let visible = tickets;
  if (search) {
    visible = visible.filter((t) => {
      const text = t.code + t.subject + t.customer.name + (t.agent?.name || '');
      return text.toLowerCase().includes(search.toLowerCase());
    });
  }
  const filtering = Boolean(status || priority || category || customerName || agentName || search);

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
            <button className={status === '' ? 'tab tab-active' : 'tab'} onClick={() => filterBy(setStatus)('')}>Todos</button>
            {TICKET_STATUSES.map((s) => (
              <button key={s} className={status === s ? 'tab tab-active' : 'tab'} onClick={() => filterBy(setStatus)(s)}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="tabs">
            <select className="table-search" aria-label="Filtrar por prioridad" value={priority} onChange={(e) => filterBy(setPriority)(e.target.value)}>
              <option value="">Toda prioridad</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabels[p]}</option>
              ))}
            </select>
            {/* Las categorías son los tipos de consulta (las mismas que elige el cliente al escribir) */}
            {!isCustomer && (
              <select className="table-search" aria-label="Filtrar por categoría" value={category} onChange={(e) => filterBy(setCategory)(e.target.value)}>
                <option value="">Todas las categorías</option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
            )}
            {isAdmin && (
              <>
                <select className="table-search" aria-label="Filtrar por cliente" value={customerName} onChange={(e) => filterBy(setCustomerName)(e.target.value)}>
                  <option value="">Todos los clientes</option>
                  {customers.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
                <select className="table-search" aria-label="Filtrar por agente" value={agentName} onChange={(e) => filterBy(setAgentName)(e.target.value)}>
                  <option value="">Todos los agentes</option>
                  <option value="sin-asignar">Sin asignar</option>
                  {agents.map((a) => <option key={a._id} value={a.name}>{a.name}</option>)}
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
            {!filtering ? (
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
          <table className="table table-linked">
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
                  <td className="cell-title">{t.subject}</td>
                  {!isCustomer && <td data-label="Cliente">{t.customer.name}</td>}
                  <td data-label="Categoría" className="cell-muted">{categoryLabels[t.category]}</td>
                  <td data-label="Prioridad"><span className={priorityClass(t.priority)}>{priorityLabels[t.priority]}</span></td>
                  <td data-label="Estado"><span className={'status-badge status-' + t.status.toLowerCase()}>{statusLabels[t.status]}</span></td>
                  {isAdmin && <td data-label="Agente" className={t.agent ? '' : 'cell-muted'}>{t.agent ? t.agent.name : 'Sin asignar'}</td>}
                  <td data-label="Fecha" className="cell-muted cell-code">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="table-foot">
        <p>
          {search ? `${visible.length} de ${tickets.length} en esta página · ` : ''}
          {total} {isCustomer ? (total === 1 ? 'consulta' : 'consultas') : (total === 1 ? 'ticket' : 'tickets')}
        </p>
        {totalPages > 1 && (
          <div className="pager">
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
          </div>
        )}
      </div>
    </main>
  );
}

export default Tickets;
