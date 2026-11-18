import { Routes, Route } from 'react-router-dom';
import { PublicLayout, AdminLayout } from './components/Layout';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Auth from './pages/Auth';
import About from './pages/About';
import Profile from './pages/Profile';
import Tickets from './pages/Tickets';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProperties from './pages/admin/AdminProperties';
import AdminPropertyForm from './pages/admin/AdminPropertyForm';

function App() {
  return (
    <Routes>
      <Route path="/acceso" element={<Auth />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/propiedades" element={<Properties />} />
        <Route path="/propiedades/:id" element={<PropertyDetail />} />
        <Route path="/sobre-nosotros" element={<About />} />

        <Route element={<RequireAuth />}>
          <Route path="/perfil" element={<Profile />} />
        </Route>

        <Route element={<RequireAuth roles={['CLIENTE', 'PROPIETARIO']} />}>
          <Route path="/mis-tickets" element={<Tickets title="Mis tickets" subtitle="Consulta y gestiona tus solicitudes." />} />
          <Route path="/mis-tickets/nuevo" element={<NewTicket />} />
          <Route path="/mis-tickets/:id" element={<TicketDetail />} />
        </Route>

        <Route element={<RequireAuth roles={['AGENTE']} />}>
          <Route path="/agente/tickets" element={<Tickets title="Tickets asignados" subtitle="Solicitudes que tienes a tu cargo." />} />
          <Route path="/agente/tickets/:id" element={<TicketDetail />} />
        </Route>
      </Route>

      <Route element={<RequireAuth roles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/tickets" element={<Tickets title="Tickets" subtitle="Filtra por estado, prioridad, cliente o agente." />} />
          <Route path="/admin/tickets/:id" element={<TicketDetail />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/categorias" element={<AdminCategories />} />
          <Route path="/admin/propiedades" element={<AdminProperties />} />
          <Route path="/admin/propiedades/nueva" element={<AdminPropertyForm />} />
          <Route path="/admin/propiedades/:id/editar" element={<AdminPropertyForm />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
