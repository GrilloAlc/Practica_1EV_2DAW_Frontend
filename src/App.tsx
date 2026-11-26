import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import Root from './components/Root';
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
import AdminProperties from './pages/admin/AdminProperties';
import AdminPropertyForm from './pages/admin/AdminPropertyForm';
import NotFound from './pages/NotFound';

// Se usa createBrowserRouter (y no <BrowserRouter>) para poder controlar cuándo cambia de página
// (ver el final del archivo) y para recuperar el scroll con <ScrollRestoration>
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Root />}>
      <Route path="/acceso" element={<Auth />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/propiedades" element={<Properties />} />
        <Route path="/propiedades/:id" element={<PropertyDetail />} />
        <Route path="/sobre-nosotros" element={<About />} />
        <Route path="*" element={<NotFound />} />

        <Route element={<RequireAuth />}>
          <Route path="/perfil" element={<Profile />} />
        </Route>

        <Route element={<RequireAuth roles={['CLIENTE', 'PROPIETARIO']} />}>
          <Route path="/mis-tickets" element={<Tickets title="Mis consultas" subtitle="Tus preguntas y visitas, con su respuesta por escrito." />} />
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
          <Route path="/admin/tickets" element={<Tickets title="Tickets" subtitle="Filtra por estado, prioridad, categoría, cliente o agente." />} />
          <Route path="/admin/tickets/:id" element={<TicketDetail />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/propiedades" element={<AdminProperties />} />
          <Route path="/admin/propiedades/nueva" element={<AdminPropertyForm />} />
          <Route path="/admin/propiedades/:id/editar" element={<AdminPropertyForm />} />
        </Route>
      </Route>
    </Route>,
  ),
);

// Botón Atrás del navegador: React 19 pinta en el acto los cambios que ocurren dentro del evento
// "popstate" y así se salta la animación de la foto (<ViewTransition>). Si el cambio de página
// se avisa cuando el evento ya ha terminado (setTimeout), React lo trata como una transición
// normal y la foto vuelve volando a su anuncio, igual que al pulsar un enlace.
// El scroll no se pierde: lo recupera <ScrollRestoration> (components/Root.tsx).
const subscribe = router.subscribe;
router.subscribe = (listener) =>
  subscribe((state, opts) => {
    if (window.event?.type === 'popstate') {
      setTimeout(() => listener(state, opts));
    } else {
      listener(state, opts);
    }
  });
