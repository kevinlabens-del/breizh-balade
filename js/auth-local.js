/*
===============================================================================
BREIZH’ BALLADE — js/auth-local.js
===============================================================================

V2.1.6.6.5.4.3.2.1 — Accès obligatoire par connexion / inscription locale.

But de cette correction :
- l’application s’ouvre sur Connexion si aucun compte n’est connecté ;
- les pages de balades, carte, favoris, etc. sont bloquées sans connexion ;
- l’inscription crée un compte local puis connecte automatiquement ;
- le profil reste accessible seulement après connexion.

Important :
- cette version fonctionne sans serveur ;
- les comptes sont enregistrés dans localStorage, donc uniquement sur ce navigateur ;
- ce n’est PAS une sécurité professionnelle ;
- Google, Facebook et mot de passe oublié sont préparés visuellement, mais ils
  nécessiteront un vrai serveur ou un service d’authentification plus tard.
===============================================================================
*/

const BreizhAuth = (() => {
  const prefix = 'breizhAuth:';
  const accountsKey = `${prefix}accounts`;
  const sessionKey = `${prefix}sessionEmail`;
  const publicViews = new Set(['login', 'signup']);
  const guestDefaultView = 'login';
  const afterLoginView = 'explore';

  const $ = id => document.getElementById(id);
  const normalizeEmail = value => String(value || '').trim().toLowerCase();

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  };

  const writeJSON = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  };

  const readAccounts = () => readJSON(accountsKey, {});
  const writeAccounts = accounts => writeJSON(accountsKey, accounts);

  const currentEmail = () => normalizeEmail(localStorage.getItem(sessionKey));
  const currentAccount = () => {
    const email = currentEmail();
    if (!email) return null;
    return readAccounts()[email] || null;
  };

  const isConnected = () => !!currentAccount();

  const viewFromHash = () => {
    const raw = String(window.location.hash || '').replace('#', '').trim();
    if (raw) return raw;
    return isConnected() ? afterLoginView : guestDefaultView;
  };

  const setMessage = (message, type = 'info') => {
    const box = $('authMessage');
    if (!box) return;
    box.textContent = message;
    box.dataset.type = type;
    box.classList.add('is-visible');
  };

  const showToast = message => {
    if (typeof window.showToast === 'function') {
      window.showToast(message);
      return;
    }
    setMessage(message, 'info');
  };

  const PASSWORD_SALT = 'breizh-local-account-v1:';

  const makePasswordHash = async (password, salt) => {
    const text = String(password || '');
    if (window.crypto?.subtle && window.TextEncoder) {
      const data = new TextEncoder().encode(`${salt}${text}`);
      const buffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return btoa(unescape(encodeURIComponent(`${salt}${text}`)));
  };

  const hashPassword = password => makePasswordHash(password, PASSWORD_SALT);

  const legacyPasswordHashes = async password => {
    const salts = [
      'breizh-local-v2.1.6.6.5.4.3.2:',
      'breizh-local-v2.1.6.6.5.4.3.2:',
      'breizh-local-v2.1.6.6.5.4.3.2:',
      'breizh-local-v2.1.6.6.5.4.3.2:',
      'breizh-local-v2.1.6.6.5.4.3.2:',
      'breizh-local-v2.1.6.6.5.4.3.2:',
      'breizh-local-v2.1.6.6.5.4.3.2:'
    ];

    return Promise.all(salts.map(salt => makePasswordHash(password, salt)));
  };

  const initials = account => {
    const profile = account?.profile || {};
    const base = profile.pseudo || profile.firstname || account?.email || '?';
    return String(base).trim().slice(0, 2).toUpperCase();
  };

  const go = view => {
    const target = view || (isConnected() ? afterLoginView : guestDefaultView);
    if (window.location.hash !== `#${target}`) window.location.hash = target;
    else guardRoute();
  };

  const updateMenuAccess = () => {
    const connected = isConnected();
    document.querySelectorAll('[data-access="private"]').forEach(btn => {
      btn.classList.toggle('is-locked', !connected);
      btn.setAttribute('aria-disabled', connected ? 'false' : 'true');
      if (!connected) btn.title = 'Connexion obligatoire';
      else btn.removeAttribute('title');
    });
  };

  const enforceVisibleAuthView = () => {
    if (isConnected()) return;

    const requested = viewFromHash();
    const target = publicViews.has(requested) ? requested : guestDefaultView;

    document.querySelectorAll('.view').forEach(section => {
      section.classList.toggle('is-visible', section.id === `view-${target}`);
    });

    document.querySelectorAll('[data-view]').forEach(tab => {
      tab.classList.toggle('is-active', tab.dataset.view === target);
    });

    const label = document.getElementById('currentViewLabel');
    if (label) label.textContent = target === 'signup' ? 'Inscription' : 'Connexion';
  };

  const guardRoute = () => {
    const connected = isConnected();
    const view = viewFromHash();

    if (!connected && !publicViews.has(view)) {
      window.location.hash = 'login';
      setTimeout(() => {
        enforceVisibleAuthView();
        setMessage('Connexion obligatoire : connecte-toi ou crée un compte local pour accéder à l’application.', 'info');
      }, 60);
      return false;
    }

    if (connected && (view === 'login' || view === 'signup')) {
      window.location.hash = afterLoginView;
      return false;
    }

    updateMenuAccess();
    return true;
  };

  const setSession = email => {
    if (email) localStorage.setItem(sessionKey, normalizeEmail(email));
    else localStorage.removeItem(sessionKey);
    updateUI();
  };

  const updateStats = () => {
    try {
      const all = window.Store?.all?.() || {};
      const set = (id, value) => { const el = $(id); if (el) el.textContent = String(value || 0); };
      set('statFavorites', (all.favorites || []).length);
      set('statLater', (all.later || []).length);
      set('statVisited', (all.visited || []).length);
    } catch (_) {}
  };

  const fillProfileForm = account => {
    const profile = account?.profile || {};
    const set = (id, value) => {
      const el = $(id);
      if (el) el.value = value || '';
    };

    set('profilePseudo', profile.pseudo);
    set('profileFirstname', profile.firstname);
    set('profileCity', profile.city);
    set('profileDepartment', profile.department);
    set('profileStyle', profile.style);
    set('profileDistance', profile.distance);
    set('profileLevel', profile.level);
    set('profileBio', profile.bio);
  };

  const updateUI = () => {
    const account = currentAccount();
    const connected = !!account;

    document.body.classList.toggle('is-authenticated', connected);
    document.body.classList.toggle('is-guest', !connected);

    const accountStatusMini = $('accountStatusMini');
    if (accountStatusMini) {
      accountStatusMini.textContent = connected
        ? `Connecté : ${(account.profile?.pseudo || account.email)}`
        : 'Connexion obligatoire';
    }

    const accountMenuTab = $('accountMenuTab');
    if (accountMenuTab) {
      accountMenuTab.textContent = '🔐 Connexion';
      accountMenuTab.hidden = connected;
    }

    const signupMenuTab = $('signupMenuTab');
    if (signupMenuTab) signupMenuTab.hidden = connected;

    const profileMenuTab = $('profileMenuTab');
    if (profileMenuTab) profileMenuTab.hidden = !connected;

    const profileTitle = $('profileTitle');
    const profileSubtitle = $('profileSubtitle');
    const profileAvatar = $('profileAvatar');
    const logoutBtn = $('logoutBtn');

    if (profileTitle) profileTitle.textContent = connected ? (account.profile?.pseudo || account.email) : 'Aucun compte connecté';
    if (profileSubtitle) {
      profileSubtitle.textContent = connected
        ? `Compte local : ${account.email}`
        : 'Connecte-toi ou crée un compte local pour tester le futur profil utilisateur.';
    }
    if (profileAvatar) profileAvatar.textContent = connected ? initials(account) : '?';
    if (logoutBtn) logoutBtn.hidden = !connected;

    document.querySelectorAll('[data-go-login]').forEach(btn => { btn.hidden = connected; });

    const profileForm = $('profileForm');
    if (profileForm) {
      profileForm.querySelectorAll('input, select, textarea, button').forEach(field => {
        field.disabled = !connected;
      });
    }

    fillProfileForm(account);
    updateStats();
    updateMenuAccess();
    enforceVisibleAuthView();
  };

  const signUp = async event => {
    event.preventDefault();

    const pseudo = $('signupPseudo')?.value?.trim();
    const email = normalizeEmail($('signupEmail')?.value);
    const password = $('signupPassword')?.value || '';
    const confirm = $('signupPasswordConfirm')?.value || '';

    if (!pseudo || !email || !password) {
      setMessage('Remplis le pseudo, l’email et le mot de passe.', 'error');
      return;
    }

    if (password.length < 4) {
      setMessage('Le mot de passe local doit contenir au moins 4 caractères.', 'error');
      return;
    }

    if (password !== confirm) {
      setMessage('Les deux mots de passe ne correspondent pas.', 'error');
      return;
    }

    const accounts = readAccounts();
    if (accounts[email]) {
      setMessage('Un compte local existe déjà avec cet email.', 'error');
      return;
    }

    accounts[email] = {
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
      provider: 'local',
      profile: {
        pseudo,
        firstname: '',
        city: '',
        department: '',
        style: '',
        distance: '',
        level: '',
        bio: ''
      }
    };

    if (!writeAccounts(accounts)) {
      setMessage('Impossible d’enregistrer le compte local. Stockage navigateur plein ou bloqué.', 'error');
      return;
    }

    setSession(email);
    setMessage('Compte local créé ✅ Accès à l’application autorisé.', 'success');
    setTimeout(() => go(afterLoginView), 450);
  };

  const login = async event => {
    event.preventDefault();

    const email = normalizeEmail($('loginEmail')?.value);
    const password = $('loginPassword')?.value || '';
    const accounts = readAccounts();
    const account = accounts[email];

    if (!account) {
      setMessage('Aucun compte local trouvé avec cet email.', 'error');
      return;
    }

    const hash = await hashPassword(password);
    const legacyHashes = await legacyPasswordHashes(password);
    if (hash !== account.passwordHash && !legacyHashes.includes(account.passwordHash)) {
      setMessage('Mot de passe local incorrect.', 'error');
      return;
    }

    if (hash !== account.passwordHash) {
      account.passwordHash = hash;
      account.updatedAt = new Date().toISOString();
      accounts[email] = account;
      writeAccounts(accounts);
    }

    setSession(email);
    setMessage('Connexion locale réussie ✅ Accès à l’application autorisé.', 'success');
    setTimeout(() => go(afterLoginView), 350);
  };

  const saveProfile = event => {
    event.preventDefault();

    const email = currentEmail();
    if (!email) {
      setMessage('Connecte-toi avant de modifier le profil.', 'error');
      go('login');
      return;
    }

    const accounts = readAccounts();
    const account = accounts[email];
    if (!account) return;

    account.profile = {
      ...(account.profile || {}),
      pseudo: $('profilePseudo')?.value?.trim() || '',
      firstname: $('profileFirstname')?.value?.trim() || '',
      city: $('profileCity')?.value?.trim() || '',
      department: $('profileDepartment')?.value || '',
      style: $('profileStyle')?.value || '',
      distance: $('profileDistance')?.value || '',
      level: $('profileLevel')?.value || '',
      bio: $('profileBio')?.value?.trim() || ''
    };
    account.updatedAt = new Date().toISOString();

    accounts[email] = account;
    writeAccounts(accounts);
    updateUI();
    setMessage('Profil sauvegardé localement ✅', 'success');
  };

  const logout = () => {
    setSession('');
    setMessage('Déconnexion locale effectuée. Connexion obligatoire pour accéder à l’application.', 'info');
    go('login');
  };

  const forgotPassword = () => {
    const email = normalizeEmail($('loginEmail')?.value);
    const accounts = readAccounts();

    if (!email) {
      setMessage('Entre ton email dans le champ connexion pour afficher l’aide de récupération locale.', 'info');
      return;
    }

    if (!accounts[email]) {
      setMessage('Aucun compte local trouvé avec cet email. En version serveur, un email de récupération pourrait être envoyé.', 'error');
      return;
    }

    setMessage('Version locale : aucun email ne peut être envoyé sans serveur. Plus tard, un backend permettra la récupération par mail.', 'info');
  };

  const oauthInfo = provider => {
    const label = provider === 'google' ? 'Google' : 'Facebook';
    setMessage(`${label} sera activable plus tard avec Firebase Auth, Supabase Auth ou un serveur sécurisé. Pour l’instant, utilise le compte local de test.`, 'info');
  };

  const bind = () => {
    $('signupForm')?.addEventListener('submit', signUp);
    $('loginForm')?.addEventListener('submit', login);
    $('profileForm')?.addEventListener('submit', saveProfile);
    $('logoutBtn')?.addEventListener('click', logout);
    $('forgotPasswordBtn')?.addEventListener('click', forgotPassword);

    document.querySelectorAll('[data-oauth]').forEach(btn => {
      btn.addEventListener('click', () => oauthInfo(btn.dataset.oauth));
    });

    document.querySelectorAll('[data-go-login], [data-account-go]').forEach(btn => {
      btn.addEventListener('click', event => {
        event.preventDefault();
        go(btn.dataset.accountGo || 'login');
      });
    });

    document.addEventListener('click', event => {
      const privateTab = event.target.closest('[data-access="private"]');
      if (privateTab && !isConnected()) {
        event.preventDefault();
        event.stopPropagation();
        go('login');
        setTimeout(() => setMessage('Connexion obligatoire : crée un compte ou connecte-toi pour accéder à l’application.', 'info'), 60);
      }
    }, true);

    window.addEventListener('hashchange', guardRoute);
    window.addEventListener('storage', () => {
      updateUI();
      guardRoute();
    });
  };

  const init = () => {
    bind();
    updateUI();

    const requestedView = String(window.location.hash || '').replace('#', '').trim();

    if (!isConnected()) {
      if (!requestedView) {
        window.location.replace(`${window.location.pathname}${window.location.search}#${guestDefaultView}`);
        return;
      }

      if (!publicViews.has(requestedView)) {
        window.location.replace(`${window.location.pathname}${window.location.search}#${guestDefaultView}`);
        return;
      }

      setTimeout(() => { guardRoute(); enforceVisibleAuthView(); }, 0);
      return;
    }

    if (!requestedView || publicViews.has(requestedView)) {
      window.location.replace(`${window.location.pathname}${window.location.search}#${afterLoginView}`);
      return;
    }

    setTimeout(() => { guardRoute(); enforceVisibleAuthView(); }, 0);
  };

  return {
    init,
    currentAccount,
    isConnected,
    requireAuth: guardRoute,
    updateUI,
    go
  };
})();

window.BreizhAuth = BreizhAuth;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', BreizhAuth.init);
} else {
  BreizhAuth.init();
}
