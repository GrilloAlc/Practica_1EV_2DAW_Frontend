// true: usa los datos falsos de data/fakeData.ts. Cambiar a false cuando el backend funcione
export const USE_FAKE_DATA = true;

const DEFAULT_ERROR = 'Ha ocurrido un error, inténtalo de nuevo.';

// Hace una petición al backend con fetch.
// Las peticiones a /api las manda Vite a http://localhost:3000 (ver vite.config.ts).
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

  const res = await fetch('/api' + url, options);

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    // Token caducado o no válido: se cierra la sesión
    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    if (data && typeof data === 'object' && data.message) {
      throw new Error(data.message);
    }
    if (typeof data === 'string' && data) {
      throw new Error(data);
    }
    throw new Error(DEFAULT_ERROR);
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
