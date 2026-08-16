/*
===============================================================================
BREIZH’ BALLADE — service-worker.js
===============================================================================
Service worker de mise à jour + cache + splash universel.
Le nom du cache conserve volontairement v2.1.6.11 car les anciennes pages
suppriment les caches Breizh Balade qui ne contiennent pas cette chaîne.
===============================================================================
*/
const CACHE_NAME = 'breizh-balade-v2.1.6.11-universal-splash-21614';

const APP_SHELL = [
  './',
  './index.html',
  './app.html',
  './splash.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/map.css',
  './css/responsive.css',
  './js/app.js',
  './js/tide-credit.js',
  './js/storage.js',
  './js/auth-local.js',
  './js/geolocation.js',
  './js/map.js',
  './data/places.js',
  './assets/logo/breizh-balade-icon-v12.png',
  './assets/logo/breizh-balade-logo.svg',
  './assets/logo/breizh-pattern.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/places/coast.svg',
  './assets/places/forest.svg',
  './assets/places/heritage.svg',
  './assets/places/megalith.svg',
  './assets/places/island.svg',
  './assets/places/legend.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.includes('breizh-balade') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  const sameOrigin = url.origin === scopeUrl.origin;
  const insideScope = sameOrigin && url.pathname.startsWith(scopeUrl.pathname);

  /*
   * SPLASH UNIVERSEL : toutes les anciennes URL de lancement sont couvertes.
   * Le paramètre bb_splash=done permet à splash.html d'ouvrir app.html sans boucle.
   */
  if (insideScope && request.mode === 'navigate') {
    const isSplashPage = url.pathname.endsWith('/splash.html');
    const splashDone = url.searchParams.get('bb_splash') === 'done';

    if (!isSplashPage && !splashDone) {
      event.respondWith(
        fetch('./splash.html?bb_sw=21614', { cache: 'no-store' })
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put('./splash.html', copy));
            }
            return response;
          })
          .catch(() => caches.match('./splash.html')
            .then(cached => cached || caches.match('./index.html')))
      );
      return;
    }
  }

  const freshTypes = ['document', 'script', 'style', 'manifest'];
  const freshLocal = insideScope && (
    freshTypes.includes(request.destination) ||
    url.pathname.endsWith('/data/places.js') ||
    url.pathname.endsWith('/service-worker.js')
  );

  if (freshLocal) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./app.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok && insideScope) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('./app.html');
        if (request.destination === 'image') return caches.match('./assets/places/coast.svg');
        return cached;
      });
    })
  );
});

// v2.1.6.14 — universal splash for every historical launch URL
