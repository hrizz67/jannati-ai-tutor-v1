const CACHE_NAME = 'jannati-ai-tutor-branding-v12';
const BASE = '/jannati-ai-tutor-v1/';
const APP_SHELL = [
  BASE,
  `${BASE}index.html`,
  `${BASE}brand/logo/logo-full.svg`,
  `${BASE}brand/logo/logo-horizontal.svg`,
  `${BASE}brand/logo/logo-icon.svg`,
  `${BASE}brand/logo/logo-monochrome.svg`,
  `${BASE}brand/icons/favicon.ico`,
  `${BASE}brand/icons/icon-48.png`,
  `${BASE}brand/icons/icon-72.png`,
  `${BASE}brand/icons/icon-96.png`,
  `${BASE}brand/icons/icon-144.png`,
  `${BASE}brand/icons/apple-touch-icon.png`,
  `${BASE}brand/icons/icon-192.png`,
  `${BASE}brand/icons/icon-512.png`,
  `${BASE}brand/brand/brand-tokens.css`,
  `${BASE}brand/brand/brand-colors.json`,
  `${BASE}brand/brand/manifest-snippet.json`,
  `${BASE}brand/mascot/mascot-manifest.json`,
  `${BASE}brand/mascot/janna/README.md`,
  `${BASE}brand/mascot/jati/README.md`,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        for (const url of APP_SHELL) {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) {
              await cache.put(url, response.clone());
            }
          } catch {
            // Ignore install-time network failures; keep the shell best-effort.
          }
        }
      })
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const acceptsHtml = request.headers.get('accept')?.includes('text/html');

  if (request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(BASE)))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }))
      .catch(() => Promise.reject(new Error(`Network request failed for ${request.url}`)))
  );
});
