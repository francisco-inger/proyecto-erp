import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Config base del frontend web. La app desktop reutiliza este mismo build
// dentro de Electron (ver docs/ARCHITECTURE.md), y la app mobile vive en un
// proyecto React Native aparte que reutiliza los mismos módulos de negocio.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias SOLO para uso en el composition root (src/App.jsx), que es
      // el único archivo con permiso de importar módulos por nombre.
      modules: path.resolve(__dirname, 'src/modules'),
      core: path.resolve(__dirname, 'src/core'),
    },
  },
  server: {
    port: 5173,
  },
})
