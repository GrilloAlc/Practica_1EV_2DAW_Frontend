import type { Property } from '../types';

// Valores que acepta el backend (model/enums.js)
export const ROLES = ['CLIENTE', 'PROPIETARIO', 'AGENTE', 'ADMIN'];
export const PROPERTY_TYPES = ['Casa', 'Piso', 'Terreno', 'Local'];
export const PROPERTY_STATUSES = ['En venta', 'Disponible para alquilar', 'Reservada', 'Vendida', 'Alquilada'];
export const TICKET_STATUSES = ['ABIERTO', 'EN_CURSO', 'PENDIENTE_CLIENTE', 'RESUELTO', 'CERRADO'];
export const TICKET_PRIORITIES = ['BAJA', 'MEDIA', 'ALTA'];
export const TICKET_CATEGORIES = ['CONSULTA_PROPIEDAD', 'SOLICITUD_VISITA', 'INCIDENCIA_ALQUILER', 'DOCUMENTACION', 'RECLAMACION', 'CUENTA'];

// Texto que se muestra en pantalla para cada valor
export const roleLabels: Record<string, string> = {
  CLIENTE: 'Cliente',
  PROPIETARIO: 'Propietario',
  AGENTE: 'Agente',
  ADMIN: 'Administrador',
};

export const statusLabels: Record<string, string> = {
  ABIERTO: 'Abierto',
  EN_CURSO: 'En curso',
  PENDIENTE_CLIENTE: 'Pendiente del cliente',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
};

export const priorityLabels: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

export const categoryLabels: Record<string, string> = {
  CONSULTA_PROPIEDAD: 'Consulta de propiedad',
  SOLICITUD_VISITA: 'Solicitud de visita',
  INCIDENCIA_ALQUILER: 'Incidencia de alquiler',
  DOCUMENTACION: 'Documentación',
  RECLAMACION: 'Reclamación',
  CUENTA: 'Cuenta',
};

export function formatPrice(property: Property) {
  let text = property.price.toLocaleString('es-ES') + ' €';
  if (property.status === 'Disponible para alquilar' || property.status === 'Alquilada') {
    text += '/mes';
  }
  return text;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES');
}

export function propertyImage(property: Property) {
  return property.image || `https://picsum.photos/seed/${property._id}/800/600`;
}
