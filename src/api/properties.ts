import { api, ApiError, USE_FAKE_DATA } from './client';
import { fakeProperties, pageOf } from '../data/fakeData';
import type { Page, Property } from '../types';

// Filtros que acepta GET /api/properties (ver DOCUMENTACION_API_FRONTEND.md)
export interface PropertyFilters {
  status?: string;
  type?: string;
  priceMin?: string;
  priceMax?: string;
  city?: string;
  orderBy?: 'createdAt' | 'price' | 'area';
  orden?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// El backend devuelve 50 propiedades por página como máximo
export const PROPERTIES_PER_PAGE = 50;

// GET /api/properties → { data, pagesData }. Solo devuelve las casas activas
export async function getPropertiesPage(filters: PropertyFilters = {}): Promise<Page<Property>> {
  const limit = Math.min(filters.limit || PROPERTIES_PER_PAGE, PROPERTIES_PER_PAGE);

  if (USE_FAKE_DATA) {
    let list = fakeProperties.filter((p) => p.isActive);
    if (filters.status) list = list.filter((p) => p.status === filters.status);
    if (filters.type) list = list.filter((p) => p.type === filters.type);
    if (filters.city) list = list.filter((p) => p.address.city === filters.city);
    if (filters.priceMin) list = list.filter((p) => p.price >= Number(filters.priceMin));
    if (filters.priceMax) list = list.filter((p) => p.price <= Number(filters.priceMax));
    const dir = filters.orden === 'asc' ? 1 : -1;
    if (filters.orderBy === 'price') list.sort((a, b) => (a.price - b.price) * dir);
    if (filters.orderBy === 'area') list.sort((a, b) => ((a.area || 0) - (b.area || 0)) * dir);
    return {
      data: pageOf(list, { page: filters.page }, limit),
      pagesData: { page: filters.page || 1, limit, total: list.length, totalPages: Math.max(1, Math.ceil(list.length / limit)) },
    };
  }

  return api.page('/properties', { ...filters, limit });
}

// Solo la lista de casas
export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  return (await getPropertiesPage(filters)).data;
}

// GET /api/properties/:id. 404 si no existe o está desactivada
export async function getProperty(id: string): Promise<Property> {
  if (USE_FAKE_DATA) {
    const property = fakeProperties.find((p) => p._id === id);
    if (!property || !property.isActive) throw new ApiError('Propiedad no encontrada', 404);
    return property;
  }

  return api.get('/properties/' + encodeURIComponent(id));
}

// POST /api/properties (ADMIN)
export async function createProperty(data: Partial<Property>): Promise<Property> {
  if (USE_FAKE_DATA) {
    const property = { ...data, _id: String(Date.now()), isActive: true } as Property;
    fakeProperties.push(property);
    return property;
  }

  return api.post('/properties', data);
}

// PUT /api/properties/:id (ADMIN)
export async function updateProperty(id: string, data: Partial<Property>): Promise<Property> {
  if (USE_FAKE_DATA) {
    const property = fakeProperties.find((p) => p._id === id)!;
    Object.assign(property, data);
    return property;
  }

  return api.put('/properties/' + id, data);
}

// DELETE /api/properties/:id (ADMIN). No la borra: la desactiva
export async function deactivateProperty(id: string) {
  if (USE_FAKE_DATA) {
    fakeProperties.find((p) => p._id === id)!.isActive = false;
    return;
  }

  await api.delete('/properties/' + id);
}

// PUT /api/properties/:id/reactivate (ADMIN)
export async function reactivateProperty(id: string) {
  if (USE_FAKE_DATA) {
    fakeProperties.find((p) => p._id === id)!.isActive = true;
    return;
  }

  await api.put('/properties/' + id + '/reactivate');
}

// Para el formulario de edición del admin. El backend no tiene ruta para ver las desactivadas,
// así que solo se pueden editar las activas (reactívala primero desde la lista)
export async function getPropertyForAdmin(id: string): Promise<Property> {
  if (USE_FAKE_DATA) {
    const property = fakeProperties.find((p) => p._id === id);
    if (!property) throw new ApiError('Propiedad no encontrada', 404);
    return property;
  }

  return api.get('/properties/' + encodeURIComponent(id));
}
