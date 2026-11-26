import { api, ApiError, getErrorStatus, USE_FAKE_DATA } from './client';
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

  try {
    const data = await api.post('/users/login', { email, password });
    return data.token;
  } catch (err) {
    // El backend responde 404 si no existe el correo y 401 si falla la contraseña.
    // Se da el mismo mensaje para no revelar qué correos están registrados
    const status = getErrorStatus(err);
    if (status === 404 || status === 401) throw new ApiError('El correo o la contraseña no son correctos.', status);
    if (status === 403) throw new ApiError('Esta cuenta está desactivada. Escríbenos para volver a activarla.', status);
    throw err;
  }
}

// POST /api/users/register → usuario creado (siempre CLIENTE)
export async function register(data: { name: string; email: string; password: string; phone?: string }): Promise<User> {
  if (USE_FAKE_DATA) {
    const user = { ...data, _id: String(Date.now()), role: 'CLIENTE', isActive: true };
    fakeUsers.push(user);
    return user;
  }

  try {
    return await api.post('/users/register', data);
  } catch (err) {
    // El backend no dice el motivo (responde 500): lo normal es que el correo o el nombre ya existan
    if (getErrorStatus(err) === 500) {
      throw new ApiError('No se ha podido crear la cuenta. Puede que ese correo o ese nombre ya estén registrados.', 500);
    }
    throw err;
  }
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
