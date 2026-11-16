import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { tickets } from '../../data/tickets';
import AdminSidebar from '../../components/AdminSidebar';
import './Admin.css';

function AdminDashboard() {
  const count = (s: string) => tickets.filter((t) => t.status === s).length;
  const pending = tickets.filter((t) => t.status === 'Abierto' || t.status === 'En curso');

  const open = count('Abierto');
  const inProgress = count('En curso');
  const done = count('Resuelto') + count('Cerrado');

  const bars = [
    { label: 'Abiertos', value: open },
    { label: 'En curso', value: inProgress },
    { label: 'Resueltos / cerrados', value: done },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="page">
          <p className="label">Administración</p>
          <h1 className="page-title">Resumen</h1>
          <p className="page-subtitle">Esto es lo que está pasando.</p>

          <div className="admin-stats">
            <StatCard label="Total de tickets" value={tickets.length} />
            <StatCard label="Abiertos" value={open} />
            <StatCard label="En curso" value={inProgress} />
            <StatCard label="Resueltos / cerrados" value={done} />
          </div>

          <div className="page-header">
            <h2 className="admin-section-title">Tickets pendientes</h2>
            <Link to="/admin/tickets" className="btn btn-outline">Ver todos</Link>
          </div>
          <div className="table-box">
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Asunto</th><th>Cliente</th><th>Prioridad</th><th>Estado</th><th>Agente</th></tr>
              </thead>
              <tbody>
                {pending.map((t) => (
                  <tr key={t.id}>
                    <td><Link to={`/admin/tickets/${t.id}`}>#{t.id}</Link></td>
                    <td>{t.subject}</td>
                    <td>{t.client}</td>
                    <td>{t.priority}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="admin-section-title" style={{ marginTop: 32 }}>Distribución por estado</h2>
          <div className="admin-bars">
            {bars.map((b) => (
              <div key={b.label} className="admin-bar">
                {b.label}: {b.value}
                <div style={{ width: `${(b.value / tickets.length) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
