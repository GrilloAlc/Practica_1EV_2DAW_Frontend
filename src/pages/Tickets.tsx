import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getTicketsPage } from '../api/tickets';
import { getAllUsers } from '../api/users';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/useAuth';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, categoryLabels, formatDate, formatNumber, priorityClass, priorityLabels, statusLabel } from '../utils/labels';
import type { Page, Ticket, User } from '../types';
import { TableSkeleton } from '../components/Skeleton';

const PER_PAGE = 20;

// Lista compartida por cliente, agente y admin. Las columnas cambian según el rol.
// Los filtros los aplica el backend y se guardan en la URL: al volver de una consulta siguen puestos.
// La búsqueda por texto solo busca en la página cargada
function Tickets({ title, subtitle }: { title: string; subtitle: string }) {
  const { user } = useAuth();
  const isCustomer = user!.role === 'CLIENTE';
  const isAdmin = user!.role === 'ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();
  // Nombre de quien acaba de crear su cuenta (lo deja la pantalla de acceso)
  const welcome = (useLocation().state as { welcome?: string } | null)?.welcome;

  const status = searchParams.get('estado') || '';
  const priority = searchParams.get('prioridad') || '';
  const category = searchParams.get('categoria') || '';
  const customerName = isAdmin ? searchParams.get('cliente') || '' : '';
  const agentName = isAdmin ? searchParams.get('agente') || '' : '';
  const search = searchParams.get('q') || '';
  const page = Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1);
  const key = [status, priority, category, customerName, agentName, page].join('|');

  const [result, setResult] = useState<{ key: string; page: Page<Ticket> } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [customers, setCustomers] = useState<User[]>([]);
  const [agents, setAgents] = useState<User[]>([]);

  // Se vuelve a pedir la lista cada vez que cambia un filtro o la página
  useEffect(() => {
    let current = true;
    getTicketsPage({
      status: status || undefined,
      priority: priority ? Number(priority) : undefined,
      category: category || undefined,
      customerName: customerName || undefined,
      agentName: agentName && agentName !== 'sin-asignar' ? agentName : undefined,
      unassigned: agentName === 'sin-asignar',
      page,
      limit: PER_PAGE,
    }).then(
      (res) => {
        if (!current) return;
        setResult({ key, page: res });
        setError(null);
      },
      (err) => {
        if (current) setError({ key, message: getErrorMessage(err) });
      },
    );
    return () => {
      current = false;
    };
  }, [key, status, priority, category, customerName, agentName, page, attempt]);

  // Clientes y agentes para los filtros del admin (todas las páginas)
  useEffect(() => {
    if (!isAdmin) return;
    let current = true;
    const byName = (x: User, y: User) => x.name.localeCompare(y.name, 'es');
    Promise.all([getAllUsers({ role: 'CLIENTE' }), getAllUsers({ role: 'AGENTE' })]).then(
      ([c, a]) => {
        if (!current) return;
        setCustomers(c.sort(byName));
        setAgents(a.sort(byName));
      },
      () => {
        // Sin estas listas los filtros de cliente y agente se quedan vacíos, pero la página funciona
      },
    );
    return () => {
      current = false;
    };
  }, [isAdmin]);

  // Cambia filtros de la URL. Al cambiar un filtro se vuelve a la primera página
  function changeUrl(values: Record<string, string>, keepPage = false) {
    const params = new URLSearchParams(searchParams);
    for (const k in values) {
      if (values[k]) params.set(k, values[k]);
      else params.delete(k);
    }
    if (!keepPage) params.delete('pagina');
    setSearchParams(params, { replace: true });
  }

  const loading = result?.key !== key && error?.key !== key;
  const failed = error?.key === key ? error.message : '';
  const tickets = result?.page.data || [];
  const total = result?.page.pagesData.total ?? 0;
  const totalPages = Math.max(1, result?.page.pagesData.totalPages || 1);

  let visible = tickets;
  if (search) {
    const text = search.toLowerCase();
    visible = visible.filter((t) => (t.code + ' ' + t.subject + ' ' + t.customer.name + ' ' + (t.agent?.name || '')).toLowerCase().includes(text));
  }
  const filtering = Boolean(status || priority || category || customerName || agentName || search);
  const noun = (n: number) => (isCustomer ? (n === 1 ? 'consulta' : 'consultas') : n === 1 ? 'ticket' : 'tickets');

  return (
    <main className="page">
      <title>{`${title} · CataHome`}</title>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        {isCustomer && <Link to="/mis-tickets/nuevo" className="btn btn-acento">Nueva consulta</Link>}
      </div>

      {welcome && (
        <p className="notice" role="status">
          Te damos la bienvenida, {welcome}. Tu cuenta ya está creada: desde cualquier casa puedes preguntar o pedir una visita.
        </p>
      )}

      <div className="table-box">
        <div className="table-tools">
          <div className="tabs" role="group" aria-label="Filtrar por estado">
            <button className={status === '' ? 'tab tab-active' : 'tab'} aria-pressed={status === ''} onClick={() => changeUrl({ estado: '' })}>Todos</button>
            {TICKET_STATUSES.map((s) => (
              <button key={s} className={status === s ? 'tab tab-active' : 'tab'} aria-pressed={status === s} onClick={() => changeUrl({ estado: s })}>
                {statusLabel(s, isCustomer)}
              </button>
            ))}
          </div>
          <div className="tabs">
            <select className="table-search" aria-label="Filtrar por prioridad" value={priority} onChange={(e) => changeUrl({ prioridad: e.target.value })}>
              <option value="">Toda prioridad</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>{priorityLabels[p]}</option>
              ))}
            </select>
            {/* Las categorías son los tipos de consulta (las mismas que elige el cliente al escribir) */}
            {!isCustomer && (
              <select className="table-search" aria-label="Filtrar por categoría" value={category} onChange={(e) => changeUrl({ categoria: e.target.value })}>
                <option value="">Todas las categorías</option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
            )}
            {isAdmin && (
              <>
                <select className="table-search" aria-label="Filtrar por cliente" value={customerName} onChange={(e) => changeUrl({ cliente: e.target.value })}>
                  <option value="">Todos los clientes</option>
                  {customerName && !customers.some((c) => c.name === customerName) && <option value={customerName}>{customerName}</option>}
                  {customers.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
                <select className="table-search" aria-label="Filtrar por agente" value={agentName} onChange={(e) => changeUrl({ agente: e.target.value })}>
                  <option value="">Todos los agentes</option>
                  <option value="sin-asignar">Sin asignar</option>
                  {agentName && agentName !== 'sin-asignar' && !agents.some((a) => a.name === agentName) && <option value={agentName}>{agentName}</option>}
                  {agents.map((a) => <option key={a._id} value={a.name}>{a.name}</option>)}
                </select>
              </>
            )}
            <input
              className="table-search"
              type="search"
              aria-label={isCustomer ? 'Buscar consulta' : 'Buscar ticket'}
              placeholder="Código, asunto o nombre…"
              value={search}
              onChange={(e) => changeUrl({ q: e.target.value }, true)}
            />
          </div>
        </div>

        {failed ? (
          <div className="empty" role="alert">
            <strong>No se ha podido cargar la lista</strong>
            <p>{failed}</p>
            <button type="button" className="btn btn-outline" onClick={() => setAttempt(attempt + 1)}>Volver a intentarlo</button>
          </div>
        ) : !result ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <div className="empty">
            {!filtering ? (
              <>
                <strong>{isCustomer ? 'Aún no has hecho ninguna consulta' : isAdmin ? 'Todavía no hay consultas' : 'No tienes tickets asignados'}</strong>
                {isCustomer ? <>Cuando preguntes por una casa, la verás aquí. <Link to="/propiedades">Buscar casas</Link></> : isAdmin ? 'Cuando entre una consulta aparecerá aquí.' : 'Cuando la administración te asigne uno, aparecerá aquí.'}
              </>
            ) : (
              <>
                <strong>{isCustomer ? 'Ninguna consulta coincide' : 'Ningún ticket coincide'}</strong>
                {isAdmin
                  ? 'Cambia el estado, la prioridad, la categoría, el cliente, el agente o el texto de búsqueda.'
                  : isCustomer
                    ? 'Cambia el estado, la prioridad o el texto de búsqueda.'
                    : 'Cambia el estado, la prioridad, la categoría o el texto de búsqueda.'}{' '}
                <button type="button" className="link-button" onClick={() => setSearchParams({}, { replace: true })}>Quitar filtros</button>
              </>
            )}
          </div>
        ) : (
          <table className={loading ? 'table table-linked admin-loading' : 'table table-linked'} aria-busy={loading}>
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
                  <td className="cell-title">
                    {t.subject}
                    {t.reopenRequested && t.status === 'RESUELTO' && <span className="cell-flag">{isCustomer ? 'Has pedido reabrirla' : 'Piden reabrir'}</span>}
                  </td>
                  {!isCustomer && <td data-label="Cliente">{t.customer.name}</td>}
                  <td data-label="Categoría" className="cell-muted">{categoryLabels[t.category] || t.category}</td>
                  <td data-label="Prioridad"><span className={priorityClass(t.priority)}>{priorityLabels[t.priority]}</span></td>
                  <td data-label="Estado"><span className={'status-badge status-' + t.status.toLowerCase()}>{statusLabel(t.status, isCustomer)}</span></td>
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
          {formatNumber(total)} {noun(total)}
        </p>
        {totalPages > 1 && (
          <div className="pager">
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => changeUrl({ pagina: page === 2 ? '' : String(page - 1) }, true)}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => changeUrl({ pagina: String(page + 1) }, true)}>Siguiente</button>
          </div>
        )}
      </div>
    </main>
  );
}

export default Tickets;
