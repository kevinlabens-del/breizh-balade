/*
===============================================================================
BREIZH’ BALLADE — service-worker.js
===============================================================================

Ce fichier gère une partie du cache de l’application.

Pour comprendre simplement :
- le navigateur peut garder certains fichiers en mémoire ;
- cela permet de charger l’application plus vite ;
- cela permet aussi un fonctionnement partiel hors ligne ;
- quand on change de version, on change le nom du cache pour forcer la mise à jour.

Attention :
- un service worker peut parfois garder une ancienne version ;
- en test, il faut parfois vider le cache ou changer le numéro de version.
===============================================================================
*/
/*
 * IMPORTANT : le nom du cache reste volontairement en v2.1.6.11.
 * index.html supprime actuellement tous les caches Breizh Balade qui ne portent
 * pas cette version. Le changer ici ferait supprimer le nouveau cache au prochain
 * lancement. Le code du service worker, lui, est tout de même mis à jour par le
 * navigateur et skipWaiting() + clients.claim() activent immédiatement la correction.
 */
const CACHE_NAME = 'breizh-balade-v2.1.6.11-stable-auth-api';
const APP_SHELL = [
  './',
  './index.html',
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
  './assets/places/legend.svg',
  './assets/sketches-v15/abbaye-beauport.jpg',
  './assets/sketches-v15/auray-saint-goustan.jpg',
  './assets/sketches-v15/belle-ile-port-coton.jpg',
  './assets/sketches-v15/broceliande-val-sans-retour.jpg',
  './assets/sketches-v15/cap-frehel.jpg',
  './assets/sketches-v15/carnac-alignements.jpg',
  './assets/sketches-v15/chateau-suscinio.jpg',
  './assets/sketches-v15/concarneau-ville-close.jpg',
  './assets/sketches-v15/dinan-port.jpg',
  './assets/sketches-v15/fort-la-latte.jpg',
  './assets/sketches-v15/fougeres-chateau.jpg',
  './assets/sketches-v15/gavrinis.jpg',
  './assets/sketches-v15/huelgoat.jpg',
  './assets/sketches-v15/ile-aux-moines.jpg',
  './assets/sketches-v15/ile-brehat.jpg',
  './assets/sketches-v15/ile-vierge-crozon.jpg',
  './assets/sketches-v15/josselin-canal.jpg',
  './assets/sketches-v15/lac-guerledan.jpg',
  './assets/sketches-v15/locronan.jpg',
  './assets/sketches-v15/meneham.jpg',
  './assets/sketches-v15/monts-arree-brasparts.jpg',
  './assets/sketches-v15/plougrescant-gouffre.jpg',
  './assets/sketches-v15/ploumanach-granit-rose.jpg',
  './assets/sketches-v15/pointe-du-raz.jpg',
  './assets/sketches-v15/pointe-grouin.jpg',
  './assets/sketches-v15/pointe-pen-hir.jpg',
  './assets/sketches-v15/pointe-saint-mathieu.jpg',
  './assets/sketches-v15/pointe-torche.jpg',
  './assets/sketches-v15/pont-aven.jpg',
  './assets/sketches-v15/quiberon-cote-sauvage.jpg',
  './assets/sketches-v15/roche-aux-fees.jpg',
  './assets/sketches-v15/rochefort-en-terre.jpg',
  './assets/sketches-v15/saint-cado.jpg',
  './assets/sketches-v15/sillon-talbert.jpg',
  './assets/sketches-v15/tremelin.jpg',
  './assets/sketches-v15/vallee-des-saints.jpg',
  './assets/sketches-v201/chateau-ballue.jpg',
  './assets/sketches-v201/chateau-bienassis.jpg',
  './assets/sketches-v201/chateau-bourbansais.jpg',
  './assets/sketches-v201/chateau-brest.jpg',
  './assets/sketches-v201/chateau-chateaugiron.jpg',
  './assets/sketches-v201/chateau-combourg.jpg',
  './assets/sketches-v201/chateau-hunaudaye.jpg',
  './assets/sketches-v201/chateau-kergrist.jpg',
  './assets/sketches-v201/chateau-kergroadez.jpg',
  './assets/sketches-v201/chateau-keriolet.jpg',
  './assets/sketches-v201/chateau-kerjean.jpg',
  './assets/sketches-v201/chateau-kerouzere.jpg',
  './assets/sketches-v201/chateau-lanniron.jpg',
  './assets/sketches-v201/chateau-montmuran.jpg',
  './assets/sketches-v201/chateau-quintin.jpg',
  './assets/sketches-v201/chateau-roche-maurice.jpg',
  './assets/sketches-v201/chateau-rochers-sevigne.jpg',
  './assets/sketches-v201/chateau-rosanbo.jpg',
  './assets/sketches-v201/chateau-taureau.jpg',
  './assets/sketches-v201/chateau-tonquedec.jpg',
  './assets/sketches-v201/chateau-trecesson.jpg',
  './assets/sketches-v201/chateau-vitre.jpg',
  './assets/sketches-v201/domaine-roche-jagu.jpg',
  './assets/sketches-v201/domaine-trevarez.jpg',
  './assets/sketches-v201/regalante-mont-saint-michel-nantes.jpg',
  './assets/sketches-v201/tours-elven-largoet.jpg',
  './assets/sketches-v201/traversee-bretonne-nantes-mont-saint-michel.jpg',
  './assets/sketches-v201/velodyssee-roscoff-nantes.jpg',
  './assets/sketches-v201/velomaritime-roscoff-mont-saint-michel.jpg',
  './assets/sketches-v201/voie-3-saint-malo-arzal.jpg',
  './assets/sketches-v201/voie-4-saint-malo-questembert.jpg',
  './assets/sketches-v201/voie-6-roscoff-nantes.jpg',
  './assets/sketches-v201/voie-7-carhaix-saint-meen.jpg',
  './assets/sketches-v201/voie-8-roscoff-concarneau.jpg',
  './assets/sketches-v201/voie-9-saint-brieuc-lorient.jpg',
];

/* install : lancé quand le service worker est installé. */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

/* activate : lancé quand le nouveau service worker remplace l’ancien. */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

/* fetch : intercepte certaines requêtes pour répondre avec le cache ou le réseau. */
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isLocal = url.origin === location.origin;

  /*
   * Splash robuste pour les installations existantes.
   * Certaines installations Android conservent l'ancien start_url (index.html)
   * même après modification du manifest. Si l'utilisateur ouvre directement
   * index.html ou la racine de l'application, on sert donc splash.html.
   * splash.html redirige ensuite vers index.html?splash=done, ce marqueur évite
   * toute boucle et laisse l'application se charger normalement.
   */
  if (isLocal && request.mode === 'navigate') {
    const scopePath = new URL('./', self.registration.scope).pathname;
    const isAppEntry = url.pathname === scopePath || url.pathname === `${scopePath}index.html`;
    const splashAlreadyShown = url.searchParams.get('splash') === 'done';

    if (isAppEntry && !splashAlreadyShown) {
      event.respondWith(
        fetch('./splash.html', { cache: 'no-store' })
          .then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./splash.html', copy));
            return response;
          })
          .catch(() => caches.match('./splash.html').then(cached => cached || caches.match('./index.html')))
      );
      return;
    }
  }

  const freshTypes = ['document', 'script', 'style', 'manifest'];
  const isFreshLocal = isLocal && (freshTypes.includes(request.destination) || url.pathname.endsWith('/data/places.js'));

  if (isFreshLocal) {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        if (response.ok && isLocal) caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('./index.html');
        if (request.destination === 'image') return caches.match('./assets/places/coast.svg');
        return cached;
      });
    })
  );
});

// v2.1.6.11-splash-startup-fix — splash fiable pour nouvelles + anciennes installations
// v2.1.6.11-visuels-35-croquis — cache refresh for corrected new visuals
// v1.9.11-cleanup
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.includes('breizh-balade') && key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});