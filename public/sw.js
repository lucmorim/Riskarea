// public/sw.js
const CACHE_NAME = 'osm-tile-cache';

self.addEventListener('install', event =>
  event.waitUntil(self.skipWaiting())
);
self.addEventListener('activate', event =>
  event.waitUntil(self.clients.claim())
);

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(resp =>
          resp || fetch(event.request).then(networkResp => {
            cache.put(event.request, networkResp.clone());
            return networkResp;
          })
        )
      )
    );
  }
});
