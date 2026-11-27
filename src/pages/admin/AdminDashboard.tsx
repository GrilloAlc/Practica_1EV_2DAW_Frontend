import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTicketStats, getTicketsPage } from '../../api/tickets';
import { getDashboard, getTicketsByAgent } from '../../api/stats';
import type { AgentLoad, Dashboard } from '../../api/stats';
import { getErrorMessage } from '../../api/client';
import { formatDateTime, formatNumber, priorityClass, priorityLabels, roleLabels, statusLabels } from '../../utils/labels';
import type { Ticket, TicketStats } from '../../types';
import { TableSkeleton } from '../../components/Skeleton';

function AdminDashboard() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [unassigned, setUnassigned] = useState<Ticket[]>([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [reopen, setReopen] = useState<Ticket[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [agents, setAgents] = useState<AgentLoad[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [statsResult, unassignedPage, reopenPage] = await Promise.all([
          getTicketStats(),
          getTicketsPage({ unassigned: true, limit: 10 }),
          getTicketsPage({ reopenRequested: true, limit: 10 }),
        ]);
        setStats(statsResult);
        // Los cerrados sin agente ya no esperan a nadie
        setUnassigned(unassignedPage.data.filter((t) => t.status !== 'CERRADO'));
        setUnassignedTotal(unassignedPage.pagesData.total);
        setReopen(reopenPage.data.filter((t) => t.status === 'RESUELTO'));
      } catch (err) {
        setError(getErrorMessage(err));
      }
      // Datos de apoyo: si fallan, el resumen principal se sigue viendo
      try {
        const [dash, byAgent] = await Promise.all([getDashboard(), getTicketsByAgent()]);
        setDashboard(dash);
        setAgents(byAgent);
      } catch {
        setDashboard(null);
      }
    }
    loadData();
  }, []);

  const pending = stats ? stats.abiertos + stats.enCurso + stats.pendienteCliente : 0;

  return (
    <main className="page">
      <title>Resumen · Administración · CataHome</title>
      <h1 className="page-title">Resumen</h1>
      <p className="page-subtitle">Estado de las consultas, lo que espera agente y la carga de cada agente.</p>

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
            <div>
              <dt>Sin agente</dt>
              <dd>{formatNumber(stats.sinAsignar ?? unassignedTotal)}</dd>
            </div>
            {dashboard && (
              <>
                <div>
                  <dt>Casas publicadas</dt>
                  <dd>{formatNumber(dashboard.properties.active)}</dd>
                </div>
                <div>
                  <dt>Usuarios activos</dt>
                  <dd>{formatNumber(dashboard.users.active)}</dd>
                </div>
              </>
            )}
          </dl>

          {reopen.length > 0 && (
            <>
              <div className="page-header">
                <h2 className="admin-section-title">Piden reabrir ({reopen.length})</h2>
                <Link to="/admin/tickets?estado=RESUELTO" className="btn btn-outline">Ver resueltos</Link>
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

          {dashboard && dashboard.recentActivity.messages.length > 0 && (
            <>
              <h2 className="admin-section-title admin-block-title">Últimos mensajes</h2>
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
