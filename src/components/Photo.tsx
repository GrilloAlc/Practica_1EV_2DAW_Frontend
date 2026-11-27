import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { photoSrc, photoSrcSet } from '../utils/photos';

interface PhotoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'onError'> {
  src: string;
  // Foto que se enseña si la de la casa no carga (por ejemplo, la del tipo de inmueble)
  fallback: string;
  // Ancho de la versión por defecto; con srcSet y sizes el navegador elige la que necesita
  pixels?: number;
}

// Foto de una casa: con varios tamaños para cada pantalla y, si falla, la foto de respaldo en vez del icono roto
function Photo({ src, fallback, pixels = 1200, alt = '', ...rest }: PhotoProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const url = failed === src ? fallback : src;

  return (
    <img
      {...rest}
      alt={alt}
      src={photoSrc(url, pixels)}
      srcSet={photoSrcSet(url)}
      onError={() => {
        if (failed !== src) setFailed(src);
      }}
    />
  );
}

export default Photo;
