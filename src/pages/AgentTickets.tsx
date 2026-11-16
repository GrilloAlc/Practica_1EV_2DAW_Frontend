import TicketTable from '../components/TicketTable';
import { tickets } from '../data/tickets';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function AgentTickets() {
  const assigned = tickets.filter((t) => t.agent === 'Ana García');

  return (
    <>
      <Navbar />
      <main className="page">
        <p className="label">Soporte</p>
        <h1 className="page-title">Tickets asignados</h1>
        <p className="page-subtitle">Solicitudes que tienes a tu cargo.</p>
        <TicketTable tickets={assigned} basePath="/agente/tickets" showClient />
      </main>
      <Footer />
    </>
  );
}

export default AgentTickets;
