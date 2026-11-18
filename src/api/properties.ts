import { api, USE_FAKE_DATA } from './client';
import { fakeProperties, paginate } from '../data/fakeData';
import type { Paginated, Property } from '../types';

export async function getProperties(params: Record<string, string | number>): Promise<Paginated<Property>> {
  if (USE_FAKE_DATA) {
    // Solo las activas, salvo que el admin pida isActive: 'all'
    let list = fakeProperties.filter((p) => p.isActive || params.isActive === 'all');
    if (params.status) list = list.filter((p) => p.status === params.status);
    if (params.type) list = list.filter((p) => p.type === params.type);
    if (params.city) list = list.filter((p) => p.address.city.toLowerCase().includes(String(params.city).toLowerCase()));
    if (params.search) list = list.filter((p) => p.title.toLowerCase().includes(String(params.search).toLowerCase()));
    if (params.minPrice) list = list.filter((p) => p.price >= Number(params.minPrice));
    if (params.maxPrice) list = list.filter((p) => p.price <= Number(params.maxPrice));
    if (params.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    if (params.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    return paginate(list, params);
  }

  const res = await api.get('/properties', { params });
  return res.data;
}

export async function getProperty(id: string): Promise<Property> {
  if (USE_FAKE_DATA) {
    const property = fakeProperties.find((p) => p._id === id);
    if (!property) throw new Error('Propiedad no encontrada.');
    return property;
  }

  const res = await api.get('/properties/' + id);
  return res.data;
}

export async function createProperty(data: Partial<Property>): Promise<Property> {
  if (USE_FAKE_DATA) {
    const property = { ...data, _id: String(Date.now()), isActive: true } as Property;
    fakeProperties.push(property);
    return property;
  }

  const res = await api.post('/properties', data);
  return res.data;
}

export async function updateProperty(id: string, data: Partial<Property>): Promise<Property> {
  if (USE_FAKE_DATA) {
    const property = fakeProperties.find((p) => p._id === id)!;
    Object.assign(property, data);
    return property;
  }

  const res = await api.put('/properties/' + id, data);
  return res.data;
}

// No borra la propiedad, la desactiva
export async function deleteProperty(id: string) {
  if (USE_FAKE_DATA) {
    fakeProperties.find((p) => p._id === id)!.isActive = false;
    return;
  }

  await api.delete('/properties/' + id);
}
