const CACHE_NAME = 'jannati-ai-tutor-v111';
const BASE = '/jannati-ai-tutor-v1/';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([
      BASE,
      BASE + 'index.html',
      BASE + 'manifest.webmanifest',
      BASE + 'logo.svg',
      BASE + 'favicon.svg'
    ])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => caches.match(BASE)))
  );
});
