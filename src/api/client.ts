import axios from 'axios';

// true: usa los datos falsos de data/fakeData.ts. Cambiar a false cuando el backend funcione
export const USE_FAKE_DATA = true;

export const api = axios.create({
  baseURL: '/api',
});

// Añade el token a todas las peticiones si hay sesión iniciada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

export function getErrorMessage(error: unknown) {
  const defaultMessage = 'Ha ocurrido un error, inténtalo de nuevo.';

  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}
