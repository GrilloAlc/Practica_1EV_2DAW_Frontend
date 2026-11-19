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

  const res = await fetch('/api' + url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Algunas respuestas (por ejemplo un DELETE) pueden venir vacías
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || DEFAULT_ERROR);
  }
  return data;
}

// Convierte { page: 1, city: 'Madrid' } en "?page=1&city=Madrid"
function toQuery(params?: Record<string, unknown>) {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const text = query.toString();
  return text ? '?' + text : '';
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
