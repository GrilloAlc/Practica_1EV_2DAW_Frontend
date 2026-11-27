import { useEffect, useState } from 'react';

// true si algo lleva cargando más de "ms" milisegundos.
// El backend está en el plan gratuito de Render y se duerme: la primera petición puede tardar ~30 s.
// Con esto, en vez de un esqueleto que no avanza, se explica qué pasa.
// "key" distingue una carga de otra (por ejemplo, otra búsqueda): cada una vuelve a esperar sus "ms"
export function useSlowLoading(loading: boolean, key = '', ms = 5000) {
  const [slowKey, setSlowKey] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setSlowKey(key), ms);
    return () => clearTimeout(timer);
  }, [loading, key, ms]);

  return loading && slowKey === key;
}
