import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTicketStats, getTickets } from '../../api/tickets';
import { getErrorMessage } from '../../api/client';
import { priorityLabels, statusLabels } from '../../utils/labels';
import type { Ticket, TicketStats } from '../../types';

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
        setUnassigned(ticketsResult.data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadData();
  }, []);

  return (
    <main className="page">
      <p className="label">Administración</p>
      <h1 className="page-title">Resumen</h1>
      <p className="page-subtitle">Esto es lo que está pasando.</p>

      {error && <p className="field-error">{error}</p>}
      {!stats && !error && <p>Cargando...</p>}

      {stats && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <p className="stat-card-label">Total de tickets</p>
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
            <h2 className="admin-section-title">Tickets sin asignar</h2>
            <Link to="/admin/tickets" className="btn btn-outline">Ver todos</Link>
          </div>
          <div className="table-box">
            <table className="table">
              <thead>
                <tr><th>Código</th><th>Asunto</th><th>Cliente</th><th>Prioridad</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {unassigned.map((t) => (
                  <tr key={t._id}>
                    <td><Link to={`/admin/tickets/${t._id}`}>{t.code}</Link></td>
                    <td>{t.subject}</td>
                    <td>{t.customer.name}</td>
                    <td>{priorityLabels[t.priority]}</td>
                    <td><span className="status-badge">{statusLabels[t.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

export default AdminDashboard;
