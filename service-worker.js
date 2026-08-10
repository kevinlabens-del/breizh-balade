/* Breizh’ Balade V2.4.2 — service worker */
const CACHE_NAME = 'breizh-balade-v2.4.2-public';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/map.css',
  './css/responsive.css',
  './js/app.js',
  './js/tides-live.js',
  './js/tide-credit.js',
  './js/storage.js',
  './js/auth-local.js',
  './js/analytics.js',
  './js/geolocation.js',
  './js/map.js',
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

  const fresh = request.mode === 'navigate' || ['document', 'script', 'style', 'manifest'].includes(request.destination);
  event.respondWith(fresh ? networkFirst(request) : cacheFirst(request));
});
