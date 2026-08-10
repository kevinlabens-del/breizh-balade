/*
===============================================================================
BREIZH’ BALADE — js/geolocation.js — V2.4.4
===============================================================================
La localisation reste strictement facultative tant qu’aucune fonction GPS
n’est demandée. Geo.getPosition() n’est appelé que par une action qui a besoin
de la position (Autour de moi, tri/distance, marée à l’arrivée, etc.).
===============================================================================
*/
const Geo = (() => {
  const storageKey = 'breizh.userPosition.session';
  const maxAgeMs = 6 * 60 * 60 * 1000;
  let userPosition = null;
  let consentPromise = null;

  const isFiniteCoord = value => Number.isFinite(Number(value));

  const readSavedPosition = () => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!isFiniteCoord(saved?.latitude) || !isFiniteCoord(saved?.longitude) || !saved?.savedAt) return null;
      if (Date.now() - Number(saved.savedAt) > maxAgeMs) {
        sessionStorage.removeItem(storageKey);
        return null;
      }
      return {
        latitude: Number(saved.latitude),
        longitude: Number(saved.longitude),
        accuracy: Number(saved.accuracy || 0),
        savedAt: Number(saved.savedAt)
      };
    } catch (_) {
      return null;
    }
  };

  const savePosition = position => {
    if (!isFiniteCoord(position?.latitude) || !isFiniteCoord(position?.longitude)) return;
    const payload = {
      latitude: Number(position.latitude),
      longitude: Number(position.longitude),
      accuracy: Number(position.accuracy || 0),
      savedAt: Date.now()
    };
    userPosition = payload;
    try { sessionStorage.setItem(storageKey, JSON.stringify(payload)); } catch (_) {}
  };

  userPosition = readSavedPosition();

  const toRad = value => value * Math.PI / 180;

  const distanceKm = (a, b) => {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = toRad(Number(b.latitude) - Number(a.latitude));
    const dLon = toRad(Number(b.longitude) - Number(a.longitude));
    const lat1 = toRad(Number(a.latitude));
    const lat2 = toRad(Number(b.latitude));
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  const makeGeoError = (code, message, original = null) => {
    const error = new Error(message);
    error.code = code;
    error.original = original;
    return error;
  };

  const ensureDialogStyle = () => {
    if (document.getElementById('bb-geo-dialog-style')) return;
    const style = document.createElement('style');
    style.id = 'bb-geo-dialog-style';
    style.textContent = `
      .bb-geo-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.62);backdrop-filter:blur(6px)}
      .bb-geo-card{width:min(520px,100%);border:1px solid var(--line,rgba(255,255,255,.16));border-radius:24px;background:#071b1a;color:var(--text,#f4fbf8);box-shadow:0 24px 80px rgba(0,0,0,.48);padding:20px;display:grid;gap:14px}
      .bb-geo-icon{font-size:2rem}.bb-geo-card h2{margin:0;font-size:1.35rem}.bb-geo-card p{margin:0;color:var(--muted,#b7c9c4);line-height:1.55}
      .bb-geo-actions{display:flex;gap:9px;flex-wrap:wrap}.bb-geo-actions .btn{flex:1 1 180px}
      .bb-geo-help{font-size:.82rem;color:var(--muted,#b7c9c4);line-height:1.45}
    `;
    document.head.appendChild(style);
  };

  const showConsentDialog = ({ title, text, primary = '📍 Activer la localisation', secondary = 'Continuer sans localisation', help = '' } = {}) => {
    if (consentPromise) return consentPromise;
    consentPromise = new Promise(resolve => {
      ensureDialogStyle();
      const overlay = document.createElement('div');
      overlay.className = 'bb-geo-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = `
        <div class="bb-geo-card">
          <div class="bb-geo-icon" aria-hidden="true">📍</div>
          <h2>${title || 'Localisation nécessaire'}</h2>
          <p>${text || 'Cette fonction a besoin de ta position. Breizh’ Balade ne demande la localisation que lorsque tu utilises une fonction liée au GPS.'}</p>
          ${help ? `<div class="bb-geo-help">${help}</div>` : ''}
          <div class="bb-geo-actions">
            <button class="btn btn-primary" type="button" data-geo-accept>${primary}</button>
            <button class="btn btn-ghost" type="button" data-geo-cancel>${secondary}</button>
          </div>
        </div>`;

      const finish = value => {
        overlay.remove();
        consentPromise = null;
        resolve(value);
      };

      overlay.querySelector('[data-geo-accept]').addEventListener('click', () => finish(true), { once: true });
      overlay.querySelector('[data-geo-cancel]').addEventListener('click', () => finish(false), { once: true });
      document.body.appendChild(overlay);
      overlay.querySelector('[data-geo-accept]')?.focus();
    });
    return consentPromise;
  };

  const permissionState = async () => {
    try {
      if (!navigator.permissions?.query) return 'unknown';
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status?.state || 'unknown';
    } catch (_) {
      return 'unknown';
    }
  };

  const requestBrowserPosition = (allowRetry = true) => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const current = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        savePosition(current);
        resolve(userPosition);
      },
      async error => {
        if (error?.code === 1) {
          if (!allowRetry) {
            reject(makeGeoError(1, 'Localisation refusée par l’utilisateur.', error));
            return;
          }
          const retry = await showConsentDialog({
            title: 'Autorisation de localisation refusée',
            text: 'Pour utiliser cette fonction GPS, autorise la localisation pour Breizh’ Balade dans les paramètres de ton navigateur ou de l’application.',
            primary: 'J’ai activé l’autorisation',
            secondary: 'Continuer sans localisation',
            help: 'Sur Android : paramètres du navigateur/app → Autorisations → Localisation → Autoriser pendant l’utilisation.'
          });
          if (!retry) {
            reject(makeGeoError(1, 'Localisation refusée par l’utilisateur.', error));
            return;
          }
          requestBrowserPosition(false).then(resolve).catch(reject);
          return;
        }

        if (error?.code === 2) {
          if (!allowRetry) {
            reject(makeGeoError(2, 'Localisation de l’appareil indisponible.', error));
            return;
          }
          const retry = await showConsentDialog({
            title: 'Localisation de l’appareil indisponible',
            text: 'La localisation du téléphone semble désactivée ou momentanément indisponible. Active la localisation/GPS de l’appareil pour continuer.',
            primary: 'J’ai activé le GPS',
            secondary: 'Continuer sans localisation'
          });
          if (!retry) {
            reject(makeGeoError(2, 'Localisation de l’appareil indisponible.', error));
            return;
          }
          requestBrowserPosition(false).then(resolve).catch(reject);
          return;
        }

        if (error?.code === 3) {
          reject(makeGeoError(3, 'La recherche de position a pris trop de temps. Réessaie.', error));
          return;
        }

        reject(makeGeoError(error?.code || 0, 'Impossible de récupérer la position.', error));
      },
      { enableHighAccuracy: true, timeout: 14000, maximumAge: 180000 }
    );
  });

  /*
   * Point d’entrée unique pour toutes les fonctions GPS.
   * - aucune demande au lancement de l’application ;
   * - si l’autorisation existe déjà : récupération directe ;
   * - sinon : explication claire puis demande système du navigateur ;
   * - si l’utilisateur refuse : le reste de l’application continue normalement.
   */
  const getPosition = async () => {
    if (!navigator.geolocation) {
      throw makeGeoError(0, 'La géolocalisation n’est pas disponible sur cet appareil.');
    }

    const state = await permissionState();

    if (state === 'granted') {
      return requestBrowserPosition();
    }

    if (state === 'denied') {
      const retry = await showConsentDialog({
        title: 'Autorisation de localisation nécessaire',
        text: 'Tu demandes une fonction liée au GPS. La localisation est actuellement refusée pour Breizh’ Balade.',
        primary: 'J’ai autorisé la localisation',
        secondary: 'Continuer sans localisation',
        help: 'Autorise d’abord la localisation pour ce site dans les paramètres du navigateur ou de l’application.'
      });
      if (!retry) throw makeGeoError(1, 'Localisation refusée par l’utilisateur.');
      return requestBrowserPosition();
    }

    const accepted = await showConsentDialog({
      title: 'Autoriser la localisation ?',
      text: 'Cette fonction utilise ta position. Breizh’ Balade ne demande le GPS que lorsque tu choisis une fonction liée à ta position, par exemple « Autour de moi » ou la marée prévue à ton arrivée.',
      primary: '📍 Autoriser et continuer',
      secondary: 'Continuer sans localisation'
    });

    if (!accepted) throw makeGeoError(1, 'Localisation non activée.');
    return requestBrowserPosition();
  };

  return {
    getPosition,
    ensurePosition: getPosition,
    getUserPosition: () => userPosition || readSavedPosition(),
    setUserPosition: pos => savePosition(pos),
    clearUserPosition: () => {
      userPosition = null;
      try { sessionStorage.removeItem(storageKey); } catch (_) {}
    },
    distanceKm,
    formatDistance: km => {
      if (km == null || Number.isNaN(km)) return '';
      if (km < 1) return `${Math.round(km * 1000)} m`;
      return `${km.toFixed(km < 10 ? 1 : 0)} km`;
    }
  };
})();
