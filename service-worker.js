/* Breizh’ Balade V2.4.4 — service worker stable */
const CACHE_NAME = 'breizh-balade-v2.4.4-public';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/map.css',
  './css/responsive.css',
  './js/app.js',
  './js/storage.js',
  './js/geolocation.js?v=244',
  './js/map.js',
  './js/auth-local.js?v=243',
  './js/tides-live.js?v=243',
  './js/tide-credit.js?v=243',
  './js/analytics.js?v=243',
  './data/places.js',
  './assets/logo/breizh-balade-icon-v12.png',
  './assets/logo/breizh-balade-logo.svg',
  './assets/logo/breizh-pattern.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/places/coast.svg'
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
        keys
          .filter(key => key.startsWith('breizh-balade-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

const networkFirst = async request => {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./index.html');
    throw error;
  }
};

const hotfixScript = async (originalRequest, target) => {
  try {
    const response = await fetch(target, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const cache = await caches.open(CACHE_NAME);
    cache.put(originalRequest, response.clone()).catch(() => {});
    return response;
  } catch (error) {
    const cachedTarget = await caches.match(target);
    if (cachedTarget) return cachedTarget;
    const cachedOriginal = await caches.match(originalRequest);
    if (cachedOriginal) return cachedOriginal;
    throw error;
  }
};

const cacheFirst = async request => {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    if (request.destination === 'image') {
      const fallback = await caches.match('./assets/places/coast.svg');
      if (fallback) return fallback;
    }
    throw error;
  }
};

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/js/geolocation.js')) {
    event.respondWith(hotfixScript(request, new URL('./js/geolocation.js?v=244', self.location.href).href));
    return;
  }
  if (url.pathname.endsWith('/js/auth-local.js')) {
    event.respondWith(hotfixScript(request, new URL('./js/auth-local.js?v=243', self.location.href).href));
    return;
  }
  if (url.pathname.endsWith('/js/tide-credit.js')) {
    event.respondWith(hotfixScript(request, new URL('./js/tide-credit.js?v=243', self.location.href).href));
    return;
  }
  if (url.pathname.endsWith('/js/tides-live.js')) {
    event.respondWith(hotfixScript(request, new URL('./js/tides-live.js?v=243', self.location.href).href));
    return;
  }

  const fresh = request.mode === 'navigate' || ['document', 'script', 'style', 'manifest'].includes(request.destination);
  event.respondWith(fresh ? networkFirst(request) : cacheFirst(request));
});
