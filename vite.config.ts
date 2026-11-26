import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Backend al que se mandan las peticiones a /api mientras se desarrolla.
// Por defecto, el publicado en Render. Para usar uno arrancado en local:
//   BACKEND_URL=http://localhost:3000 npm run dev
const BACKEND_URL = process.env.BACKEND_URL || 'https://practica-1ev-2daw-backend.onrender.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Las peticiones a /api se mandan al backend (así no hay problemas de CORS).
    // En Vercel hace lo mismo la regla de vercel.json
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true },
    },
  },
})
