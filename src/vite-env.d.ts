/// <reference types="vite/client" />

// Variables de entorno del frontend (ver .env.example)
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
