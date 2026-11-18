import { api, USE_FAKE_DATA } from './client';
import { fakeUsers } from '../data/fakeData';


export async function login(email: string, password: string) {
  if (USE_FAKE_DATA) {
    const user = fakeUsers.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error('Correo o contraseña incorrectos.');
    return { token: 'token-falso', user };
  }

  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function register(data: { name: string; email: string; password: string; phone?: string }) {
  if (USE_FAKE_DATA) {
    const user = { ...data, _id: String(Date.now()), role: 'CLIENTE', isActive: true };
    fakeUsers.push(user);
    return { token: 'token-falso', user };
  }

  const res = await api.post('/auth/register', data);
  return res.data;
}
