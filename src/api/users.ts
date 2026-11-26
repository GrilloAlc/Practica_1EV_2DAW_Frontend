import { api, USE_FAKE_DATA } from './client';
import { fakeUsers, getLoggedUser, pageOf } from '../data/fakeData';
import type { User } from '../types';

// GET /api/users (ADMIN) → { data, pagesData }, máximo 50 por página
export async function getUsers(params: { role?: string; isActive?: boolean; page?: number; limit?: number } = {}): Promise<User[]> {
  if (USE_FAKE_DATA) {
    let list = fakeUsers;
    if (params.role) list = list.filter((u) => u.role === params.role);
    if (params.isActive !== undefined) list = list.filter((u) => u.isActive === params.isActive);
    return pageOf(list, params, 50);
  }

  return api.list('/users', { limit: 50, ...params });
}

// PUT /api/users/me → { name, phone }
export async function updateMe(data: { name: string; phone: string }): Promise<User> {
  if (USE_FAKE_DATA) {
    const user = fakeUsers.find((u) => u._id === getLoggedUser()._id)!;
    Object.assign(user, data);
    return user;
  }

  return api.put('/users/me', data);
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
