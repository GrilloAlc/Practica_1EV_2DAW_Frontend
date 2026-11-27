import { api, ApiError, getErrorStatus, USE_FAKE_DATA } from './client';
import { fakeUsers, getLoggedUser, pageOf } from '../data/fakeData';
import type { Page, User } from '../types';

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  // Busca por parte del nombre, sin importar mayúsculas
  name?: string;
  page?: number;
  limit?: number;
}

// GET /api/users (ADMIN) → { data, pagesData }, máximo 50 por página
export async function getUsersPage(params: UserFilters = {}): Promise<Page<User>> {
  const limit = params.limit || 50;
  if (USE_FAKE_DATA) {
    let list = fakeUsers;
    if (params.role) list = list.filter((u) => u.role === params.role);
    if (params.isActive !== undefined) list = list.filter((u) => u.isActive === params.isActive);
    if (params.name) list = list.filter((u) => u.name.toLowerCase().includes(params.name!.toLowerCase()));
    return {
      data: pageOf(list, params, limit),
      pagesData: { page: params.page || 1, limit, total: list.length, totalPages: Math.max(1, Math.ceil(list.length / limit)) },
    };
  }

  // El backend busca el nombre con una expresión regular: se escapan los caracteres especiales
  // para que "(" o "+" busquen ese carácter en vez de dar un error 500
  const name = params.name ? params.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : undefined;
  return api.page('/users', { ...params, name, limit });
}

export async function getUsers(params: UserFilters = {}): Promise<User[]> {
  return (await getUsersPage(params)).data;
}

// Todos los usuarios de un rol, pidiendo las páginas que haga falta (para las listas de los filtros)
export async function getAllUsers(params: Omit<UserFilters, 'page' | 'limit'> = {}): Promise<User[]> {
  const first = await getUsersPage({ ...params, page: 1, limit: 50 });
  const pages = Math.min(first.pagesData.totalPages || 1, 20);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => getUsers({ ...params, page: i + 2, limit: 50 })));
  return [...first.data, ...rest.flat()];
}

// PUT /api/users/me → { name, phone }
export async function updateMe(data: { name: string; phone: string }): Promise<User> {
  if (USE_FAKE_DATA) {
    const user = fakeUsers.find((u) => u._id === getLoggedUser()._id)!;
    Object.assign(user, data);
    return user;
  }

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

// PUT /api/users/:id/role (ADMIN)
export async function changeRole(id: string, role: string): Promise<User> {
  if (USE_FAKE_DATA) {
    const user = fakeUsers.find((u) => u._id === id)!;
    user.role = role;
    return user;
  }

  return api.put('/users/' + id + '/role', { role });
}

// PUT /api/users/:id/activate y /deactivate (ADMIN)
export async function setUserActive(id: string, active: boolean): Promise<User> {
  if (USE_FAKE_DATA) {
    const user = fakeUsers.find((u) => u._id === id)!;
    user.isActive = active;
    return user;
  }

  return api.put('/users/' + id + (active ? '/activate' : '/deactivate'));
}
