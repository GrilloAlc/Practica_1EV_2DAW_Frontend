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

// Números con punto de miles también en cifras de 4 dígitos (1.100 €), como en los portales
const numberFormat = new Intl.NumberFormat('es-ES', { useGrouping: 'always', maximumFractionDigits: 0 });

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

export function formatPrice(property: Property) {
  let text = formatNumber(property.price) + ' €';
  if (property.status === 'Disponible para alquilar' || property.status === 'Alquilada') {
    text += '/mes';
  }
  return text;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES');
}

// Foto de respaldo para cada tipo de inmueble (public/images/tipos)
const TYPE_IMAGES: Record<string, string> = {
  Piso: '/images/tipos/piso.jpg',
  Casa: '/images/tipos/casa.jpg',
  Local: '/images/tipos/local.jpg',
  Terreno: '/images/tipos/terreno.jpg',
};

// Usa la foto de la propiedad y, si no tiene, la de su tipo
export function propertyImage(property: Property) {
  return property.image || TYPE_IMAGES[property.type] || TYPE_IMAGES.Piso;
}

// Texto corto de la operación para las etiquetas de las fotos
export function operationLabel(status: string) {
  if (status === 'En venta') return 'Venta';
  if (status === 'Disponible para alquilar') return 'Alquiler';
  return status;
}
