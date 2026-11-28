import { api } from './client';
import type { Page, Property } from '../types';

// Filtros que acepta GET /api/properties (ver DOCUMENTACION_API_FRONTEND.md)
export interface PropertyFilters {
  status?: string;
  type?: string;
  priceMin?: string;
  priceMax?: string;
  city?: string;
  // Metros cuadrados mínimos y máximos
  areaMin?: string;
  areaMax?: string;
  // Coinciden exactos con la dirección guardada (provincia como sale del código postal)
  province?: string;
  postalCode?: string;
  orderBy?: 'createdAt' | 'price' | 'area';
  orden?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Se piden 50 por página, el máximo que permite el backend (si se pide más, él mismo lo deja en 50)
export const PROPERTIES_PER_PAGE = 50;

// GET /api/properties → { data, pagesData }. Solo devuelve las casas activas
export async function getPropertiesPage(filters: PropertyFilters = {}): Promise<Page<Property>> {
  const limit = filters.limit || PROPERTIES_PER_PAGE;

  return api.get('/properties', { ...filters, limit });
}

// Solo la lista de casas
export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  return (await getPropertiesPage(filters)).data;
}

// GET /api/properties/:id. 404 si no existe o está desactivada. La usa también el formulario de edición
// del admin: el backend no tiene ruta para las desactivadas, así que se reactivan antes de editarlas
export async function getProperty(id: string): Promise<Property> {
  return api.get('/properties/' + encodeURIComponent(id));
}

// POST /api/properties (ADMIN)
export async function createProperty(data: Partial<Property>): Promise<Property> {
  return api.post('/properties', data);
}

// PUT /api/properties/:id (ADMIN)
export async function updateProperty(id: string, data: Partial<Property>): Promise<Property> {
  return api.put('/properties/' + id, data);
}

// DELETE /api/properties/:id (ADMIN). No la borra: la desactiva
export async function deactivateProperty(id: string) {
  await api.delete('/properties/' + id);
}

// PUT /api/properties/:id/status (ADMIN) → { status }: solo cambia el estado (vendida, reservada…)
export async function updatePropertyStatus(id: string, status: string): Promise<Property> {
  return api.put('/properties/' + id + '/status', { status });
}

// PUT /api/properties/:id/reactivate (ADMIN)
export async function reactivateProperty(id: string) {
  await api.put('/properties/' + id + '/reactivate');
}
