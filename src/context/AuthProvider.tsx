import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './useAuth';
import * as authApi from '../api/auth';
import type { User } from '../types';

// Recupera la sesión guardada al recargar la página
function getSavedUser(): User | null {
  const saved = localStorage.getItem('user');
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSavedUser());

  function saveSession(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  }

  async function login(email: string, password: string) {
    const data = await authApi.login(email, password);
    saveSession(data.token, data.user);
    return data.user;
  }

  async function register(form: { name: string; email: string; password: string; phone?: string }) {
    const data = await authApi.register(form);
    saveSession(data.token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  function updateUser(newUser: User) {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
