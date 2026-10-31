// Offline shell for Tineghir City (Capacitor + web).
// Cache-first for vendored assets + images; network-first for HTML.
// Tile archives (*.pmtiles) are versioned via tiles.json — never cache stale.
// The cache name carries a build hash: the version token below is replaced by
// scripts/build-js.mjs from the CSS/JS source bytes. Bumping it on change is
// what evicts stale cache-first assets; a bare 'tineghir-v1' would pin
// returning visitors to old CSS/JS. Do not edit the token by hand.
const CACHE_VERSION = '__SW_VERSION__';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './js/drawer.js',
  './js/tools.js',
  './manifest.webmanifest',
  // UI icon sprite: keeps nav/controls working on a cold offline launch.
  './images/icons.svg',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './vendor/protomaps-leaflet/protomaps-leaflet.js',
  // Critical self-hosted faces: keeps first-paint typography working offline.
  './fonts/outfit-400-latin.woff2',
  './fonts/playfair-display-700-latin.woff2',
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
      if (r && r.ok) {
        const copy = r.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html'))));
    return;
  }
  // Cache-first for same-origin GET only; never cache errors or cross-origin opaque.
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r && r.ok) {
      const copy = r.clone();
      caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy)).catch(() => {});
    }
    return r;
  }).catch(() => hit)));
});
