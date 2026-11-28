import { useEffect, useId, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getTicketsPage, useTicketOptions } from '../api/tickets';
import type { TicketFilters } from '../api/tickets';
import { getAllUsers, searchUsers } from '../api/users';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/useAuth';
import { categoryLabels, formatDate, formatNumber, priorityClass, priorityLabels, statusLabel } from '../utils/labels';
import type { Page, Ticket, User } from '../types';
import { TableSkeleton } from '../components/Skeleton';

const PER_PAGE = 20;

// El backend ordena por prioridad (y, dentro de cada una, lo más nuevo primero): solo se elige el sentido
const SORTS: Record<string, Pick<TicketFilters, 'order'>> = {
  'prioridad-alta': { order: 'desc' },
  'prioridad-baja': { order: 'asc' },
};

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
  // Solo admin: los resueltos cuyo cliente ha pedido reabrir
  const reopenOnly = isAdmin && searchParams.get('reabrir') === '1';
  const sort = SORTS[searchParams.get('orden') || ''] ? searchParams.get('orden')! : 'prioridad-alta';
  const search = searchParams.get('q') || '';
  const page = Math.max(1, Math.floor(Number(searchParams.get('pagina'))) || 1);
  const key = [status, priority, category, customerName, agentName, reopenOnly, sort, page].join('|');

  const options = useTicketOptions();
  const [result, setResult] = useState<{ key: string; page: Page<Ticket> } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [agents, setAgents] = useState<User[]>([]);
  // Cliente: se escribe y se sugieren nombres con GET /users/search (el backend filtra por el nombre exacto)
  const [customerText, setCustomerText] = useState(customerName);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const customersId = useId();
  const [showMore, setShowMore] = useState(false);

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
      reopenRequested: reopenOnly,
      ...SORTS[sort],
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
  }, [key, status, priority, category, customerName, agentName, reopenOnly, sort, page, attempt]);

  // Agentes para el filtro del admin (todas las páginas: son pocos)
  useEffect(() => {
    if (!isAdmin) return;
    let current = true;
    getAllUsers({ role: 'AGENTE' }).then(
      (a) => {
        if (current) setAgents(a.sort((x, y) => x.name.localeCompare(y.name, 'es')));
      },
      () => {
        // Sin la lista, el filtro de agente se queda vacío, pero la página funciona
      },
    );
    return () => {
      current = false;
    };
  }, [isAdmin]);

  // Sugerencias de clientes mientras se escribe (con una pausa corta para no pedir en cada tecla)
  useEffect(() => {
    if (!isAdmin || customerText.trim().length < 2 || customerText === customerName) return;
    let current = true;
    const timer = setTimeout(() => {
      searchUsers('CLIENTE', customerText).then(
        (list) => {
          if (current) setSuggestions(list.map((u) => u.name));
        },
        () => {
          if (current) setSuggestions([]);
        },
      );
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [isAdmin, customerText, customerName]);

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
  const filtering = Boolean(status || priority || category || customerName || agentName || reopenOnly || search);

  // Filtros de "Más filtros" que están puestos, para enseñarlos como etiquetas que se quitan con un clic
  const chips: { key: string; label: string }[] = [];
  if (!isCustomer && priority) chips.push({ key: 'prioridad', label: `Prioridad: ${priorityLabels[Number(priority)]}` });
  if (category) chips.push({ key: 'categoria', label: `Categoría: ${categoryLabels[category] || category}` });
  if (customerName) chips.push({ key: 'cliente', label: `Cliente: ${customerName}` });
  if (agentName) chips.push({ key: 'agente', label: agentName === 'sin-asignar' ? 'Sin agente' : `Agente: ${agentName}` });
  if (reopenOnly) chips.push({ key: 'reabrir', label: 'Piden reabrir' });

  function removeChip(key: string) {
    if (key === 'cliente') setCustomerText('');
    changeUrl({ [key]: '' });
  }

  function clearAll() {
    setCustomerText('');
    setSearchParams({}, { replace: true });
  }
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
        <div className="table-tools ticket-tools">
          {/* Fila 1: el estado, que es el filtro de todos los días */}
          <div className="tabs" role="group" aria-label="Filtrar por estado">
            <button className={status === '' ? 'tab tab-active' : 'tab'} aria-pressed={status === ''} onClick={() => changeUrl({ estado: '' })}>Todos</button>
            {options.statuses.map((s) => (
              <button key={s} className={status === s ? 'tab tab-active' : 'tab'} aria-pressed={status === s} onClick={() => changeUrl({ estado: s })}>
                {statusLabel(s, isCustomer)}
              </button>
            ))}
          </div>

          {/* Fila 2: buscar, el resto de filtros plegados y el orden */}
          <div className="ticket-tools-row">
            <input
              className="table-search"
              type="search"
              aria-label={isCustomer ? 'Buscar en esta página de consultas' : 'Buscar en esta página de tickets'}
              placeholder="Buscar en esta página…"
              value={search}
              onChange={(e) => changeUrl({ q: e.target.value }, true)}
            />
            {isCustomer ? (
              <select className="table-search ticket-tools-select" aria-label="Filtrar por prioridad" value={priority} onChange={(e) => changeUrl({ prioridad: e.target.value })}>
                <option value="">Toda prioridad</option>
                {options.priorities.map((p) => <option key={p} value={p}>{priorityLabels[p]}</option>)}
              </select>
            ) : (
              <button
                type="button"
                className="btn btn-outline ticket-tools-more"
                aria-expanded={showMore}
                aria-controls="ticket-more-filters"
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? 'Menos filtros' : 'Más filtros'}
                {chips.length > 0 && <span className="ticket-tools-count">{chips.length}</span>}
              </button>
            )}
            <select className="table-search ticket-tools-select ticket-tools-sort" aria-label="Ordenar" value={sort} onChange={(e) => changeUrl({ orden: e.target.value === 'prioridad-alta' ? '' : e.target.value })}>
              <option value="prioridad-alta">Prioridad alta primero</option>
              <option value="prioridad-baja">Prioridad baja primero</option>
            </select>
          </div>

          {/* Filtros plegados (agente y admin) */}
          {!isCustomer && showMore && (
            <div id="ticket-more-filters" className="ticket-more">
              <label>
                Prioridad
                <select value={priority} onChange={(e) => changeUrl({ prioridad: e.target.value })}>
                  <option value="">Toda prioridad</option>
                  {options.priorities.map((p) => <option key={p} value={p}>{priorityLabels[p]}</option>)}
                </select>
              </label>
              {/* Las categorías son los tipos de consulta (las mismas que elige el cliente al escribir) */}
              <label>
                Categoría
                <select value={category} onChange={(e) => changeUrl({ categoria: e.target.value })}>
                  <option value="">Todas</option>
                  {options.categories.map((c) => <option key={c} value={c}>{categoryLabels[c] || c}</option>)}
                </select>
              </label>
              {isAdmin && (
                <>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      changeUrl({ cliente: customerText.trim() });
                    }}
                  >
                    <label>
                      Cliente
                      <input
                        type="search"
                        placeholder="Escribe y elige un nombre"
                        list={customersId}
                        autoComplete="off"
                        value={customerText}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomerText(value);
                          // Vaciar el campo quita el filtro; elegir una sugerencia lo aplica al momento
                          if (!value) changeUrl({ cliente: '' });
                          else if (suggestions.includes(value)) changeUrl({ cliente: value });
                        }}
                      />
                    </label>
                    <datalist id={customersId}>
                      {suggestions.map((name) => <option key={name} value={name} />)}
                    </datalist>
                  </form>
                  <label>
                    Agente
                    <select value={agentName} onChange={(e) => changeUrl({ agente: e.target.value })}>
                      <option value="">Todos</option>
                      <option value="sin-asignar">Sin asignar</option>
                      {agentName && agentName !== 'sin-asignar' && !agents.some((a) => a.name === agentName) && <option value={agentName}>{agentName}</option>}
                      {agents.map((a) => <option key={a._id} value={a.name}>{a.name}</option>)}
                    </select>
                  </label>
                  <label className="table-check">
                    <input type="checkbox" checked={reopenOnly} onChange={(e) => changeUrl({ reabrir: e.target.checked ? '1' : '' })} />
                    Solo los que piden reabrir
                  </label>
                </>
              )}
            </div>
          )}

          {/* Filtros aplicados, cada uno se quita con un clic */}
          {chips.length > 0 && (
            <ul className="filter-chips" aria-label="Filtros aplicados">
              {chips.map((c) => (
                <li key={c.key}>
                  <button type="button" className="filter-chip" onClick={() => removeChip(c.key)} aria-label={`Quitar el filtro ${c.label}`}>
                    {c.label}
                    <span className="filter-chip-remove">quitar</span>
                  </button>
                </li>
              ))}
              {chips.length > 1 && (
                <li>
                  <button type="button" className="link-button" onClick={clearAll}>Quitar todos</button>
                </li>
              )}
            </ul>
          )}
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
                  ? reopenOnly
                    ? 'Ningún cliente está pidiendo reabrir una consulta resuelta.'
                    : 'Cambia el estado, la prioridad, la categoría, el cliente, el agente o el texto de búsqueda.'
                  : isCustomer
                    ? 'Cambia el estado, la prioridad o el texto de búsqueda.'
                    : 'Cambia el estado, la prioridad, la categoría o el texto de búsqueda.'}{' '}
                <button type="button" className="link-button" onClick={clearAll}>Quitar filtros</button>
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
