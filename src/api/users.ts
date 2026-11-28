import { api, ApiError, getErrorStatus } from './client';
import type { Page, User } from '../types';

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  // Busca por parte del nombre o del correo, sin importar mayúsculas
  name?: string;
  email?: string;
  // Por fecha de alta: 'desc' (más recientes, lo que hace el backend si no se dice) o 'asc'
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Escapa los caracteres especiales: el backend busca con una expresión regular y "(" o "+" darían un error 500
function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// El backend responde 500 sin decir el motivo cuando el correo o el nombre ya están en otra cuenta
function duplicateError(err: unknown, action: string) {
  if (getErrorStatus(err) === 500) {
    return new ApiError(`No se ha podido ${action}. Puede que ese correo o ese nombre ya los use otra cuenta.`, 500);
  }
  return err;
}

// GET /api/users (ADMIN) → { data, pagesData }, máximo 50 por página
export async function getUsersPage(params: UserFilters = {}): Promise<Page<User>> {
  const limit = params.limit || 50;
  const name = params.name ? escapeRegex(params.name) : undefined;
  const email = params.email ? escapeRegex(params.email) : undefined;
  return api.get('/users', { ...params, name, email, limit });
}

// GET /api/users/:id (ADMIN): un usuario con sus datos actuales
export async function getUser(id: string): Promise<User> {
  return api.get('/users/' + id);
}

// GET /api/users/search?role=&q= (ADMIN): hasta 5 usuarios de un rol cuyo nombre contiene el texto.
// Para las sugerencias mientras se escribe
export async function searchUsers(role: string, text: string, limit = 5): Promise<Pick<User, '_id' | 'name' | 'email' | 'role'>[]> {
  if (!text.trim()) return [];
  return api.get('/users/search', { role, q: escapeRegex(text.trim()), limit });
}

export interface NewUser {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
}

// POST /api/users (ADMIN): crea una cuenta con el rol que se elija (agentes y otros administradores).
// El backend responde con un texto, no con el usuario
export async function createUser(data: NewUser): Promise<void> {
  try {
    await api.post('/users', { ...data, isActive: true });
  } catch (err) {
    throw duplicateError(err, 'crear la cuenta');
  }
}

// PUT /api/users/:id (ADMIN) → { name, phone }. El correo y el rol no se cambian aquí
export async function updateUser(id: string, data: { name: string; phone: string }): Promise<User> {
  try {
    return await api.put('/users/' + id, data);
  } catch (err) {
    throw duplicateError(err, 'guardar los cambios');
  }
}

// PUT /api/users/:id/password (ADMIN) → { password }. Solo el administrador puede cambiar contraseñas,
// también la suya (con su propio id): el backend no tiene ruta para que cada usuario cambie la suya
export async function setUserPassword(id: string, password: string): Promise<void> {
  await api.put('/users/' + id + '/password', { password });
}

// Todos los usuarios de un rol, pidiendo las páginas que haga falta (para las listas de los filtros)
export async function getAllUsers(params: Omit<UserFilters, 'page' | 'limit'> = {}): Promise<User[]> {
  const first = await getUsersPage({ ...params, page: 1, limit: 50 });
  const pages = Math.min(first.pagesData.totalPages || 1, 20);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => getUsersPage({ ...params, page: i + 2, limit: 50 }).then((p) => p.data)));
  return [...first.data, ...rest.flat()];
}

// PUT /api/users/me → { name, phone }
export async function updateMe(data: { name: string; phone: string }): Promise<User> {
  try {
    return await api.put('/users/me', data);
  } catch (err) {
    // El nombre es único en el backend: si ya lo usa otra persona responde 500 sin decir el motivo
    if (getErrorStatus(err) === 500) {
      throw new ApiError('No se han podido guardar los cambios. Puede que ese nombre ya lo use otra persona.', 500);
    }
    throw err;
  }
}

// Reglas de contraseña del frontend (las mismas que el registro): el backend no comprueba nada
export function passwordProblem(password: string, repeat: string) {
  if (password.length < 8) return 'La contraseña tiene que tener al menos 8 caracteres.';
  if (password !== repeat) return 'Las dos contraseñas no coinciden.';
  return '';
}

// PUT /api/users/:id/role (ADMIN)
export async function changeRole(id: string, role: string): Promise<User> {
  return api.put('/users/' + id + '/role', { role });
}

// PUT /api/users/:id/activate y /deactivate (ADMIN)
export async function setUserActive(id: string, active: boolean): Promise<User> {
  return api.put('/users/' + id + (active ? '/activate' : '/deactivate'));
}
