import type { Property } from '../types';

// Los mismos que el backend (model/enums.js)
export const ROLES = ['CLIENTE', 'AGENTE', 'ADMIN'];
export const PROPERTY_TYPES = ['Casa', 'Piso', 'Terreno', 'Local'];
export const PROPERTY_STATUSES = ['En venta', 'Disponible para alquilar', 'Reservada', 'Vendida', 'Alquilada'];
export const TICKET_STATUSES = ['ABIERTO', 'EN_CURSO', 'PENDIENTE_CLIENTE', 'RESUELTO', 'CERRADO'];
// Prioridad en número: 1 baja, 2 media, 3 alta
export const TICKET_PRIORITIES = [1, 2, 3];
export const TICKET_CATEGORIES = ['CONSULTA_PROPIEDAD', 'SOLICITUD_VISITA', 'INCIDENCIA_ALQUILER', 'DOCUMENTACION', 'RECLAMACION', 'CUENTA'];

// Texto que se muestra en pantalla para cada valor
export const roleLabels: Record<string, string> = {
  CLIENTE: 'Cliente',
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

// El cliente ve sus consultas en femenino y "Pendiente de tu respuesta" en vez de "Pendiente del cliente"
const customerStatusLabels: Record<string, string> = {
  ABIERTO: 'Abierta',
  EN_CURSO: 'En curso',
  PENDIENTE_CLIENTE: 'Pendiente de tu respuesta',
  RESUELTO: 'Resuelta',
  CERRADO: 'Cerrada',
};

export function statusLabel(status: string, isCustomer = false) {
  return (isCustomer ? customerStatusLabels[status] : statusLabels[status]) || status;
}

export const priorityLabels: Record<number, string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
};

// Clases CSS de la etiqueta de prioridad (priority-baja, priority-media, priority-alta)
export function priorityClass(priority: number) {
  const names: Record<number, string> = { 1: 'baja', 2: 'media', 3: 'alta' };
  return 'priority priority-' + (names[Number(priority)] || 'media');
}

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

// Alquiler: el precio es al mes
export function isRentStatus(status: string) {
  return status === 'Disponible para alquilar' || status === 'Alquilada';
}

export function formatPrice(property: Property) {
  let text = formatNumber(property.price) + ' €';
  if (isRentStatus(property.status)) {
    text += '/mes';
  }
  return text;
}

// Fechas: sin fecha o con una fecha que no se entiende se muestra una raya en vez de "Invalid Date"
function toDate(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(date?: string | null) {
  const d = toDate(date);
  return d ? d.toLocaleDateString('es-ES') : '—';
}

// Fecha con hora, para el historial y los mensajes: "12/5/2025, 10:32"
export function formatDateTime(date?: string | null) {
  const d = toDate(date);
  return d ? d.toLocaleString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

// Texto corto de la operación para las etiquetas de las fotos
export function operationLabel(status: string) {
  if (status === 'En venta') return 'Venta';
  if (status === 'Disponible para alquilar') return 'Alquiler';
  return status;
}

// Tipo en plural para los títulos del listado ("Pisos en venta en Madrid")
export const typePlurals: Record<string, string> = {
  Casa: 'Casas',
  Piso: 'Pisos',
  Local: 'Locales',
  Terreno: 'Terrenos',
};
