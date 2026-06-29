const CACHE_NAME='jannati-ai-tutor-v140-p1'; const BASE='/jannati-ai-tutor-v1/';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll([BASE,BASE+'index.html',BASE+'manifest.webmanifest',BASE+'logo.svg',BASE+'favicon.svg'])).catch(()=>{})); self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return; e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).catch(()=>caches.match(BASE))))});
