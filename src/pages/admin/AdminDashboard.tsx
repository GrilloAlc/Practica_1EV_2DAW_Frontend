import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTicketStats, getTickets } from '../../api/tickets';
import { getErrorMessage } from '../../api/client';
import { priorityLabels, statusLabels } from '../../utils/labels';
import type { Ticket, TicketStats } from '../../types';
import { TableSkeleton } from '../../components/Skeleton';

function AdminDashboard() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [unassigned, setUnassigned] = useState<Ticket[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const statsResult = await getTicketStats();
        const ticketsResult = await getTickets({ unassigned: true, limit: 10 });
        setStats(statsResult);
        setUnassigned(ticketsResult);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadData();
  }, []);

  return (
    <main className="page">
      <h1 className="page-title">Resumen</h1>
      <p className="page-subtitle">Estado de los tickets y consultas que esperan agente.</p>

      {error && <p className="field-error">{error}</p>}
      {!stats && !error && <TableSkeleton rows={4} />}

      {stats && (
        <>
          <div className="admin-stats">
            <div className="stat-card stat-card-main">
              <p className="stat-card-label">Tickets en total</p>
              <p className="stat-card-value">{stats.total}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card-label">Abiertos</p>
              <p className="stat-card-value">{stats.abiertos}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card-label">En curso</p>
              <p className="stat-card-value">{stats.enCurso}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card-label">Resueltos / cerrados</p>
              <p className="stat-card-value">{stats.resueltos + stats.cerrados}</p>
            </div>
          </div>

          <div className="page-header">
            <h2 className="admin-section-title">Esperan agente ({unassigned.length})</h2>
            <Link to="/admin/tickets" className="btn btn-outline">Ver todos los tickets</Link>
          </div>
          <div className="table-box">
            {unassigned.length === 0 ? (
              <div className="empty"><strong>Todos los tickets tienen agente</strong>No hay nada pendiente de asignar.</div>
            ) : (
            <table className="table">
              <thead>
                <tr><th>Código</th><th>Asunto</th><th>Cliente</th><th>Prioridad</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {unassigned.map((t) => (
                  <tr key={t._id}>
                    <td className="cell-code"><Link to={`/admin/tickets/${t._id}`}>{t.code}</Link></td>
                    <td>{t.subject}</td>
                    <td>{t.customer.name}</td>
                    <td><span className={'priority priority-' + t.priority.toLowerCase()}>{priorityLabels[t.priority]}</span></td>
                    <td><span className={'status-badge status-' + t.status.toLowerCase()}>{statusLabels[t.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </>
      )}
    </main>
  );
}

export default AdminDashboard;
