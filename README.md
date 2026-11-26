# CataHome · Frontend

Web de una inmobiliaria de casas en venta y alquiler, con zona de clientes y sistema de consultas
(tickets) atendidas por agentes. Es la parte cliente del proyecto trimestral de 2º DAW; la API está en
`Practica_1EV_2DAW_Backend` (Node + Express + MongoDB).

## URLs públicas

| Parte | URL |
|---|---|
| Web (frontend) | _pendiente de desplegar_ |
| API (backend) | https://practica-1ev-2daw-backend.onrender.com/api |
| Documentación de la API (Swagger) | _URL de la API_ + `/api-docs` |

## Qué se puede hacer

- **Visitante:** ver el inicio, buscar casas por operación, tipo, ciudad y precio, ver la ficha de cada
  casa (fotos, datos, calculadora de hipoteca y enlace al mapa), leer "Nosotros" y las preguntas
  frecuentes, y crear una cuenta (siempre de cliente).
- **Cliente:** editar su perfil; abrir consultas sobre una casa o pedir una visita; ver sus consultas
  filtradas por estado; responder; pedir que se reabra una consulta resuelta o confirmar su cierre.
- **Agente:** ver las consultas que tiene asignadas, responder y cambiar su estado y prioridad.
- **Administrador:** ver todas las consultas y filtrarlas por estado, prioridad, cliente y agente;
  asignarlas y cerrarlas; ver el historial de cambios de estado; gestionar usuarios y roles; dar de
  alta, editar y desactivar casas; ver el resumen con las métricas de consultas.

Los permisos los comprueba el backend. El frontend solo enseña a cada rol lo que puede usar y, si el
backend deniega algo (por ejemplo, un cliente que abre la consulta de otro cambiando la URL), muestra
un aviso claro de "No tienes acceso a esta consulta".

## Tecnologías

React 19, TypeScript, Vite y React Router. Las peticiones a la API se hacen con `fetch`
(`src/api/client.ts`) y hay una función por endpoint en `src/api/*.ts`.

## Requisitos

- Node.js 20.19 o superior y npm.
- Conexión a Internet: por defecto se usa la API publicada en Render.

## Instalación y arranque en local

```bash
npm install
npm run dev
```

La web se abre en http://localhost:5173. Las peticiones a `/api` las reenvía Vite a la API publicada
en Render (ver `vite.config.ts`). Para usar un backend arrancado en tu ordenador:

```bash
BACKEND_URL=http://localhost:3000 npm run dev
```

La API de Render se duerme si nadie la usa: la primera petición puede tardar unos 30 segundos.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Comprueba los tipos y genera la web lista para publicar en `dist/`. |
| `npm run preview` | Sirve la versión de `dist/` para probarla. |
| `npm run lint` | Revisa el código con ESLint. |
| `npm run lanzar` | Instala, compila y arranca en un solo paso. |

## Variables de entorno

No hace falta ninguna. La web llama siempre a `/api` en su propio dominio, y ese `/api` lo reenvían al
backend Vite (en local) y `vercel.json` (en Vercel). Así no hay problemas de CORS.

| Variable | Ejemplo | Para qué sirve |
|---|---|---|
| `VITE_API_URL` | `https://otra-api.ejemplo.com/api` | Opcional. Llamar a otra API directamente en vez de a `/api`; esa API tendría que permitir CORS. |
| `BACKEND_URL` | `http://localhost:3000` | Opcional, solo en local. A qué backend reenvía Vite `/api`. |

No hay claves ni contraseñas en el frontend: el token de sesión lo da el backend al iniciar sesión.

## Despliegue

La web está en Vercel, conectada al repositorio de GitHub: cada push a `main` se publica solo.
`vercel.json` lleva dos reglas:

1. `/api/...` se reenvía a `https://practica-1ev-2daw-backend.onrender.com/api/...`. Si la API cambia de
   dirección, se cambia aquí y en `vite.config.ts`.
2. Cualquier otra ruta (por ejemplo `/propiedades/123`) devuelve `index.html`, porque es una aplicación
   de una sola página.

## Modo de prueba sin backend

`USE_FAKE_DATA` en `src/api/client.ts` está en `false`: la web usa la API real. Si se pone en `true`, usa
los datos de `src/data/fakeData.ts`, útil para probar sin backend. Cuando todo funcione contra la API se
borran `fakeData.ts` y las ramas `if (USE_FAKE_DATA)` de `src/api/`.

## Usuarios de prueba

Todos los datos son ficticios.

**Con la API real** (deben existir en la base de datos del backend desplegado):

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | _pendiente_ | _pendiente_ |
| Agente | _pendiente_ | _pendiente_ |
| Administrador | _pendiente_ | _pendiente_ |

**En modo de prueba** (`USE_FAKE_DATA = true`):

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | maria@correo.com | maria1234 |
| Agente | ana@inmobiliaria.es | ana12345 |
| Administrador | admin@inmobiliaria.es | admin1234 |

## Estructura

```
src/
  api/          fetch a la API (client.ts) y una función por endpoint
  components/   piezas compartidas: menú y pie, tarjetas de casas, carrusel, esqueletos de carga…
  context/      sesión del usuario (AuthProvider)
  data/         datos de prueba (solo mientras USE_FAKE_DATA = true)
  pages/        una página por ruta; pages/admin para el panel de administración
  utils/        textos de estados y prioridades, formato de precios y fechas
  App.tsx       rutas de la web
public/images/  fotos de las casas (de Unsplash, ver CREDITOS.md)
```

## Marca

El logo es propio: una C de estilo Bodoni que abraza un tejado. El símbolo solo sirve de favicon y de
icono; en el logotipo hace de primera letra de "CataHome". Los archivos están en `public/brand/`:

| Archivo | Uso |
|---|---|
| `catahome-simbolo.svg` | Símbolo en tinta y vino, para fondos claros |
| `catahome-simbolo-claro.svg` | Símbolo en blanco, para fondos oscuros |
| `catahome-logo.svg` | Logotipo completo para fondos claros |
| `catahome-logo-claro.svg` | Logotipo completo para fondos oscuros |

El texto del logotipo usa la fuente Bodoni Moda. Fuera del navegador hay que tenerla instalada o
convertir el texto en trazos (por ejemplo, con Inkscape). En la web, el logo es el componente `Logo`
(`src/components/Layout.tsx`) con el símbolo de `src/components/BrandSymbol.tsx`.

## Créditos

Fotos de [Unsplash](https://unsplash.com) (detalle en `public/images/CREDITOS.md`). Las sugerencias
de direcciones del formulario de casas vienen de [Photon](https://photon.komoot.io), el buscador de
OpenStreetMap.
