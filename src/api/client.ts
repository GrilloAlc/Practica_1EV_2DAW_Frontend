// true: usa los datos falsos de data/fakeData.ts. false: usa el backend real
export const USE_FAKE_DATA = false;

const DEFAULT_ERROR = 'Ha ocurrido un error, inténtalo de nuevo.';

// Aviso para AuthProvider de que el backend ya no acepta la sesión (token caducado o usuario desactivado)
export const SESSION_EXPIRED = 'catahome:sesion-caducada';
// Marca para que la pantalla de acceso explique por qué se pide entrar otra vez
export const SESSION_EXPIRED_FLAG = 'sesion-caducada';

// Error de la API con su código HTTP (403, 404…), para que cada pantalla pueda explicar qué ha pasado
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Código HTTP de un error, si lo tiene
export function getErrorStatus(error: unknown) {
  return error instanceof ApiError ? error.status : null;
}

// Dirección de la API. Se usa /api: en local Vite lo manda al backend de Render (o a BACKEND_URL, ver vite.config.ts)
// y en Vercel lo hace vercel.json. VITE_API_URL solo hace falta para llamar a otro servidor directamente.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Hace una petición al backend con fetch.
// Según DOCUMENTACION_API_FRONTEND.md, unas respuestas son JSON y otras texto plano,
// así que se lee como texto y se intenta convertir a JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request(method: string, url: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = {};

  // Añade el token si hay sesión iniciada
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const options: RequestInit = { method: method, headers: headers };
  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(API_URL + url, options);

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    // Token caducado o no válido: se cierra la sesión y se avisa a la app para que pida entrar otra vez
    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.setItem(SESSION_EXPIRED_FLAG, '1');
      window.dispatchEvent(new Event(SESSION_EXPIRED));
    }
    if (data && typeof data === 'object' && data.message) {
      throw new ApiError(data.message, res.status);
    }
    if (typeof data === 'string' && data) {
      throw new ApiError(data, res.status);
    }
    throw new ApiError(DEFAULT_ERROR, res.status);
  }
  return data;
}

// Convierte { page: 1, city: 'Madrid' } en "?page=1&city=Madrid"
function toQuery(params?: Record<string, unknown>) {
  if (!params) return '';
  const parts: string[] = [];
  for (const key in params) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      parts.push(key + '=' + encodeURIComponent(String(value)));
    }
  }
  if (parts.length === 0) return '';
  return '?' + parts.join('&');
}

export const api = {
  get: (url: string, params?: Record<string, unknown>) => request('GET', url + toQuery(params)),
  // Los listados llegan paginados: { data: [...], pagesData: { page, limit, total, totalPages } }.
  // Devuelve solo la lista
  list: async (url: string, params?: Record<string, unknown>) => {
    const res = await request('GET', url + toQuery(params));
    return Array.isArray(res) ? res : res.data || [];
  },
  // Igual que list, pero devuelve también los datos de la página (total, número de páginas…)
  page: async (url: string, params?: Record<string, unknown>) => {
    const res = await request('GET', url + toQuery(params));
    if (Array.isArray(res)) return { data: res, pagesData: { page: 1, limit: res.length, total: res.length, totalPages: 1 } };
    return res;
  },
  post: (url: string, body?: unknown) => request('POST', url, body),
  put: (url: string, body?: unknown) => request('PUT', url, body),
  delete: (url: string) => request('DELETE', url),
};

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return DEFAULT_ERROR;
}
