// Offline shell for Tineghir City (Capacitor + web).
// Cache-first for vendored assets + images; network-first for HTML.
// Tile archives (*.pmtiles) are versioned via tiles.json — never cache stale.
const CACHE_VERSION = 'tineghir-v1';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './js/drawer.js',
  './js/tools.js',
  './manifest.webmanifest',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './vendor/protomaps-leaflet/protomaps-leaflet.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Never serve stale tile archives: go to network, fall back to cache.
  if (url.pathname.endsWith('.pmtiles') || url.pathname.endsWith('tiles.json')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    e.respondWith(fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    const copy = r.clone();
    caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
    return r;
  }).catch(() => hit)));
});
