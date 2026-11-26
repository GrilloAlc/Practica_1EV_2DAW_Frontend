import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './useAuth';
import * as authApi from '../api/auth';
import { SESSION_EXPIRED } from '../api/client';
import type { User } from '../types';

// Recupera la sesión guardada al recargar la página
function getSavedUser(): User | null {
  const saved = localStorage.getItem('user');
  if (saved && localStorage.getItem('token')) {
    return JSON.parse(saved);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSavedUser());

  // La sesión también se acaba sin pulsar Salir: cuando el token caduca (el backend responde 401)
  // o cuando se cierra en otra pestaña. En los dos casos la web deja de mostrarte dentro
  useEffect(() => {
    function onExpired() {
      setUser(null);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === null || e.key === 'token' || e.key === 'user') setUser(getSavedUser());
    }
    window.addEventListener(SESSION_EXPIRED, onExpired);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SESSION_EXPIRED, onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // El login solo devuelve el token. Los datos del usuario se piden después a /users/me
  async function login(email: string, password: string) {
    const token = await authApi.login(email, password);
    localStorage.setItem('token', token);
    try {
      const me = await authApi.getMe();
      localStorage.setItem('user', JSON.stringify(me));
      setUser(me);
      return me;
    } catch (err) {
      localStorage.removeItem('token');
      throw err;
    }
  }

  // El registro no devuelve token: se registra y luego se inicia sesión con los mismos datos
  async function register(form: { name: string; email: string; password: string; phone?: string }) {
    await authApi.register(form);
    return login(form.email, form.password);
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
