const CACHE_NAME = 'tj-academy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/App.tsx',
  '/manifest.json'
];

// Instalación del Service Worker
// Fix: Use 'any' type for event to access waitUntil
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
// Fix: Use 'any' type for event to access waitUntil
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - estrategia Network First, fallback a Cache
// Fix: Use 'any' type for event to access respondWith and request
self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar la respuesta
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});