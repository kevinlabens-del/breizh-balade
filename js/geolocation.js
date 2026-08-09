/*
===============================================================================
BREIZH’ BALLADE — js/geolocation.js
===============================================================================

Ce fichier gère la géolocalisation.

Il sert à :
- demander la position actuelle de l’utilisateur ;
- mémoriser cette position pendant la session ;
- calculer la distance entre l’utilisateur et chaque balade ;
- formater les distances pour l’affichage.

Important :
- le navigateur demande toujours l’autorisation de l’utilisateur ;
- si l’utilisateur refuse, l’application doit continuer sans position ;
- la distance calculée est une estimation à vol d’oiseau, pas un vrai temps routier.
===============================================================================
*/
const Geo = (() => {
  const storageKey = 'breizh.userPosition.session';
  const maxAgeMs = 6 * 60 * 60 * 1000;
  let userPosition = null;

  const readSavedPosition = () => {
    try {
      const raw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved?.latitude || !saved?.longitude || !saved?.savedAt) return null;
      if (Date.now() - saved.savedAt > maxAgeMs) return null;
      return {
        latitude: Number(saved.latitude),
        longitude: Number(saved.longitude),
        accuracy: Number(saved.accuracy || 0),
        savedAt: saved.savedAt
      };
    } catch (_) {
      return null;
    }
  };

  const savePosition = position => {
    if (!position?.latitude || !position?.longitude) return;
    const payload = {
      latitude: Number(position.latitude),
      longitude: Number(position.longitude),
      accuracy: Number(position.accuracy || 0),
      savedAt: Date.now()
    };
    userPosition = payload;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (_) {}
  };

  userPosition = readSavedPosition();

  const toRad = value => value * Math.PI / 180;

  /* distanceKm : calcule la distance approximative en kilomètres entre deux points GPS. */
  const distanceKm = (a, b) => {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  /* getPosition : demande au navigateur la position GPS actuelle de l’utilisateur. */
  const getPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'));
      return;
    }

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
      error => reject(error),
      { enableHighAccuracy: true, timeout: 14000, maximumAge: 180000 }
    );
  });

  return {
    getPosition,
    getUserPosition: () => userPosition || readSavedPosition(),
    setUserPosition: pos => savePosition(pos),
    clearUserPosition: () => {
      userPosition = null;
      try {
        sessionStorage.removeItem(storageKey);
        localStorage.removeItem(storageKey);
      } catch (_) {}
    },
    distanceKm,
    formatDistance: km => {
      if (km == null || Number.isNaN(km)) return '';
      if (km < 1) return `${Math.round(km * 1000)} m`;
      return `${km.toFixed(km < 10 ? 1 : 0)} km`;
    }
  };
})();
