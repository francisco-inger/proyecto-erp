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
    host: true, // Expone el servidor en la red local para teléfonos y tablets
    port: 5173,
    cors: true,
  },
  preview: {
    host: true,
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'core-engine': [
            path.resolve(__dirname, 'src/core/sync/erpSyncEngine.js'),
            path.resolve(__dirname, 'src/core/auth/AuthContext.jsx'),
            path.resolve(__dirname, 'src/core/rbac/permissions.js'),
          ],
        },
      },
    },
  },
})
