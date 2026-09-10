// SophIA PWA Service Worker (2026 Resilient Mobile Edition)
// Optimized for iOS Safari, Android Chrome, Samsung Internet & Desktop PWA
const CACHE_NAME = 'sophia-ai-mobile-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with smart offline fallback to prevent stale script / white screen errors on mobile
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-GET or chrome-extension requests
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://')) {
    return;
  }

  // API Requests: Network first, with graceful offline fallback
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: true,
            offlineMode: true,
            message: 'SophIA funcionando en Modo Offline Local Autónomo.'
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Web pages & scripts: Network first to ensure fresh build chunks always load on mobile phones
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const indexCached = await caches.match('/index.html') || await caches.match('/');
          if (indexCached) return indexCached;
        }
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SophIA Offline</title></head><body style="background:#020617;color:#fff;font-family:sans-serif;text-align:center;padding:40px;"><h2>SophIA Asistente</h2><p>Conexión reanudándose...</p><button onclick="location.reload()" style="padding:10px 20px;border-radius:8px;background:#9333ea;color:#fff;border:none;">Reintentar</button></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
  );
});
