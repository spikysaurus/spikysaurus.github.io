const VERSION = 'pwaify-v1';
const APP_SHELL = ['/', 'pwa/manifest.json', 'pwa/offline.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(VERSION);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || (await caches.match('pwa/offline.html'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(VERSION);
  cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (['style','script','image','font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }
});
