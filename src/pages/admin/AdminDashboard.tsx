import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTicketStats, getTicketsPage } from '../../api/tickets';
import { getDashboard, getPropertyStats, getTicketsByAgent, getUserStats } from '../../api/stats';
import type { AgentLoad, Dashboard, PropertyStats, UserStats } from '../../api/stats';
import { getAllUsers } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import { formatDate, formatDateTime, formatNumber, priorityClass, priorityLabels, roleLabels, statusLabels } from '../../utils/labels';
import type { Ticket, TicketStats, User } from '../../types';
import { TableSkeleton } from '../../components/Skeleton';
import BarList from '../../components/BarList';
import type { BarItem } from '../../components/BarList';

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

  // Tickets por estado, en el orden del ciclo de vida, enlazados a la lista filtrada
  const statusBars: BarItem[] = stats
    ? [
        { label: 'Abiertos', value: stats.abiertos, to: '/admin/tickets?estado=ABIERTO' },
        { label: 'En curso', value: stats.enCurso, to: '/admin/tickets?estado=EN_CURSO' },
        { label: 'Pendientes del cliente', value: stats.pendienteCliente, to: '/admin/tickets?estado=PENDIENTE_CLIENTE' },
        { label: 'Resueltos', value: stats.resueltos, to: '/admin/tickets?estado=RESUELTO' },
        { label: 'Cerrados', value: stats.cerrados, to: '/admin/tickets?estado=CERRADO' },
      ]
    : [];
  const agentBars: BarItem[] = [...agents]
    .sort((a, b) => b.total - a.total)
    .map((a) => ({
      label: a.name,
      value: a.total,
      detail: `${formatNumber(a.abiertos)} ${a.abiertos === 1 ? 'abierto' : 'abiertos'} · ${formatNumber(a.resueltos + a.cerrados)} resueltos o cerrados`,
      to: '/admin/tickets?agente=' + encodeURIComponent(a.name),
    }));
  const propertyBars: BarItem[] = propertyStats
    ? [
        { label: 'Publicadas', value: propertyStats.active, to: '/admin/propiedades' },
        { label: 'Reservadas', value: propertyStats.reservadas, to: '/admin/propiedades?estado=Reservada' },
        { label: 'Vendidas', value: propertyStats.vendidas, to: '/admin/propiedades?estado=Vendida' },
        { label: 'Alquiladas', value: propertyStats.alquiladas, to: '/admin/propiedades?estado=Alquilada' },
        { label: 'Desactivadas', value: propertyStats.inactive },
      ]
    : [];
  const userBars: BarItem[] = userStats
    ? [
        { label: 'Clientes', value: roleTotal('CLIENTE'), to: '/admin/usuarios?rol=CLIENTE' },
        { label: 'Agentes', value: roleTotal('AGENTE'), to: '/admin/usuarios?rol=AGENTE' },
        { label: 'Administradores', value: roleTotal('ADMIN'), to: '/admin/usuarios?rol=ADMIN' },
      ]
    : [];

  return (
    <main className="page admin-dashboard">
      <title>Resumen · Administración · CataHome</title>

      <header className="admin-head">
        <div>
          <h1 className="page-title">Resumen</h1>
          <p className="page-subtitle">
            {filtered
              ? `Tickets${agentName ? ` de ${agentName}` : ''}${from ? ` creados desde el ${formatDay(from)}` : ''}${to ? `${from ? '' : ' creados'} hasta el ${formatDay(to)}` : ''}.`
              : 'Cómo van las consultas, quién las atiende y cómo está el catálogo.'}
          </p>
        </div>
        <form className="admin-toolbar" onSubmit={(e) => e.preventDefault()} aria-label="Filtrar el resumen">
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
      </header>
      {rangeError && <p className="field-error" role="alert">{rangeError}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      {!stats && !error && <TableSkeleton rows={4} />}

      {stats && (
        <>
          {/* Cifras clave ordenadas por urgencia. El bloque en vino es lo que hay que hacer ya:
              tickets sin agente (o, si se filtra por agente, sus pendientes). Cada cifra lleva a su lista */}
          <section className="admin-kpis" aria-label="Cifras clave">
            {!agentId && (
              <Link to="/admin/tickets?agente=sin-asignar" className="admin-kpi admin-kpi-main">
                <span className="admin-kpi-label">Esperan agente</span>
                <span className="admin-kpi-value">{formatNumber(stats.sinAsignar)}</span>
                <span className="admin-kpi-note">{stats.sinAsignar > 0 ? 'Asígnalos para que alguien responda' : 'Todos tienen agente'}</span>
              </Link>
            )}
            <Link to="/admin/tickets?estado=RESUELTO&reabrir=1" className="admin-kpi">
              <span className="admin-kpi-label">Piden reabrir</span>
              <span className="admin-kpi-value">{formatNumber(reopen.length)}</span>
              <span className="admin-kpi-note">{reopen.length > 0 ? 'Acepta o rechaza la petición' : 'Ninguna petición'}</span>
            </Link>
            <Link to="/admin/tickets?estado=ABIERTO" className={agentId ? 'admin-kpi admin-kpi-main' : 'admin-kpi'}>
              <span className="admin-kpi-label">Pendientes de respuesta</span>
              <span className="admin-kpi-value">{formatNumber(pending)}</span>
              <span className="admin-kpi-note">{formatNumber(stats.abiertos)} abiertos · {formatNumber(stats.enCurso)} en curso</span>
            </Link>
            <Link to="/admin/tickets?estado=PENDIENTE_CLIENTE" className="admin-kpi">
              <span className="admin-kpi-label">Esperando al cliente</span>
              <span className="admin-kpi-value">{formatNumber(stats.pendienteCliente)}</span>
              <span className="admin-kpi-note">Ya respondidos por el equipo</span>
            </Link>
          </section>

          <div className="admin-grid">
            {/* Columna principal: lo que hay que hacer hoy */}
            <div className="admin-col">
              <section className="admin-panel" aria-labelledby="admin-status-title">
                <div className="admin-panel-head">
                  <h2 id="admin-status-title">Tickets por estado</h2>
                  <Link to="/admin/tickets">Ver todos</Link>
                </div>
                <BarList items={statusBars} total={stats.total} label="Tickets por estado" />
                <p className="admin-panel-foot">
                  {formatNumber(stats.total)} tickets en total · {formatNumber(stats.resueltos + stats.cerrados)} resueltos o cerrados
                </p>
              </section>

              {reopen.length > 0 && (
                <section className="admin-panel admin-panel-attention" aria-labelledby="admin-reopen-title">
                  <div className="admin-panel-head">
                    <h2 id="admin-reopen-title">Piden reabrir <span className="admin-count">{reopen.length}</span></h2>
                    <Link to="/admin/tickets?estado=RESUELTO&reabrir=1">Ver todas las peticiones</Link>
                  </div>
                  <TicketTable tickets={reopen} />
                </section>
              )}

              <section className="admin-panel" aria-labelledby="admin-unassigned-title">
                <div className="admin-panel-head">
                  <h2 id="admin-unassigned-title">Esperan agente {unassigned.length > 0 && <span className="admin-count">{unassignedTotal <= 10 ? unassigned.length : `${unassigned.length}+`}</span>}</h2>
                  <Link to="/admin/tickets?agente=sin-asignar">Ver todos sin agente</Link>
                </div>
                {unassigned.length === 0 ? (
                  <div className="empty"><strong>Todos los tickets tienen agente</strong>No hay nada pendiente de asignar.</div>
                ) : (
                  <TicketTable tickets={unassigned} />
                )}
              </section>

              {dashboard && dashboard.recentActivity.messages.length > 0 && (
                <section className="admin-panel" aria-labelledby="admin-messages-title">
                  <div className="admin-panel-head">
                    <h2 id="admin-messages-title">Últimos mensajes</h2>
                    <Link to="/admin/actividad">Ver la actividad</Link>
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
                </section>
              )}
            </div>

            {/* Columna lateral: equipo y catálogo, en bloques de piedra */}
            <aside className="admin-col admin-col-side" aria-label="Equipo y catálogo">
              {agentBars.length > 0 && (
                <section className="admin-panel admin-panel-tint" aria-labelledby="admin-agents-title">
                  <div className="admin-panel-head">
                    <h2 id="admin-agents-title">Carga por agente</h2>
                  </div>
                  <BarList items={agentBars} label="Tickets asignados a cada agente" />
                </section>
              )}
              {propertyStats && (
                <section className="admin-panel admin-panel-tint" aria-labelledby="admin-props-title">
                  <div className="admin-panel-head">
                    <h2 id="admin-props-title">Casas</h2>
                    <Link to="/admin/propiedades">Gestionar</Link>
                  </div>
                  <BarList items={propertyBars} total={propertyStats.active + propertyStats.inactive} label="Casas por estado" />
                </section>
              )}
              {userStats && (
                <section className="admin-panel admin-panel-tint" aria-labelledby="admin-users-title">
                  <div className="admin-panel-head">
                    <h2 id="admin-users-title">Usuarios</h2>
                    <Link to="/admin/usuarios">Gestionar</Link>
                  </div>
                  <BarList items={userBars} label="Usuarios por rol" />
                  <p className="admin-panel-foot">
                    {formatNumber(userStats.active)} cuentas activas · {formatNumber(userStats.inactive)} desactivadas
                  </p>
                </section>
              )}
            </aside>
          </div>
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

// Tabla compacta para los bloques del resumen: código, asunto con su cliente debajo, prioridad y fecha
function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="table table-linked admin-table-compact">
        <thead>
          <tr><th>Código</th><th>Asunto</th><th>Prioridad</th><th>Creado</th></tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t._id}>
              <td className="cell-code"><Link to={`/admin/tickets/${t._id}`}>{t.code}</Link></td>
              <td className="cell-title">
                {t.subject}
                <span className="admin-table-sub">{t.customer.name} · {statusLabels[t.status]}</span>
              </td>
              <td data-label="Prioridad"><span className={priorityClass(t.priority)}>{priorityLabels[t.priority]}</span></td>
              <td data-label="Creado" className="cell-muted cell-code">{formatDate(t.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
