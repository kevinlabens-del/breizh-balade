/* Breizh’ Balade V2.4.0 — accès public sans compte.
   Couche de compatibilité pour l'ancien code qui appelle window.BreizhAuth. */
(() => {
  const RELEASE_VERSION = '2.4.0';
  const ANALYTICS_VERSION = '240';
  const LOCATION_PROMPT_KEY = 'breizh.locationPromptDismissed';

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

  const disableAutomaticLocationPrompt = () => {
    try {
      if (!localStorage.getItem(LOCATION_PROMPT_KEY)) localStorage.setItem(LOCATION_PROMPT_KEY, 'yes');
    } catch (_) {}
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

  const loadAnonymousAnalytics = () => {
    if (document.querySelector('script[data-breizh-analytics]')) return;
    const script = document.createElement('script');
    script.src = `js/analytics.js?v=${ANALYTICS_VERSION}`;
    script.async = true;
    script.dataset.breizhAnalytics = '1';
    document.head.appendChild(script);
  };

  normalizeLegacyHash();
  normalizePublicMetadata();
  disableAutomaticLocationPrompt();
  makePublic();
  loadAnonymousAnalytics();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      normalizePublicMetadata();
      makePublic();
    }, { once: true });
  }
})();
