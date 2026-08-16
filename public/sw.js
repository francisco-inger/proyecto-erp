// Service Worker mínimo para soporte PWA Offline y Funcionamiento Standalone Nativo
const CACHE_NAME = 'appex-erp-cache-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Network first con fallback normal
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
