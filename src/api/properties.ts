import { api, USE_FAKE_DATA } from './client';
import { fakeProperties, pageOf } from '../data/fakeData';
import type { Property } from '../types';

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
}

// El backend devuelve 50 propiedades por página como máximo
export const PROPERTIES_PER_PAGE = 50;

// GET /api/properties → { data, pagesData }. Solo devuelve las casas activas
export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  if (USE_FAKE_DATA) {
    let list = fakeProperties.slice();
    if (filters.status) list = list.filter((p) => p.status === filters.status);
    if (filters.type) list = list.filter((p) => p.type === filters.type);
    if (filters.city) list = list.filter((p) => p.address.city === filters.city);
    if (filters.priceMin) list = list.filter((p) => p.price >= Number(filters.priceMin));
    if (filters.priceMax) list = list.filter((p) => p.price <= Number(filters.priceMax));
    if (filters.orderBy === 'price') list.sort((a, b) => (filters.orden === 'asc' ? a.price - b.price : b.price - a.price));
    if (filters.orderBy === 'area') list.sort((a, b) => (filters.orden === 'asc' ? (a.area || 0) - (b.area || 0) : (b.area || 0) - (a.area || 0)));
    return pageOf(list, { page: filters.page }, PROPERTIES_PER_PAGE);
  }

  return api.list('/properties', { ...filters, limit: PROPERTIES_PER_PAGE });
}

// GET /api/properties/:id
export async function getProperty(id: string): Promise<Property> {
  if (USE_FAKE_DATA) {
    const property = fakeProperties.find((p) => p._id === id);
    if (!property || !property.isActive) throw new Error('Propiedad no encontrada');
    return property;
  }

  return api.get('/properties/' + id);
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

// Para pantallas de admin: GET /api/properties/:id no devuelve las desactivadas,
// así que se busca en el listado completo
export async function getPropertyForAdmin(id: string): Promise<Property> {
  const list = await getProperties();
  const property = list.find((p) => p._id === id);
  if (!property) throw new Error('Propiedad no encontrada');
  return property;
}
