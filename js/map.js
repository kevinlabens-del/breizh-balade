/*
===============================================================================
BREIZH’ BALLADE — js/map.js
===============================================================================

Ce fichier gère les cartes de l’application.

Il utilise Leaflet, une bibliothèque JavaScript de cartographie.
Il sert à :
- afficher la carte générale ;
- placer les marqueurs des balades ;
- afficher la position utilisateur si elle est connue ;
- afficher la carte dans une fiche balade ;
- recalculer la taille des cartes quand une fiche s’ouvre.

À retenir :
- Leaflet a besoin d’un conteneur visible avec une hauteur correcte ;
- quand une carte est dans une fenêtre ou un onglet, il faut parfois appeler
  invalidateSize() pour que l’affichage se recalcule correctement.
===============================================================================
*/
const BreizhMap = (() => {
  let map = null;
  let markersLayer = null;
  let userMarker = null;
  /* detailMap : petite carte affichée dans la fiche détaillée d’une balade. */
  let detailMap = null;

  const BRITTANY_CENTER = [48.05, -3.05];
  const BRITTANY_ZOOM = 7;
  const OVERVIEW_MAX_ZOOM = 8;

  /* markerIcon : crée l’icône utilisée pour les marqueurs de balades. */
  const markerIcon = () => L.divIcon({ className: '', html: '<div class="marker-pin"></div>', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
  /* userIcon : crée l’icône utilisée pour la position actuelle de l’utilisateur. */
  const userIcon = () => L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });

  const init = () => {
    if (!window.L || map) return;
    const fallback = document.getElementById('mapFallback');
    map = L.map('map', { scrollWheelZoom: true }).setView(BRITTANY_CENTER, BRITTANY_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    if (fallback) fallback.style.display = 'none';
  };

  const fitBoundsForPlaces = (places, options = {}) => {
    if (!map || !places || !places.length) {
      if (map) map.setView(BRITTANY_CENTER, BRITTANY_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(places.map(place => [place.latitude, place.longitude]));
    map.fitBounds(bounds, {
      padding: options.overview ? [48, 48] : [30, 30],
      maxZoom: options.overview ? OVERVIEW_MAX_ZOOM : 10
    });
  };

  const renderMarkers = (places, onOpen, options = {}) => {
    if (!window.L) return;
    init();
    markersLayer.clearLayers();
    const safePlaces = Array.isArray(places) ? places : [];

    safePlaces.forEach(place => {
      const marker = L.marker([place.latitude, place.longitude], { icon: markerIcon() });
      marker.bindPopup(`
        <div class="popup-card">
          <b>${place.name}</b>
          <p>${place.city} · ${place.department}</p>
          <button type="button" data-popup-place="${place.id}">Voir la fiche</button>
        </div>
      `);
      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.querySelector(`[data-popup-place="${place.id}"]`);
          if (btn) btn.onclick = () => onOpen(place.id);
        }, 0);
      });
      marker.addTo(markersLayer);
    });

    if (options.autoFit !== false) fitBoundsForPlaces(safePlaces, options);
  };

  const setUser = position => {
    if (!window.L || !position) return;
    init();
    if (userMarker) userMarker.remove();
    userMarker = L.marker([position.latitude, position.longitude], { icon: userIcon() }).addTo(map);
    userMarker.bindPopup('📍 Ta position approximative');
  };

  const fit = (places, options = {}) => {
    if (!map || !places || !places.length) return;
    const safePlaces = Array.isArray(places) ? [...places] : [];
    if (!options.overview && Geo.getUserPosition()) {
      safePlaces.push({
        latitude: Geo.getUserPosition().latitude,
        longitude: Geo.getUserPosition().longitude
      });
    }
    fitBoundsForPlaces(safePlaces, options);
  };

  /* renderDetailMap : affiche la carte locale dans la fiche d’une seule balade. */
  const renderDetailMap = place => {
    if (!window.L || !place) return;

    const build = (attempt = 0) => {
      const container = document.getElementById('detailMap');
      if (!container) {
        if (attempt < 8) setTimeout(() => build(attempt + 1), 180);
        return;
      }

      const rect = container.getBoundingClientRect();
      if ((rect.width < 80 || rect.height < 80) && attempt < 10) {
        setTimeout(() => build(attempt + 1), 180);
        return;
      }

      try {
        if (detailMap) {
          detailMap.remove();
          detailMap = null;
        }
      } catch (_) {
        detailMap = null;
      }

      container.innerHTML = '';
      container.style.height = container.style.height || '300px';
      container.style.minHeight = container.style.minHeight || '300px';

      try {
        detailMap = L.map(container, {
          zoomControl: true,
          dragging: true,
          tap: true,
          touchZoom: true,
          scrollWheelZoom: false,
          attributionControl: true
        }).setView([place.latitude, place.longitude], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }).addTo(detailMap);

        L.marker([place.latitude, place.longitude], { icon: markerIcon() })
          .addTo(detailMap)
          .bindPopup(place.name);

        const refresh = () => {
          try {
            detailMap.invalidateSize();
            detailMap.setView([place.latitude, place.longitude], 14);
          } catch (_) {}
        };

        requestAnimationFrame(refresh);
        setTimeout(refresh, 150);
        setTimeout(refresh, 450);
        setTimeout(refresh, 900);
      } catch (_) {
        container.innerHTML = '<div class="map-fallback">Carte indisponible pour le moment.</div>';
      }
    };

    setTimeout(() => build(0), 180);
  };

  /* invalidate : demande à Leaflet de recalculer la taille de la carte après un changement d’affichage. */
  const invalidate = () => {
    try { if (map) setTimeout(() => map.invalidateSize(), 120); } catch (_) {}
    try { if (detailMap) setTimeout(() => detailMap.invalidateSize(), 120); } catch (_) {}
  };

  return { init, renderMarkers, setUser, fit, renderDetailMap, invalidate };
})();
