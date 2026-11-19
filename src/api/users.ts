import { api, USE_FAKE_DATA } from './client';
import { fakeUsers, getLoggedUser, paginate } from '../data/fakeData';
import type { Paginated, User } from '../types';

export async function getUsers(params: { role?: string; limit?: number }): Promise<Paginated<User>> {
  if (USE_FAKE_DATA) {
    let list = fakeUsers;
    if (params.role) list = list.filter((u) => u.role === params.role);
    return paginate(list, params);
  }

  return api.get('/users', params);
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  if (USE_FAKE_DATA) {
    const user = fakeUsers.find((u) => u._id === id)!;
    Object.assign(user, data);
    return user;
  }

  return api.put('/users/' + id, data);
}

export async function updateMe(data: { name: string; phone: string }): Promise<User> {
  if (USE_FAKE_DATA) {
    return updateUser(getLoggedUser()._id, data);
  }

  return api.put('/users/me', data);
}
