const CACHE_NAME = 'jannati-ai-tutor-branding-v2';
const BASE = '/jannati-ai-tutor-v1/';
const APP_SHELL = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`,
  `${BASE}manifest.json`,
  `${BASE}brand/logo/logo-full.svg`,
  `${BASE}brand/logo/logo-horizontal.svg`,
  `${BASE}brand/logo/logo-icon.svg`,
  `${BASE}brand/logo/logo-monochrome.svg`,
  `${BASE}brand/favicon.ico`,
  `${BASE}brand/icons/icon-48.png`,
  `${BASE}brand/icons/icon-72.png`,
  `${BASE}brand/icons/icon-96.png`,
  `${BASE}brand/icons/icon-144.png`,
  `${BASE}brand/icons/icon-192.png`,
  `${BASE}brand/icons/icon-512.png`,
  `${BASE}logo.svg`,
  `${BASE}favicon.svg`,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
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
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(BASE)))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }))
      .catch(() => caches.match(BASE))
  );
});
