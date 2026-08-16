/* BREIZH’ BALADE — service-worker.js
   V2.1.6.16 : splash officiel + compatibilité anciennes installations. */
const CACHE_NAME = 'breizh-balade-v2.1.6.11-splash-21616';
const APP_SHELL = [
  './','./index.html','./app.html','./splash.html','./manifest.webmanifest',
  './assets/splash/breizh-balade-splash.jpg',
  './css/style.css','./css/map.css','./css/responsive.css',
  './js/app.js','./js/tide-credit.js','./js/storage.js','./js/auth-local.js','./js/geolocation.js','./js/map.js',
  './data/places.js','./assets/logo/breizh-balade-icon-v12.png','./assets/logo/breizh-balade-logo.svg',
  './assets/logo/breizh-pattern.svg','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/places/coast.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.includes('breizh-balade') && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  const insideScope = url.origin === scope.origin && url.pathname.startsWith(scope.pathname);

  if (insideScope && request.mode === 'navigate') {
    const splashDone = url.searchParams.get('bb_splash') === 'done';
    const isSplash = url.pathname.endsWith('/splash.html');
    if (!splashDone && !isSplash) {
      event.respondWith(
        fetch('./splash.html?v=21616', {cache:'no-store'})
          .then(r => r.ok ? r : Promise.reject(new Error('splash unavailable')))
          .catch(() => caches.match('./splash.html').then(r => r || caches.match('./index.html')))
      );
      return;
    }
  }

  const networkFirst = insideScope && (
    ['document','script','style','manifest'].includes(request.destination) ||
    url.pathname.endsWith('/data/places.js')
  );

  if (networkFirst) {
    event.respondWith(fetch(request,{cache:'no-store'}).then(response => {
      if (response.ok) {
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request,copy));
      }
      return response;
    }).catch(() => caches.match(request).then(r => r || caches.match('./app.html'))));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && insideScope) {
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request,copy));
    }
    return response;
  })));
});
