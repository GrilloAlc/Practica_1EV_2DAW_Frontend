import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTicketStats, getTicketsPage } from '../../api/tickets';
import { getDashboard, getPropertyStats, getTicketsByAgent, getUserStats } from '../../api/stats';
import type { AgentLoad, Dashboard, PropertyStats, UserStats } from '../../api/stats';
import { getAllUsers } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import { formatDateTime, formatNumber, priorityClass, priorityLabels, roleLabels, statusLabels } from '../../utils/labels';
import type { Ticket, TicketStats, User } from '../../types';
import { TableSkeleton } from '../../components/Skeleton';

function AdminDashboard() {
  // Fechas y agente en la URL (?desde=2026-11-01&hasta=2026-11-30&agente=<id>): así se puede volver o compartir
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get('desde') || '';
  const to = searchParams.get('hasta') || '';
  const agentId = searchParams.get('agente') || '';

  const [stats, setStats] = useState<TicketStats | null>(null);
  const [unassigned, setUnassigned] = useState<Ticket[]>([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [reopen, setReopen] = useState<Ticket[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [agents, setAgents] = useState<AgentLoad[]>([]);
  const [agentList, setAgentList] = useState<User[]>([]);
  const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  const [rangeError, setRangeError] = useState('');

  // Lo que espera agente o reapertura no depende de las fechas: se pide una vez
  useEffect(() => {
    // El backend filtra los resueltos con petición de reapertura y los tickets sin agente
    Promise.all([getTicketsPage({ unassigned: true, limit: 10 }), getTicketsPage({ status: 'RESUELTO', reopenRequested: true, limit: 10 })]).then(
      ([unassignedPage, reopenPage]) => {
        // Los cerrados sin agente ya no esperan a nadie (el backend no permite excluir un estado)
        setUnassigned(unassignedPage.data.filter((t) => t.status !== 'CERRADO'));
        setUnassignedTotal(unassignedPage.pagesData.total);
        setReopen(reopenPage.data);
      },
      (err) => setError(getErrorMessage(err)),
    );
    getAllUsers({ role: 'AGENTE' }).then(setAgentList, () => setAgentList([]));
    // Usuarios por rol: el backend no la filtra por fechas
    getUserStats().then(setUserStats, () => setUserStats(null));
  }, []);

  // Cifras que cambian con las fechas (y con el agente, las de tickets)
  useEffect(() => {
    let current = true;
    const range = { from: from || undefined, to: to || undefined };
    getTicketStats({ ...range, agentId: agentId || undefined }).then(
      (result) => {
        if (!current) return;
        setStats(result);
        setError('');
      },
      (err) => {
        if (current) setError(getErrorMessage(err));
      },
    );
    // Datos de apoyo: si fallan, el resumen principal se sigue viendo
    Promise.all([getDashboard(range), getTicketsByAgent(range), getPropertyStats(range)]).then(
      ([dash, byAgent, props]) => {
        if (!current) return;
        setDashboard(dash);
        setAgents(byAgent);
        setPropertyStats(props);
      },
      () => {
        if (current) setDashboard(null);
      },
    );
    return () => {
      current = false;
    };
  }, [from, to, agentId]);

  function changeUrl(values: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const k in values) {
      if (values[k]) params.set(k, values[k]);
      else params.delete(k);
    }
    // No deja aplicar un rango al revés
    const newFrom = params.get('desde');
    const newTo = params.get('hasta');
    if (newFrom && newTo && newFrom > newTo) {
      setRangeError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }
    setRangeError('');
    setSearchParams(params, { replace: true });
  }

  const pending = stats ? stats.abiertos + stats.enCurso + stats.pendienteCliente : 0;
  const filtered = Boolean(from || to || agentId);
  const agentName = agentList.find((a) => a._id === agentId)?.name;
  const roleTotal = (role: string) => userStats?.roles.find((r) => r._id === role)?.total ?? 0;

  return (
    <main className="page">
      <title>Resumen · Administración · CataHome</title>
      <h1 className="page-title">Resumen</h1>
      <p className="page-subtitle">Estado de las consultas, lo que espera agente, la carga de cada agente y el catálogo.</p>

      <form className="admin-filters admin-range" onSubmit={(e) => e.preventDefault()} aria-label="Filtrar el resumen">
        <label>
          Desde
          <input type="date" value={from} max={to || undefined} onChange={(e) => changeUrl({ desde: e.target.value })} />
        </label>
        <label>
          Hasta
          <input type="date" value={to} min={from || undefined} onChange={(e) => changeUrl({ hasta: e.target.value })} />
        </label>
        <label>
          Agente
          <select value={agentId} onChange={(e) => changeUrl({ agente: e.target.value })}>
            <option value="">Todos</option>
            {agentList.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </label>
        {filtered && <button type="button" className="link-button" onClick={() => setSearchParams({}, { replace: true })}>Quitar filtros</button>}
      </form>
      {rangeError && <p className="field-error" role="alert">{rangeError}</p>}
      {filtered && (
        <p className="admin-range-note">
          Tickets{agentName ? ` de ${agentName}` : ''}{from ? ` creados desde el ${formatDay(from)}` : ''}{to ? `${from ? '' : ' creados'} hasta el ${formatDay(to)}` : ''}.
        </p>
      )}

      {error && <p className="field-error" role="alert">{error}</p>}
      {!stats && !error && <TableSkeleton rows={4} />}

      {stats && (
        <>
          <div className="admin-stats">
            <div className="stat-card stat-card-main">
              <p className="stat-card-label">Tickets en total</p>
              <p className="stat-card-value">{formatNumber(stats.total)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card-label">Abiertos</p>
              <p className="stat-card-value">{formatNumber(stats.abiertos)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card-label">En curso</p>
              <p className="stat-card-value">{formatNumber(stats.enCurso)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card-label">Resueltos / cerrados</p>
              <p className="stat-card-value">{formatNumber(stats.resueltos + stats.cerrados)}</p>
            </div>
          </div>

          <dl className="admin-figures">
            <div>
              <dt>Pendientes de respuesta</dt>
              <dd>{formatNumber(pending)}</dd>
            </div>
            <div>
              <dt>Esperando al cliente</dt>
              <dd>{formatNumber(stats.pendienteCliente)}</dd>
            </div>
            {!agentId && (
              <div>
                <dt>Sin agente</dt>
                <dd>{formatNumber(stats.sinAsignar)}</dd>
              </div>
            )}
          </dl>

          {reopen.length > 0 && (
            <>
              <div className="page-header">
                <h2 className="admin-section-title">Piden reabrir ({reopen.length})</h2>
                <Link to="/admin/tickets?estado=RESUELTO&reabrir=1" className="btn btn-outline">Ver todas las peticiones</Link>
              </div>
              <div className="table-box admin-block">
                <TicketTable tickets={reopen} />
              </div>
            </>
          )}

          <div className="page-header">
            <h2 className="admin-section-title">Esperan agente{unassignedTotal <= 10 ? ` (${unassigned.length})` : ''}</h2>
            <Link to="/admin/tickets?agente=sin-asignar" className="btn btn-outline">Ver todos los tickets sin agente</Link>
          </div>
          <div className="table-box admin-block">
            {unassigned.length === 0 ? (
              <div className="empty"><strong>Todos los tickets tienen agente</strong>No hay nada pendiente de asignar.</div>
            ) : (
              <TicketTable tickets={unassigned} />
            )}
          </div>

          {agents.length > 0 && (
            <>
              <h2 className="admin-section-title admin-block-title">Carga de cada agente</h2>
              <div className="table-box admin-block">
                <table className="table">
                  <thead>
                    <tr><th>Agente</th><th>Asignados</th><th>Abiertos</th><th>Resueltos</th><th>Cerrados</th></tr>
                  </thead>
                  <tbody>
                    {agents.map((a) => (
                      <tr key={a.agentId}>
                        <td className="cell-title">
                          <Link to={'/admin/tickets?agente=' + encodeURIComponent(a.name)}>{a.name}</Link>
                        </td>
                        <td data-label="Asignados" className="cell-code">{a.total}</td>
                        <td data-label="Abiertos" className="cell-code">{a.abiertos}</td>
                        <td data-label="Resueltos" className="cell-code">{a.resueltos}</td>
                        <td data-label="Cerrados" className="cell-code">{a.cerrados}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(propertyStats || userStats) && (
            <div className="admin-catalog admin-block">
              {propertyStats && (
                <section aria-labelledby="admin-props-title">
                  <div className="page-header">
                    <h2 id="admin-props-title" className="admin-section-title">Casas</h2>
                    <Link to="/admin/propiedades" className="btn btn-outline">Ver las casas</Link>
                  </div>
                  <dl className="admin-figures admin-figures-flat">
                    <div><dt>Publicadas</dt><dd>{formatNumber(propertyStats.active)}</dd></div>
                    <div><dt>Desactivadas</dt><dd>{formatNumber(propertyStats.inactive)}</dd></div>
                    <div><dt>Vendidas</dt><dd>{formatNumber(propertyStats.vendidas)}</dd></div>
                    <div><dt>Alquiladas</dt><dd>{formatNumber(propertyStats.alquiladas)}</dd></div>
                    <div><dt>Reservadas</dt><dd>{formatNumber(propertyStats.reservadas)}</dd></div>
                  </dl>
                </section>
              )}
              {userStats && (
                <section aria-labelledby="admin-users-title">
                  <div className="page-header">
                    <h2 id="admin-users-title" className="admin-section-title">Usuarios</h2>
                    <Link to="/admin/usuarios" className="btn btn-outline">Ver los usuarios</Link>
                  </div>
                  <dl className="admin-figures admin-figures-flat">
                    <div><dt>{roleLabels.CLIENTE}s</dt><dd>{formatNumber(roleTotal('CLIENTE'))}</dd></div>
                    <div><dt>{roleLabels.AGENTE}s</dt><dd>{formatNumber(roleTotal('AGENTE'))}</dd></div>
                    <div><dt>Administradores</dt><dd>{formatNumber(roleTotal('ADMIN'))}</dd></div>
                    <div><dt>Cuentas activas</dt><dd>{formatNumber(userStats.active)}</dd></div>
                    <div><dt>Desactivadas</dt><dd>{formatNumber(userStats.inactive)}</dd></div>
                  </dl>
                </section>
              )}
            </div>
          )}

          {dashboard && dashboard.recentActivity.messages.length > 0 && (
            <>
              <div className="page-header">
                <h2 className="admin-section-title">Últimos mensajes</h2>
                <Link to="/admin/actividad" className="btn btn-outline">Ver los cambios de estado</Link>
              </div>
              <ul className="admin-activity">
                {dashboard.recentActivity.messages.map((m) => (
                  <li key={m._id}>
                    <p className="admin-activity-head">
                      <strong>{m.author?.name || 'Usuario eliminado'}</strong>
                      {m.author?.role && <span>{roleLabels[m.author.role]}</span>}
                      <span>{formatDateTime(m.createdAt)}</span>
                    </p>
                    <p className="admin-activity-body">{m.body}</p>
                    {m.ticket && (
                      <Link to={`/admin/tickets/${m.ticket._id}`} className="admin-activity-link">
                        {m.ticket.code} · {m.ticket.subject}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  );
}

// "2026-11-05" → "5/11/2026"
function formatDay(day: string) {
  const [y, m, d] = day.split('-');
  return `${Number(d)}/${Number(m)}/${y}`;
}

function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <table className="table table-linked">
      <thead>
        <tr><th>Código</th><th>Asunto</th><th>Cliente</th><th>Prioridad</th><th>Estado</th><th>Fecha</th></tr>
      </thead>
      <tbody>
        {tickets.map((t) => (
          <tr key={t._id}>
            <td className="cell-code"><Link to={`/admin/tickets/${t._id}`}>{t.code}</Link></td>
            <td className="cell-title">{t.subject}</td>
            <td data-label="Cliente">{t.customer.name}</td>
            <td data-label="Prioridad"><span className={priorityClass(t.priority)}>{priorityLabels[t.priority]}</span></td>
            <td data-label="Estado"><span className={'status-badge status-' + t.status.toLowerCase()}>{statusLabels[t.status]}</span></td>
            <td data-label="Fecha" className="cell-muted cell-code">{formatDateTime(t.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default AdminDashboard;
