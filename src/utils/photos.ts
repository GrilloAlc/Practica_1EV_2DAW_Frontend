import type { Property } from '../types';

// Foto de respaldo para cada tipo de inmueble (public/images/tipos)
const TYPE_IMAGES: Record<string, string> = {
  Piso: '/images/tipos/piso.jpg',
  Casa: '/images/tipos/casa.jpg',
  Local: '/images/tipos/local.jpg',
  Terreno: '/images/tipos/terreno.jpg',
};

export function typeImage(type: string) {
  return TYPE_IMAGES[type] || TYPE_IMAGES.Piso;
}

function isPhotoUrl(text: string) {
  return text.startsWith('/') || /^https?:\/\/\S+$/.test(text);
}

// Todas las fotos de una casa, la portada primero.
// El backend guarda un solo texto (image). Para tener galería, ese texto puede llevar varias direcciones
// separadas por espacios o saltos de línea (es lo que sube scripts/subir-casas.mjs). Si algún día el backend
// devuelve una lista (images), se usa esa. Sin fotos válidas, la del tipo de inmueble.
export function propertyPhotos(property: Property): string[] {
  const list = Array.isArray(property.images) && property.images.length > 0 ? property.images : (property.image || '').split(/\s+/);
  const photos = [...new Set(list.map((p) => p.trim()).filter(isPhotoUrl))];
  return photos.length > 0 ? photos : [typeImage(property.type)];
}

export function coverPhoto(property: Property) {
  return propertyPhotos(property)[0];
}

// Unsplash sirve cada foto al ancho que se le pida: así el móvil no descarga una foto de 4000 px
const UNSPLASH_HOSTS = ['images.unsplash.com', 'plus.unsplash.com'];
const WIDTHS = [480, 800, 1200, 1600, 2200];

function isUnsplash(url: string) {
  try {
    return UNSPLASH_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function photoSrc(url: string, width = 1200) {
  if (!isUnsplash(url)) return url;
  const u = new URL(url);
  u.searchParams.set('w', String(width));
  u.searchParams.set('q', '75');
  u.searchParams.set('auto', 'format');
  u.searchParams.set('fit', 'crop');
  return u.toString();
}

export function photoSrcSet(url: string) {
  if (!isUnsplash(url)) return undefined;
  return WIDTHS.map((w) => `${photoSrc(url, w)} ${w}w`).join(', ');
}
