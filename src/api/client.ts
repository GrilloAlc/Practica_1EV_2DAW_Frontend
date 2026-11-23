// true: usa los datos falsos de data/fakeData.ts. Cambiar a false cuando el backend funcione
export const USE_FAKE_DATA = true;

const DEFAULT_ERROR = 'Ha ocurrido un error, inténtalo de nuevo.';

// Hace una petición al backend con fetch y devuelve el JSON de la respuesta
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request(method: string, url: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Añade el token si hay sesión iniciada
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const options: RequestInit = { method: method, headers: headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch('/api' + url, options);

  // Algunas respuestas (por ejemplo un DELETE) vienen vacías y no tienen JSON
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (data && data.message) {
      throw new Error(data.message);
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
  patch: (url: string, body?: unknown) => request('PATCH', url, body),
  delete: (url: string) => request('DELETE', url),
};

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return DEFAULT_ERROR;
}
