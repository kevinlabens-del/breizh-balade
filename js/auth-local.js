/* Breizh’ Balade V2.4.5 — accès public + localisation demandée à l’arrivée. */
(() => {
  const RELEASE_VERSION = '2.4.5';
  const ASSET_VERSION = '245';
  let startupLocationRequested = false;

  const normalizeLegacyHash = () => {
    const legacy = new Set(['login', 'signup', 'profile']);
    const current = String(location.hash || '').replace('#', '');
    if (legacy.has(current)) history.replaceState(null, '', `${location.pathname}${location.search}#explore`);
  };

  const normalizePublicMetadata = () => {
    document.documentElement.dataset.bbVersion = RELEASE_VERSION;
    document.title = 'Breizh’ Balade — 71 idées de sorties en Bretagne';
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = 'Breizh’ Balade — 71 idées de sorties en Bretagne : nature, patrimoine, plages, forêts, châteaux et balades.';
    }
  };

  const clearLegacyTideSessionLock = () => {
    try { sessionStorage.removeItem('breizh.tideRequests.thisSession'); } catch (_) {}
  };

  const requestStartupLocation = async () => {
    if (startupLocationRequested) return;
    startupLocationRequested = true;

    try {
      if (typeof Geo === 'undefined' || !Geo?.getPosition) return;
      const position = await Geo.getPosition();
      try {
        if (typeof BreizhMap !== 'undefined' && BreizhMap?.setUser) BreizhMap.setUser(position);
      } catch (_) {}
      try {
        window.dispatchEvent(new CustomEvent('breizh:location-ready', { detail: position }));
      } catch (_) {}
    } catch (_) {
      // Un refus ou un GPS désactivé ne bloque jamais le reste de l’application.
    }
  };

  const protectTideButtonUntilLiveModule = () => {
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-load-tides]');
      if (!button || window.__BREIZH_LIVE_TIDES_LOADED__) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const original = button.textContent;
      button.textContent = '🌊 Module marées en chargement…';
      button.disabled = true;
      setTimeout(() => {
        if (!button.isConnected) return;
        button.disabled = false;
        button.textContent = window.__BREIZH_LIVE_TIDES_LOADED__ ? '🌊 Estimer les marées' : (original || '🌊 Estimer les marées');
      }, 700);
    }, true);
  };

  const makePublic = () => {
    document.body?.classList.remove('is-guest');
    document.body?.classList.add('is-authenticated');

    document.querySelectorAll(
      '[data-account-go], #accountMenuTab, #signupMenuTab, #profileMenuTab, #view-login, #view-signup, #view-profile'
    ).forEach(el => el.remove());

    document.querySelectorAll('[data-access="private"]').forEach(el => {
      el.dataset.access = 'public';
      el.classList.remove('is-locked');
      el.setAttribute('aria-disabled', 'false');
      el.removeAttribute('title');
    });

    const status = document.getElementById('accountStatusMini');
    if (status) status.textContent = 'Accès public • favoris et listes enregistrés sur cet appareil';
  };

  const PublicAccess = {
    currentAccount: () => null,
    isConnected: () => true,
    requireAuth: () => true,
    updateUI: makePublic,
    go: view => {
      const target = view && !['login', 'signup', 'profile'].includes(view) ? view : 'explore';
      if (window.location.hash !== `#${target}`) window.location.hash = target;
    }
  };

  window.BreizhAuth = PublicAccess;
  window.BreizhPublicAccess = PublicAccess;

  const loadScriptOnce = (src, dataName) => {
    if (document.querySelector(`script[data-${dataName}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute(`data-${dataName}`, '1');
    document.head.appendChild(script);
  };

  const loadPublicServices = () => {
    loadScriptOnce(`js/analytics.js?v=${ASSET_VERSION}`, 'breizh-analytics');
    loadScriptOnce(`js/tides-live.js?v=${ASSET_VERSION}`, 'breizh-tides-live');
  };

  normalizeLegacyHash();
  normalizePublicMetadata();
  clearLegacyTideSessionLock();
  protectTideButtonUntilLiveModule();
  makePublic();
  loadPublicServices();

  const start = () => {
    normalizePublicMetadata();
    makePublic();
    // La localisation est demandée à l’arrivée pour que les fonctions liées à la position soient prêtes.
    setTimeout(requestStartupLocation, 250);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
