/* Breizh’ Balade — accès public sans compte.
   Ce fichier garde uniquement une petite couche de compatibilité pour l'ancien code
   qui appelait window.BreizhAuth. Aucun compte, email ou mot de passe n'est utilisé. */
(() => {
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
    script.src = 'js/analytics.js?v=235';
    script.async = true;
    script.dataset.breizhAnalytics = '1';
    document.head.appendChild(script);
  };

  makePublic();
  loadAnonymousAnalytics();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makePublic, { once: true });
  }
})();
