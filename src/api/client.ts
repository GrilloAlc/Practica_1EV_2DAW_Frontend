// true: usa los datos falsos de data/fakeData.ts. false: usa el backend real
export const USE_FAKE_DATA = false;

const DEFAULT_ERROR = 'Ha ocurrido un error, inténtalo de nuevo.';
const NETWORK_ERROR = 'No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
const TIMEOUT_ERROR = 'El servidor está tardando demasiado en responder. Inténtalo de nuevo en un momento.';
// Render apaga el backend si nadie lo usa: la primera petición puede tardar ~30 s. Más de un minuto ya es un fallo
const TIMEOUT_MS = 60_000;

// Aviso para AuthProvider de que el backend ya no acepta la sesión (token caducado o usuario desactivado)
export const SESSION_EXPIRED = 'catahome:sesion-caducada';
// Marca para que la pantalla de acceso explique por qué se pide entrar otra vez: "caducada" o "desactivada"
export const SESSION_EXPIRED_FLAG = 'sesion-caducada';

// Error de la API con su código HTTP (403, 404…), para que cada pantalla pueda explicar qué ha pasado.
// status 0: no se llegó a hablar con el servidor (sin conexión o sin respuesta)
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

// Cierra la sesión guardada y avisa a la app (AuthProvider) para que deje de mostrar al usuario dentro
function endSession(reason: 'caducada' | 'desactivada') {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.setItem(SESSION_EXPIRED_FLAG, reason);
  window.dispatchEvent(new Event(SESSION_EXPIRED));
}

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
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    options.signal = AbortSignal.timeout(TIMEOUT_MS);
  }

  let res: Response;
  try {
    res = await fetch(API_URL + url, options);
  } catch (err) {
    // Sin conexión, servidor caído o sin respuesta a tiempo: fetch no llega a tener respuesta
    const timedOut = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new ApiError(timedOut ? TIMEOUT_ERROR : NETWORK_ERROR, 0);
  }

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
      endSession('caducada');
    }
    // El backend responde 403 con este texto cuando la cuenta se ha desactivado mientras había sesión
    if (res.status === 403 && token && typeof data === 'string' && /inexistente o inactivo/i.test(data)) {
      endSession('desactivada');
    }
    // El proxy de Vercel o de Vite devuelve una página HTML si el backend no contesta: no se enseña
    if (typeof data === 'string' && /^\s*</.test(data)) {
      throw new ApiError(res.status >= 500 ? 'El servidor no está disponible ahora mismo. Inténtalo de nuevo en un momento.' : DEFAULT_ERROR, res.status);
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

// Los listados (casas, tickets, usuarios, actividad) ya llegan paginados del backend
// como { data: [...], pagesData: { page, limit, total, totalPages } }: se usan tal cual con api.get
export const api = {
  get: (url: string, params?: Record<string, unknown>) => request('GET', url + toQuery(params)),
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
