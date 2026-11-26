// A dónde ir después de iniciar sesión.
// Se vuelve a la página que se pedía ("from") solo si es para el rol con el que se entra;
// si no, cada rol va a su página de inicio.

// Página de inicio de cada rol
export function homeForRole(role: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'AGENTE') return '/agente/tickets';
  return '/mis-tickets';
}

// Lista de tickets de cada rol: el mismo ticket se ve en /mis-tickets/:id, /agente/tickets/:id o /admin/tickets/:id
const TICKETS_BY_ROLE: Record<string, string> = {
  CLIENTE: '/mis-tickets',
  AGENTE: '/agente/tickets',
  ADMIN: '/admin/tickets',
};

// Zona privada de cada rol
const AREA_BY_ROLE: Record<string, string> = {
  CLIENTE: '/mis-tickets',
  AGENTE: '/agente',
  ADMIN: '/admin',
};

// true si la ruta es igual a "base" o cuelga de ella ("/admin" y "/admin/usuarios", pero no "/administrar")
function isUnder(path: string, base: string) {
  return path === base || path.startsWith(base + '/');
}

export function pageAfterLogin(from: string | undefined, role: string) {
  const home = homeForRole(role);
  // Sin página pedida, o si se pulsó Entrar desde el inicio: a la zona de su rol
  if (!from || from === '/' || isUnder(from, '/acceso')) return home;

  const path = from.split('?')[0];

  // Un ticket concreto de otra zona se abre en la zona del rol (el cliente solo ve los suyos y
  // el agente los asignados: si no puede verlo, la propia página lo explica)
  const ticket = path.match(/^\/(?:mis-tickets|agente\/tickets|admin\/tickets)\/([^/]+)$/);
  if (ticket && ticket[1] !== 'nuevo') {
    return `${TICKETS_BY_ROLE[role] || '/mis-tickets'}/${ticket[1]}`;
  }

  // Zonas privadas: solo si son del rol
  const privateAreas = Object.entries(AREA_BY_ROLE);
  const area = privateAreas.find(([, base]) => isUnder(path, base));
  if (area) return area[0] === role ? from : home;

  // Páginas públicas y el perfil valen para todos
  return from;
}
