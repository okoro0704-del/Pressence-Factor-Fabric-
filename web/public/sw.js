/**
 * PFF PROTOCOL — Service Worker
 * Caches Biometric, Camera, GPS logic + Sovereign Constitution for instant open.
 * Ensures Shield loads and runs locally on weak signal.
 * Bump CACHE_VERSION on each deploy so mobile drops old code.
 */

const CACHE_VERSION = 'v3';
const CACHE_NAME = 'pff-protocol-' + CACHE_VERSION;
const MEDIAPIPE_CACHE = 'pff-mediapipe-' + CACHE_VERSION;
const PRECACHE_URLS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/',
  '/dashboard/',
];

// Install: precache and take control immediately so new deploy wins
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

// Activate: purge all caches from previous versions so phone never loads stuck old code
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => (k.startsWith('pff-protocol-') && k !== CACHE_NAME) || (k.startsWith('pff-mediapipe-') && k !== MEDIAPIPE_CACHE))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets (biometric/constitution bundles live in _next/static), network-first for nav
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;

  const path = url.pathname;

  // MediaPipe CDN: cache camera/GPS logic assets for offline/weak signal
  if (url.hostname === 'cdn.jsdelivr.net' && (path.includes('@mediapipe/hands') || path.includes('@mediapipe/tasks-vision'))) {
    event.respondWith(
      caches.open(MEDIAPIPE_CACHE).then((cache) =>
        cache.match(request).then((cached) =>
          cached ||
          fetch(request, { mode: 'cors' })
            .then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // Same-origin only (for remaining rules)
  if (url.origin !== self.location.origin) return;

  // API and economic/reserve requests: always network, never cache (avoid stale national reserve / citizen impact)
  if (path.startsWith('/api/') || path.includes('national-reserve') || path.includes('citizen-impact') || path.includes('economic/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: cache-first (instant load for biometric, camera, GPS, constitution JS, CSS, icons)
  if (
    path.startsWith('/_next/static/') ||
    path.startsWith('/icons/') ||
    path === '/manifest.json' ||
    path.endsWith('.css')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Documents (HTML): always network when online (cache: no-store) so deploy delivers new code; fallback to cache only when offline
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Other GET: try cache then network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
