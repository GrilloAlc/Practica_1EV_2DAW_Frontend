import { api, USE_FAKE_DATA } from './client';
import { fakeUsers } from '../data/fakeData';
import type { User } from '../types';

// POST /api/users/login → { token }
export async function login(email: string, password: string): Promise<string> {
  if (USE_FAKE_DATA) {
    const user = fakeUsers.find((u) => u.email === email);
    if (!user) throw new Error('Usuario no encontrado');
    if (user.password !== password) throw new Error('Contraseña incorrecta');
    return 'token-falso-' + user._id;
  }

  const data = await api.post('/users/login', { email, password });
  return data.token;
}

// POST /api/users/register → usuario creado (siempre CLIENTE)
export async function register(data: { name: string; email: string; password: string; phone?: string }): Promise<User> {
  if (USE_FAKE_DATA) {
    const user = { ...data, _id: String(Date.now()), role: 'CLIENTE', isActive: true };
    fakeUsers.push(user);
    return user;
  }

  return api.post('/users/register', data);
}

// GET /api/users/me → usuario del token
export async function getMe(): Promise<User> {
  if (USE_FAKE_DATA) {
    const id = (localStorage.getItem('token') || '').replace('token-falso-', '');
    const user = fakeUsers.find((u) => u._id === id);
    if (!user) throw new Error('El usuario del token no existe o ha sido eliminado');
    return user;
  }

  return api.get('/users/me');
}
