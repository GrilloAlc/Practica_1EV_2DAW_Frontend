import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Auth from './pages/Auth';
import About from './pages/About';
import Profile from './pages/Profile';
import MyTickets from './pages/MyTickets';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import AgentTickets from './pages/AgentTickets';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTickets from './pages/admin/AdminTickets';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProperties from './pages/admin/AdminProperties';
import AdminPropertyForm from './pages/admin/AdminPropertyForm';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/propiedades" element={<Properties />} />
      <Route path="/propiedades/:id" element={<PropertyDetail />} />
      <Route path="/sobre-nosotros" element={<About />} />
      <Route path="/acceso" element={<Auth />} />

      <Route path="/perfil" element={<Profile />} />
      <Route path="/mis-tickets" element={<MyTickets />} />
      <Route path="/mis-tickets/nuevo" element={<NewTicket />} />
      <Route path="/mis-tickets/:id" element={<TicketDetail role="cliente" />} />

      <Route path="/agente/tickets" element={<AgentTickets />} />
      <Route path="/agente/tickets/:id" element={<TicketDetail role="agente" />} />

      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/tickets" element={<AdminTickets />} />
      <Route path="/admin/tickets/:id" element={<TicketDetail role="admin" />} />
      <Route path="/admin/usuarios" element={<AdminUsers />} />
      <Route path="/admin/categorias" element={<AdminCategories />} />
      <Route path="/admin/propiedades" element={<AdminProperties />} />
      <Route path="/admin/propiedades/nueva" element={<AdminPropertyForm />} />
      <Route path="/admin/propiedades/:id/editar" element={<AdminPropertyForm />} />
    </Routes>
  );
}

export default App;
