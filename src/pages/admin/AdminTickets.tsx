import TicketTable from '../../components/TicketTable';
import { tickets } from '../../data/tickets';
import AdminSidebar from '../../components/AdminSidebar';
import './Admin.css';

function AdminTickets() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="page">
          <p className="label">Gestión</p>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">Filtra por estado, prioridad, cliente o agente.</p>
          <TicketTable tickets={tickets} basePath="/admin/tickets" showClient showAgent />
        </div>
      </main>
    </div>
  );
}

export default AdminTickets;
