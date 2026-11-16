import { Link } from 'react-router-dom';
import TicketTable from '../components/TicketTable';
import { tickets } from '../data/tickets';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function MyTickets() {
  const mine = tickets.filter((t) => t.client === 'María Ruiz');

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="label">Área de cliente</p>
            <h1 className="page-title">Mis tickets</h1>
            <p className="page-subtitle">Consulta y gestiona tus solicitudes.</p>
          </div>
          <Link to="/mis-tickets/nuevo" className="btn">+ Nuevo ticket</Link>
        </div>
        <TicketTable tickets={mine} basePath="/mis-tickets" />
      </main>
      <Footer />
    </>
  );
}

export default MyTickets;
