/*
  APPEX ERP — Enterprise Progressive Web App (PWA) Service Worker
  Version: 2.1.0
  Estrategia de Caching Híbrida: Network-First con Fallback Offline & Cache-First para Assets Estáticos
*/

const CACHE_NAME = 'appex-erp-v2.1.0'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/branding/logo_appex.jpg',
  '/branding/dashboard_hero.jpg',
  '/branding/dashboard_modern_hero.jpg',
  '/branding/login_split_hero.jpg'
]

// 1. Instalación y Precaching de Assets Esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA SW] Algunos assets no pudieron precachearse:', err)
      })
    })
  )
  self.skipWaiting()
})

// 2. Activación y Limpieza de Versiones Antiguas de Caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] Purgando caché obsoleta:', key)
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 3. Estrategia de Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar peticiones que no sean GET o esquemas no soportados (chrome-extension, etc.)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return
  }

  // A. Peticiones de Navegación (HTML / Páginas): Network-First con Fallback a Caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return networkResponse
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request)
          if (cachedResponse) return cachedResponse
          return caches.match('/') || caches.match('/index.html')
        })
    )
    return
  }

  // B. Fuentes y Recursos Estáticos de Google Fonts o Branding: Cache-First
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.pathname.startsWith('/branding/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return networkResponse
        }).catch(() => null)
      })
    )
    return
  }

  // C. Scripts JS y Estilos CSS: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        }
        return networkResponse
      }).catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
