import { lazy } from 'react';

// Las páginas con sesión (cliente, agente y panel) se descargan solo cuando se abren:
// así la web pública carga menos JavaScript. Mientras llegan se ve <PageLoading /> (RequireAuth y AdminLayout)
export const Profile = lazy(() => import('./Profile'));
export const Tickets = lazy(() => import('./Tickets'));
export const NewTicket = lazy(() => import('./NewTicket'));
export const TicketDetail = lazy(() => import('./TicketDetail'));
export const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
export const AdminUsers = lazy(() => import('./admin/AdminUsers'));
export const AdminActivity = lazy(() => import('./admin/AdminActivity'));
export const AdminProperties = lazy(() => import('./admin/AdminProperties'));
export const AdminPropertyForm = lazy(() => import('./admin/AdminPropertyForm'));
