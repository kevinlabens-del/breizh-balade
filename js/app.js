/*
===============================================================================
BREIZH’ BALLADE — js/app.js
===============================================================================

Ce fichier est le cerveau principal de l’application.

Il gère notamment :
- l’état actuel de l’application : page active, filtres, recherche, tri ;
- l’affichage de la liste des balades ;
- l’ouverture des fiches détaillées ;
- les boutons : Autour de moi, Sortie surprise, favoris, itinéraire, GPS ;
- les onglets : Explorer, Carte, Favoris, À visiter, Visité, Infos ;
- la connexion entre les données places.js et l’interface visible.

À retenir pour un codeur amateur :
- une fonction = un bloc qui fait une action précise ;
- render = afficher ou réafficher quelque chose à l’écran ;
- state = mémoire temporaire de l’application pendant l’utilisation ;
- event listener = réaction à un clic, une saisie ou un changement.
===============================================================================
*/
(() => {
  const places = [...(window.BREIZH_PLACES || [])];
  const categories = window.BREIZH_CATEGORIES || [];
  const routeTimeCache = new Map();

  const API_MAREE_CONFIG = {
    enabled: false,
    baseUrl: 'https://api-maree.fr',
    key: '',
    tz: 'Europe/Paris',
    stepMinutes: 10,
    cacheMinutes: 120
  };

  const apiMareeCache = new Map();
  const apiMareeSitesCache = { loaded: false, sites: [] };

  const tideSessionRequestKey = 'breizh.tideRequests.thisSession';
  const readTideSessionRequests = () => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(tideSessionRequestKey) || '[]'));
    } catch (_) {
      return new Set();
    }
  };
  const tideSessionRequests = readTideSessionRequests();
  const hasRequestedTideThisSession = placeId => tideSessionRequests.has(placeId);
  const markTideRequestedThisSession = placeId => {
    tideSessionRequests.add(placeId);
    try {
      sessionStorage.setItem(tideSessionRequestKey, JSON.stringify([...tideSessionRequests]));
    } catch (_) {}
  };

  const VISUAL_AUDIT = {
    "cap-frehel": [
      "falaises hautes",
      "phare côtier",
      "lande littorale"
    ],
    "fort-la-latte": [
      "château fort",
      "promontoire rocheux",
      "vue mer"
    ],
    "ploumanach-granit-rose": [
      "rochers de granit",
      "sentier côtier",
      "phare de Mean Ruz"
    ],
    "pointe-du-raz": [
      "bout du monde",
      "falaises",
      "mer agitée"
    ],
    "pointe-saint-mathieu": [
      "abbaye en ruine",
      "phare",
      "côte d’Iroise"
    ],
    "pointe-pen-hir": [
      "tas de Pois",
      "falaises",
      "vagues"
    ],
    "ile-vierge-crozon": [
      "crique encaissée",
      "pins",
      "eau claire"
    ],
    "ile-brehat": [
      "île fleurie",
      "maisons de pierre",
      "rivage calme"
    ],
    "sillon-talbert": [
      "cordon de galets",
      "mer des deux côtés",
      "ligne vers l’horizon"
    ],
    "abbaye-beauport": [
      "arches d’abbaye",
      "ruines",
      "bord de mer"
    ],
    "huelgoat": [
      "forêt dense",
      "chaos rocheux",
      "sentier mystérieux"
    ],
    "broceliande-val-sans-retour": [
      "vallée boisée",
      "lac",
      "ambiance légendaire"
    ],
    "monts-arree-brasparts": [
      "chapelle haute",
      "lande",
      "relief des Monts d’Arrée"
    ],
    "carnac-alignements": [
      "menhirs alignés",
      "lande",
      "perspective mégalithique"
    ],
    "roche-aux-fees": [
      "dolmen",
      "pierres massives",
      "entrée sombre"
    ],
    "gavrinis": [
      "cairn",
      "île du Golfe",
      "passage mégalithique"
    ],
    "chateau-suscinio": [
      "château médiéval",
      "douves",
      "marais littoral"
    ],
    "dinan-port": [
      "port ancien",
      "maisons à pans de bois",
      "rivière"
    ],
    "fougeres-chateau": [
      "grande forteresse",
      "tours rondes",
      "remparts"
    ],
    "locronan": [
      "village de pierre",
      "église",
      "rue pavée"
    ],
    "rochefort-en-terre": [
      "village fleuri",
      "maisons anciennes",
      "ruelles"
    ],
    "meneham": [
      "maison entre rochers",
      "granite",
      "littoral sauvage"
    ],
    "saint-cado": [
      "îlot",
      "chapelle",
      "pont de pierre"
    ],
    "quiberon-cote-sauvage": [
      "falaises basses",
      "vagues",
      "côte rocheuse"
    ],
    "belle-ile-port-coton": [
      "aiguilles rocheuses",
      "écume",
      "falaise maritime"
    ],
    "ile-aux-moines": [
      "chemin côtier",
      "petits bateaux",
      "pins"
    ],
    "lac-guerledan": [
      "grand lac",
      "forêt",
      "sentier en hauteur"
    ],
    "josselin-canal": [
      "château",
      "canal",
      "maisons anciennes"
    ],
    "vallee-des-saints": [
      "statues monumentales",
      "colline",
      "silhouettes de pierre"
    ],
    "pont-aven": [
      "village au bord de l’eau",
      "maisons de pierre",
      "ambiance peintres"
    ],
    "concarneau-ville-close": [
      "remparts",
      "port",
      "ville fortifiée"
    ],
    "pointe-grouin": [
      "pointe rocheuse",
      "mer ouverte",
      "oiseaux marins"
    ],
    "plougrescant-gouffre": [
      "maison entre rochers",
      "gouffre marin",
      "blocs de granite"
    ],
    "pointe-torche": [
      "dunes",
      "plage de surf",
      "pointe basse"
    ],
    "auray-saint-goustan": [
      "vieux port",
      "pont de pierre",
      "quais historiques"
    ],
    "tremelin": [
      "lac",
      "forêt",
      "chemin de loisirs"
    ]
  };
  const PLACE_TIDE_SITE = {
    'cap-frehel': { name: 'Erquy', id: 'erquy' },
    'fort-la-latte': { name: 'Saint Cast', id: 'saint-cast' },
    'ploumanach-granit-rose': { name: 'Ploumanach', id: 'ploumanach' },
    'pointe-du-raz': { name: 'Audierne', id: 'audierne' },
    'pointe-saint-mathieu': { name: 'Le Conquet', id: 'le-conquet' },
    'pointe-pen-hir': { name: 'Camaret sur Mer', id: 'camaret-sur-mer' },
    'ile-vierge-crozon': { name: 'Morgat', id: 'morgat' },
    'ile-brehat': { name: 'Les heaux de Brehat', id: 'les-heaux-de-brehat' },
    'sillon-talbert': { name: 'Treguier', id: 'treguier' },
    'abbaye-beauport': { name: 'Paimpol', id: 'paimpol' },
    'gavrinis': { name: 'Locmariaquer', id: 'locmariaquer' },
    'meneham': { name: 'Brignogan Plage', id: 'brignogan-plage' },
    'saint-cado': { name: 'Etel', id: 'etel' },
    'quiberon-cote-sauvage': { name: 'Quiberon Port Maria', id: 'quiberon-port-maria' },
    'belle-ile-port-coton': { name: 'Belle Ile Le Palais', id: 'belle-ile-le-palais' },
    'ile-aux-moines': { name: 'Arradon', id: 'arradon' },
    'concarneau-ville-close': { name: 'Concarneau', id: 'concarneau' },
    'pointe-grouin': { name: 'Cancale', id: 'cancale' },
    'plougrescant-gouffre': { name: 'Port Beni', id: 'port-beni' },
    'pointe-torche': { name: 'Penmarch Saint Guenole', id: 'penmarch-saint-guenole' },
    'auray-saint-goustan': { name: 'Auray St Goustan', id: 'auray-st-goustan' }
  };

  const FALLBACK_IMAGE = 'assets/places/coast.svg';

  const markerChips = place => (VISUAL_AUDIT[place.id] || []).map(item => `<span class="marker-chip">${escapeHTML(item)}</span>`).join('');
  const imgFallback = `onerror="this.onerror=null;this.classList.add('is-fallback-image');this.src='${FALLBACK_IMAGE}'"`;
  const normalizeImagePath = src => String(src || FALLBACK_IMAGE).replace(/^\.\//, './');

  const preloadPlaceImages = () => {
    const urls = [...new Set(places.map(place => normalizeImagePath(place.image)).filter(Boolean))];
    urls.forEach(url => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    });
  };

  const refreshVisibleImages = () => {
    document.querySelectorAll('img.place-image').forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        const src = img.getAttribute('src');
        img.removeAttribute('src');
        requestAnimationFrame(() => { img.src = src || FALLBACK_IMAGE; });
      }
    });
  };


  const els = {
    tabs: document.querySelectorAll('.tab'),
    views: document.querySelectorAll('.view'),
    search: document.getElementById('searchInput'),
    category: document.getElementById('categoryFilter'),
    department: document.getElementById('departmentFilter'),
    radius: document.getElementById('radiusFilter'),
    difficulty: document.getElementById('difficultyFilter'),
    sort: document.getElementById('sortSelect'),
    chips: document.querySelectorAll('[data-quick]'),
    moods: document.querySelectorAll('[data-mood]'),
    status: document.getElementById('statusLine'),
    placesList: document.getElementById('placesList'),
    favoritesList: document.getElementById('favoritesList'),
    laterList: document.getElementById('laterList'),
    visitedList: document.getElementById('visitedList'),
    locate: document.getElementById('locateBtn'),
    random: document.getElementById('randomBtn'),
    reset: document.getElementById('resetFiltersBtn'),
    fitMap: document.getElementById('fitMapBtn'),
    dialog: document.getElementById('placeDialog'),
    dialogContent: document.getElementById('placeDialogContent'),
    closeDialog: document.getElementById('closeDialogBtn'),
    toast: document.getElementById('toast'),
    install: document.getElementById('installBtn'),
    offline: document.getElementById('offlineBanner'),
    menuToggle: document.getElementById('menuToggle'),
    menuClose: document.getElementById('menuClose'),
    menuOverlay: document.getElementById('menuOverlay'),
    sideMenu: document.getElementById('sideMenu'),
    currentViewLabel: document.getElementById('currentViewLabel'),
    locationPrompt: document.getElementById('locationPrompt'),
    enableLocationStart: document.getElementById('enableLocationStart'),
    skipLocationStart: document.getElementById('skipLocationStart'),
    heroPlacesCount: document.getElementById('heroPlacesCount')
  };

  /* state : mémoire centrale de l’application. Elle garde la page active, les filtres, la recherche et le tri courant. */
  const state = {
    view: 'explore',
    query: '',
    category: 'all',
    department: 'all',
    radius: 'all',
    difficulty: 'all',
    sort: 'smart',
    quick: new Set(),
    mood: 'all',
    filtered: []
  };

  let deferredInstallPrompt = null;

  const debounce = (fn, wait = 160) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const getCategoryLabel = id => {
    const cat = categories.find(item => item.id === id);
    return cat ? `${cat.icon} ${cat.label}` : id;
  };

  const moodMatches = (place, mood) => {
    if (!mood || mood === 'all') return true;
    const cats = place.categories || [];
    if (mood === 'sauvage') return cats.includes('mer') || cats.includes('nature') || cats.includes('gr34') || cats.includes('ile');
    if (mood === 'famille') return place.familyFriendly || place.strollerFriendly;
    if (mood === 'patrimoine') return cats.includes('patrimoine') || cats.includes('megalithes');
    if (mood === 'photo') return place.photoSpot || cats.includes('photo');
    if (mood === 'mystere') return cats.includes('legende') || cats.includes('foret') || cats.includes('megalithes');
    if (mood === 'pluie') return cats.includes('patrimoine') || cats.includes('megalithes') || cats.includes('legende');
    return true;
  };

  const moodLabel = mood => ({
    sauvage: '🌊 Sauvage',
    famille: '👨‍👩‍👧 Famille',
    patrimoine: '🏰 Patrimoine',
    photo: '📸 Photo',
    mystere: '🧙 Mystère',
    pluie: '🌧️ Jour de pluie'
  }[mood] || '');

  /* showToast : affiche un petit message temporaire pour confirmer une action à l’utilisateur. */
  const showToast = message => {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200);
  };
  window.showToast = showToast;

  const locationPromptStorageKey = 'breizh.locationPromptDismissed';

  const showLocationPrompt = () => {
    if (!els.locationPrompt) return;
    els.locationPrompt.hidden = false;
    els.locationPrompt.classList.add('is-visible');
  };

  const hideLocationPrompt = () => {
    if (!els.locationPrompt) return;
    els.locationPrompt.classList.remove('is-visible');
    setTimeout(() => {
      if (!els.locationPrompt.classList.contains('is-visible')) els.locationPrompt.hidden = true;
    }, 180);
  };

  const checkLocationAtStartup = async () => {
    const savedStartupPosition = Geo.getUserPosition();
    if (savedStartupPosition) {
      BreizhMap.setUser(savedStartupPosition);
      renderAll();
    }

    if (!navigator.geolocation) return;

    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' });

        if (status.state === 'granted') {
          try {
            const pos = await Geo.getPosition();
            BreizhMap.setUser(pos);
            renderAll();
          } catch (_) {
            showLocationPrompt();
          }
          return;
        }

        if (status.state === 'prompt') {
          if (localStorage.getItem(locationPromptStorageKey) !== 'yes') {
            setTimeout(showLocationPrompt, 450);
          }
          return;
        }

        if (status.state === 'denied') {
          if (localStorage.getItem(locationPromptStorageKey) !== 'yes') {
            setTimeout(showLocationPrompt, 450);
          }
          return;
        }
      }

      if (localStorage.getItem(locationPromptStorageKey) !== 'yes') {
        setTimeout(showLocationPrompt, 450);
      }
    } catch (_) {
      if (localStorage.getItem(locationPromptStorageKey) !== 'yes') {
        setTimeout(showLocationPrompt, 450);
      }
    }
  };

  const viewLabels = {
    explore: 'Explorer',
    map: 'Carte',
    favorites: 'Favoris',
    later: 'À visiter',
    visited: 'Visités',
    about: 'Infos',
    login: 'Connexion',
    signup: 'Inscription',
    profile: 'Profil'
  };

  const openMenu = () => {
    if (!els.sideMenu || !els.menuOverlay || !els.menuToggle) return;
    els.sideMenu.classList.add('is-open');
    els.menuOverlay.hidden = false;
    els.menuOverlay.classList.add('is-visible');
    els.sideMenu.setAttribute('aria-hidden', 'false');
    els.menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  };

  const closeMenu = () => {
    if (!els.sideMenu || !els.menuOverlay || !els.menuToggle) return;
    els.sideMenu.classList.remove('is-open');
    els.menuOverlay.classList.remove('is-visible');
    els.sideMenu.setAttribute('aria-hidden', 'true');
    els.menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    setTimeout(() => {
      if (!els.sideMenu.classList.contains('is-open')) els.menuOverlay.hidden = true;
    }, 220);
  };

  const populateFilters = () => {
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.icon} ${cat.label}`;
      els.category.appendChild(option);
    });
    [...new Set(places.map(place => place.department))].sort().forEach(dep => {
      const option = document.createElement('option');
      option.value = dep;
      option.textContent = dep;
      els.department.appendChild(option);
    });
  };

  /* enrichPlace : ajoute des informations calculées à une balade, par exemple la distance depuis l’utilisateur. */
  const enrichPlace = place => {
    const position = Geo.getUserPosition();
    const distanceFromUser = position ? Geo.distanceKm(position, { latitude: place.latitude, longitude: place.longitude }) : null;
    return { ...place, distanceFromUser };
  };

  const matchesQuery = (place, query) => {
    if (!query) return true;
    const haystack = normalize([
      place.name,
      place.city,
      place.department,
      place.short,
      place.description,
      place.categories.join(' '),
      place.thingsToSee.join(' ')
    ].join(' '));
    return query.split(' ').filter(Boolean).every(term => haystack.includes(term));
  };

  const getFiltered = () => {
    const q = normalize(state.query.trim());
    let result = places.map(enrichPlace).filter(place => {
      if (!matchesQuery(place, q)) return false;
      if (state.category !== 'all' && !place.categories.includes(state.category)) return false;
      if (state.department !== 'all' && place.department !== state.department) return false;
      if (state.difficulty !== 'all' && place.difficulty !== state.difficulty) return false;
      if (!moodMatches(place, state.mood)) return false;
      if (state.radius !== 'all') {
        if (place.distanceFromUser == null) return false;
        if (place.distanceFromUser > Number(state.radius)) return false;
      }
      for (const quick of state.quick) {
        if (!place[quick]) return false;
      }
      return true;
    });

    if (state.sort === 'distance') {
      result.sort((a, b) => (a.distanceFromUser ?? Infinity) - (b.distanceFromUser ?? Infinity));
    } else if (state.sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    } else if (state.sort === 'difficulty') {
      const order = { facile: 1, moyen: 2, sportif: 3 };
      result.sort((a, b) => (order[a.difficulty] || 9) - (order[b.difficulty] || 9));
    } else {
      result.sort((a, b) => {
        const score = p =>
          (p.photoSpot ? 2 : 0) +
          (p.familyFriendly ? 1 : 0) +
          (p.categories.includes('gr34') ? 1 : 0) -
          (p.difficulty === 'sportif' ? .3 : 0);
        return score(b) - score(a);
      });
    }
    state.filtered = result;
    return result;
  };

  const escapeHTML = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  const cardTemplate = place => {
    const fav = Store.isFavorite(place.id);
    const later = Store.isLater(place.id);
    const visited = Store.isVisited(place.id);
    const distance = place.distanceFromUser != null ? Geo.formatDistance(place.distanceFromUser) : 'GPS off';
    const badges = place.categories.slice(0, 2).map(cat => `<span class="badge">${escapeHTML(getCategoryLabel(cat))}</span>`).join('');
    const pills = pillList(practicalPills(place).slice(0, 3), 'card-pill');
    const tide = tideInfo(place);
    const tideMini = tideMiniTemplate(tide);
    return `
      <article class="place-card place-card--premium" data-place-id="${place.id}">
        <div class="card-art">
          <img class="place-image" src="${escapeHTML(normalizeImagePath(place.image))}" alt="Croquis noir et blanc de ${escapeHTML(place.name)}" loading="lazy" decoding="async" fetchpriority="low" ${imgFallback} />
          <div class="badge-row">${badges}</div>
          <div class="card-distance-chip">${distance}</div>
        </div>
        <div class="place-card__body">
          <div class="card-heading">
            <h3>${escapeHTML(place.name)}</h3>
          </div>
          <div class="meta meta--premium">
            <span>📍 ${escapeHTML(place.city)}</span>
            <span>${escapeHTML(place.department)}</span>
          </div>
          <div class="card-kpis" aria-label="Infos rapides">
            <span><b>${escapeHTML(place.duration)}</b><small>durée</small></span>
            <span><b>${escapeHTML(place.distanceKm)}</b><small>marche</small></span>
            <span class="difficulty-kpi"><b><span class="difficulty-inline-dot">${difficultyIcon(place.difficulty)}</span> ${escapeHTML(place.difficulty)}</b><small>niveau</small></span>
          </div>
          ${tideMini}
          <p>${escapeHTML(place.short)}</p>
          <div class="card-pills">${pills}</div>
          <div class="card-actions card-actions--premium">
            <button class="mini-action primary" data-open="${place.id}" type="button">Voir la fiche</button>
            <button class="icon-btn ${fav ? 'is-on' : ''}" data-fav="${place.id}" type="button" title="Favori">${fav ? '❤️' : '🤍'}</button>
            <button class="icon-btn ${later ? 'is-on' : ''}" data-later="${place.id}" type="button" title="À visiter">${later ? '📌' : '📍'}</button>
            <button class="icon-btn ${visited ? 'is-on' : ''}" data-visited="${place.id}" type="button" title="Visité">${visited ? '✅' : '☑️'}</button>
          </div>
        </div>
      </article>`;
  };

  const renderList = (container, list, emptyText) => {
    if (!list.length) {
      container.innerHTML = `<div class="empty-state">${emptyText}</div>`;
      return;
    }
    container.innerHTML = list.map(cardTemplate).join('');
  };

  const updateStatus = filtered => {
    const gps = Geo.getUserPosition() ? ' · distances calculées depuis ta position' : '';
    const quick = state.quick.size ? ` · ${state.quick.size} filtre(s) rapide(s)` : '';
    const mood = state.mood !== 'all' ? ` · ambiance ${moodLabel(state.mood)}` : '';
    els.status.textContent = `${filtered.length} lieu(x) trouvé(s) sur ${places.length}${gps}${quick}${mood}`;
  };

  const getMapOverviewPlaces = () => places.map(enrichPlace);


  /* sortPlacesByCurrentDistance : classe les balades de la plus proche à la plus éloignée quand la position est connue. */
  const sortPlacesByCurrentDistance = places => {
    const userPosition = Geo.getUserPosition();
    if (!userPosition) return places;

    return [...places].sort((a, b) => {
      const da = Geo.distanceKm(userPosition, a);
      const db = Geo.distanceKm(userPosition, b);

      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;

      return da - db;
    });
  };

  /* renderAll : fonction de rafraîchissement général. Elle réaffiche les parties importantes après une action. */
  const renderAll = () => {
    const filtered = getFiltered();
    renderList(els.placesList, filtered, 'Aucun lieu ne correspond à ces filtres pour le moment.');
    renderCollection('favorites', els.favoritesList, 'Aucun favori pour l’instant. Ajoute un cœur sur une fiche pour la retrouver ici.');
    renderCollection('later', els.laterList, 'Aucun lieu dans “à visiter plus tard”. Épingle une balade pour préparer ta prochaine sortie.');
    renderCollection('visited', els.visitedList, 'Aucun lieu marqué comme visité pour le moment.');
    updateStatus(filtered);
    if (state.view === 'map') {
      BreizhMap.renderMarkers(getMapOverviewPlaces(), openPlace, { overview: true });
    }
    bindDynamicButtons();
  };

  const renderCollection = (key, container, emptyText) => {
    const ids = Store.read(key, []);
    const list = ids.map(id => places.find(place => place.id === id)).filter(Boolean).map(enrichPlace);
    renderList(container, list, emptyText);
  };

  const setView = view => {
    // Connexion obligatoire avant setView — V2.3.0
    const publicViews = ['explore', 'map', 'about', 'login', 'signup'];
    if (window.BreizhAuth && !window.BreizhAuth.isConnected() && !publicViews.includes(view)) {
      window.BreizhAuth.go('login');
      return;
    }
    state.view = view;
    if (els.currentViewLabel) els.currentViewLabel.textContent = viewLabels[view] || 'Menu';
    els.tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.view === view));
    els.views.forEach(section => section.classList.toggle('is-visible', section.id === `view-${view}`));
    closeMenu();
    if (view === 'map') {
      BreizhMap.init();
      BreizhMap.invalidate();
      setTimeout(() => {
        BreizhMap.renderMarkers(getMapOverviewPlaces(), openPlace, { overview: true });
      }, 140);
    }
    window.location.hash = view;
  };

  const googleMapsUrl = place => `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  const shareText = place => `${place.name} — ${place.city}, ${place.department}. À voir avec Breizh’ Balade.`;


  const practicalPills = place => [
    place.familyFriendly ? '👨‍👩‍👧 Famille' : null,
    place.dogFriendly ? '🐾 Chien OK' : null,
    place.strollerFriendly ? '♿ Accès facile' : null,
    place.parking ? '🅿️ Parking' : null,
    place.photoSpot ? '📸 Spot photo' : null,
    isSeaPlace(place) ? '🌊 Marée' : null
  ].filter(Boolean);

  const pillList = (items, className = 'premium-pill') => items
    .filter(Boolean)
    .map(item => `<span class="${className}">${escapeHTML(item)}</span>`)
    .join('');

  const difficultyIcon = difficulty => ({ facile: '🟢', moyen: '🟠', sportif: '🔴' }[difficulty] || '⚪');

  const routeLabel = place => {
    const kind = place.walkType || 'Balade';
    return kind.length > 42 ? `${kind.slice(0, 39)}…` : kind;
  };

  const isSeaPlace = place => {
    const cats = place.categories || [];
    return Boolean(place.tideWatch || cats.includes('mer') || cats.includes('gr34') || cats.includes('ile'));
  };

  const tideInfo = (place, atDate = new Date()) => {
    if (!isSeaPlace(place)) return null;

    // V2.3.0 statique : estimation indicative calculée à partir de l'heure réelle du téléphone.
    // Sur hébergeur, elle se recalcule à chaque ouverture/actualisation, mais ce n'est pas une donnée officielle.
    // Pour une V2 dynamique, remplacer ce calcul par une API marées officielle.
    const now = atDate instanceof Date ? atDate : new Date(atDate);
    const cycleMinutes = 12 * 60 + 25; // cycle moyen haute/basse
    const cycleMs = cycleMinutes * 60 * 1000;
    const refHighTide = Date.UTC(2026, 0, 1, 5, 24, 0);
    const placeOffsetMin = Math.round(((place.longitude || -3) + 3) * 24);
    let phase = ((now.getTime() - refHighTide - placeOffsetMin * 60 * 1000) / cycleMs) % 1;
    if (phase < 0) phase += 1;

    const falling = phase < 0.5;
    const level = phase < 0.25 || phase > 0.75 ? 'haute' : 'basse';
    const trend = falling ? 'descendante' : 'montante';
    const arrow = falling ? '↘' : '↗';

    const days = (now.getTime() - refHighTide) / 86400000;
    const rawCoeff = 70 + 35 * Math.cos((2 * Math.PI * days) / 14.765);
    const coefficient = Math.max(35, Math.min(110, Math.round(rawCoeff)));

    return {
      level,
      label: `Marée ${level}`,
      coefficient,
      trend,
      arrow,
      updatedAt: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime()
    };
  };

  const apiMareeKeyReady = () => {
    const key = API_MAREE_CONFIG.key || '';
    return API_MAREE_CONFIG.enabled && key && key !== 'VOTRE_CLE_API_MAREE_ICI';
  };

  const formatApiDate = date => {
    const d = date instanceof Date ? date : new Date(date);
    const parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: API_MAREE_CONFIG.tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(d).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };

  const normalizeSiteName = value => normalize(value).replace(/[^a-z0-9]+/g, ' ').trim();

  const fetchApiMareeSites = async () => {
    if (apiMareeSitesCache.loaded) return apiMareeSitesCache.sites;
    try {
      const response = await fetch(`${API_MAREE_CONFIG.baseUrl}/sites`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Liste des sites indisponible');
      const data = await response.json();
      const sites = Array.isArray(data) ? data : (Array.isArray(data.sites) ? data.sites : []);
      apiMareeSitesCache.sites = sites;
      apiMareeSitesCache.loaded = true;
      return sites;
    } catch (_) {
      apiMareeSitesCache.loaded = true;
      apiMareeSitesCache.sites = [];
      return [];
    }
  };

  const resolveApiMareeSite = async place => {
    const preferred = PLACE_TIDE_SITE[place.id];
    const sites = await fetchApiMareeSites();

    const normalizeSiteId = value => normalize(String(value || '')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const readSiteId = site => site.id || site.site_id || site.slug || site.code || site.name;
    const readSiteName = site => site.name || site.label || site.site_name || readSiteId(site);
    const readLat = site => Number(site.latitude ?? site.lat);
    const readLng = site => Number(site.longitude ?? site.lng ?? site.lon);

    if (preferred) {
      const preferredName = normalizeSiteName(preferred.name);
      const preferredId = normalizeSiteId(preferred.id);
      const match = sites.find(site => {
        const apiId = normalizeSiteId(readSiteId(site));
        const apiName = normalizeSiteName(readSiteName(site));
        return apiId === preferredId ||
          apiName === preferredName ||
          apiName.includes(preferredName) ||
          preferredName.includes(apiName);
      });

      if (match) {
        return {
          id: readSiteId(match),
          name: readSiteName(match),
          latitude: readLat(match),
          longitude: readLng(match)
        };
      }

      return preferred;
    }

    if (!sites.length || place.latitude == null || place.longitude == null) return null;

    let best = null;
    let bestDistance = Infinity;

    sites.forEach(site => {
      const lat = readLat(site);
      const lng = readLng(site);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      const distance = Geo.distanceKm(
        { latitude: place.latitude, longitude: place.longitude },
        { latitude: lat, longitude: lng }
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = site;
      }
    });

    return best ? {
      id: readSiteId(best),
      name: readSiteName(best),
      latitude: readLat(best),
      longitude: readLng(best)
    } : null;
  };

  const tideCacheKey = (siteId, date) => {
    const rounded = Math.floor(date.getTime() / (30 * 60 * 1000));
    return `${siteId}|${rounded}`;
  };

  const readTideCache = key => {
    const memory = apiMareeCache.get(key);
    if (memory && Date.now() - memory.savedAt < API_MAREE_CONFIG.cacheMinutes * 60000) return memory.value;

    try {
      const raw = localStorage.getItem(`breizh.apiMaree.${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.savedAt > API_MAREE_CONFIG.cacheMinutes * 60000) return null;
      apiMareeCache.set(key, parsed);
      return parsed.value;
    } catch (_) {
      return null;
    }
  };

  const writeTideCache = (key, value) => {
    const payload = { savedAt: Date.now(), value };
    apiMareeCache.set(key, payload);
    try { localStorage.setItem(`breizh.apiMaree.${key}`, JSON.stringify(payload)); } catch (_) {}
  };

  const localCoeffEstimate = date => {
    const refHighTide = Date.UTC(2026, 0, 1, 5, 24, 0);
    const days = (date.getTime() - refHighTide) / 86400000;
    const rawCoeff = 70 + 35 * Math.cos((2 * Math.PI * days) / 14.765);
    return Math.max(35, Math.min(110, Math.round(rawCoeff)));
  };

  const analyzeApiMareeLevels = (place, site, targetDate, levels) => {
    if (!Array.isArray(levels) || levels.length < 3) throw new Error('Données marée insuffisantes');

    const points = levels
      .map(item => {
        const timeValue = item.time || item.datetime || item.date || item.t;
        const heightValue = item.height ?? item.water_level ?? item.level ?? item.value ?? item.h;
        return { time: new Date(timeValue), height: Number(heightValue) };
      })
      .filter(item => !Number.isNaN(item.time.getTime()) && !Number.isNaN(item.height))
      .sort((a, b) => a.time - b.time);

    if (points.length < 3) throw new Error('Données marée invalides');

    let closestIndex = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(points[i].time - targetDate) < Math.abs(points[closestIndex].time - targetDate)) closestIndex = i;
    }

    const prev = points[Math.max(0, closestIndex - 1)];
    const current = points[closestIndex];
    const next = points[Math.min(points.length - 1, closestIndex + 1)];
    const minHeight = Math.min(...points.map(item => item.height));
    const maxHeight = Math.max(...points.map(item => item.height));
    const middle = minHeight + (maxHeight - minHeight) / 2;
    const rising = next.height >= prev.height;
    const level = current.height >= middle ? 'haute' : 'basse';

    return {
      source: 'api-maree.fr',
      siteId: site.id || site.site_id,
      siteName: site.name || site.id,
      level,
      label: `Marée ${level}`,
      height: current.height,
      coefficient: localCoeffEstimate(targetDate),
      trend: rising ? 'montante' : 'descendante',
      arrow: rising ? '↗' : '↘',
      updatedAt: targetDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: targetDate.getTime(),
      apiReady: true
    };
  };

  const apiMareeInfo = async (place, atDate = new Date()) => {
    try {
      if (!isSeaPlace(place)) return null;
      if (!apiMareeKeyReady()) return { status: 'missing-key' };

      const site = await resolveApiMareeSite(place);
      if (!site?.id && !site?.site_id) return { status: 'no-site' };

      const siteId = site.id || site.site_id;
      const targetDate = atDate instanceof Date ? atDate : new Date(atDate);
      const key = tideCacheKey(siteId, targetDate);
      const cached = readTideCache(key);
      if (cached) return cached;

      const from = new Date(targetDate.getTime() - 6 * 60 * 60 * 1000);
      const to = new Date(targetDate.getTime() + 6 * 60 * 60 * 1000);
      const params = new URLSearchParams({
        site: siteId,
        from: formatApiDate(from),
        to: formatApiDate(to),
        step: String(API_MAREE_CONFIG.stepMinutes),
        tz: API_MAREE_CONFIG.tz,
        key: API_MAREE_CONFIG.key
      });

      const response = await fetch(`${API_MAREE_CONFIG.baseUrl}/water-levels?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('API marée indisponible');

      const data = await response.json();
      const levels = Array.isArray(data)
        ? data
        : (Array.isArray(data.data)
          ? data.data
          : (Array.isArray(data.levels)
            ? data.levels
            : (Array.isArray(data.waterLevels) ? data.waterLevels : [])));

      const result = analyzeApiMareeLevels(place, site, targetDate, levels);
      writeTideCache(key, result);
      return result;
    } catch (_) {
      return { status: 'error' };
    }
  };

  const tideStateTemplate = tide => {
    if (!tide || tide.status === 'missing-key') {
      return `<div class="api-maree-status">🔑 Clé API marée absente ou non reconnue.</div>`;
    }
    if (tide.status === 'loading') {
      return `<div class="api-maree-status">🌊 Chargement des marées…</div>`;
    }
    if (tide.status === 'no-site') {
      return `<div class="api-maree-status">⚠️ Aucun port de marée associé à cette balade.</div>`;
    }
    if (tide.status === 'error') {
      return `<div class="api-maree-status">⚠️ Données marées indisponibles pour le moment.</div>`;
    }
    if (!tide.label) return '';
    const height = tide.height != null ? `<span><b>${escapeHTML(tide.height.toFixed(2))} m</b><small>hauteur</small></span>` : '';
    return `
      <div class="arrival-tide-result ${tide.source === 'api-maree.fr' ? 'arrival-tide-result--api' : ''}">
        <span><b>${escapeHTML(tide.label)}</b><small>${escapeHTML(tide.updatedAt || '')}</small></span>
        ${height}
        <span><b>Coeff. ≈ ${escapeHTML(tide.coefficient)}</b><small>coefficient</small></span>
        <span><b>${escapeHTML(tide.arrow)} ${escapeHTML(tide.trend)}</b><small>tendance</small></span>
      </div>
    `;
  };

  const formatMinutes = minutes => {
    if (minutes == null || Number.isNaN(minutes)) return 'temps inconnu';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  };

  const routeCacheKey = place => {
    const position = Geo.getUserPosition();
    if (!position) return null;
    return [
      place.id,
      position.latitude.toFixed(3),
      position.longitude.toFixed(3)
    ].join('|');
  };

  const getRouteMinutes = async place => {
    const position = Geo.getUserPosition();
    if (!position) return { status: 'no-position', minutes: null };

    const key = routeCacheKey(place);
    if (key && routeTimeCache.has(key)) return routeTimeCache.get(key);

    const url = `https://router.project-osrm.org/route/v1/driving/${position.longitude},${position.latitude};${place.longitude},${place.latitude}?overview=false&alternatives=false&steps=false`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();

      if (!response.ok || data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('Route indisponible');
      }

      const minutes = Math.max(1, Math.round(data.routes[0].duration / 60));
      const result = { status: 'ok', minutes, source: 'route' };
      if (key) routeTimeCache.set(key, result);
      return result;
    } catch (_) {
      return { status: 'unavailable', minutes: null };
    } finally {
      clearTimeout(timer);
    }
  };

  const arrivalTideSummary = (place, routeResult) => {
    if (!routeResult || routeResult.status === 'loading') {
      return `
        <div class="arrival-tide-result arrival-tide-result--pending">
          <span><b>Calcul en cours…</b><small>temps de route réel</small></span>
        </div>
      `;
    }

    if (routeResult.status === 'no-position') {
      return `
        <div class="arrival-tide-result arrival-tide-result--pending">
          <span><b>Localisation nécessaire</b><small>active ta position, puis relance la demande de marées si besoin</small></span>
        </div>
      `;
    }

    if (routeResult.status === 'unavailable' || routeResult.minutes == null) {
      return `
        <div class="arrival-tide-result arrival-tide-result--pending">
          <span><b>Temps de route indisponible</b><small>connexion ou service de routage indisponible</small></span>
        </div>
      `;
    }

    const safeMinutes = Math.max(0, Math.min(1440, Number(routeResult.minutes) || 0));
    const arrivalDate = new Date(Date.now() + safeMinutes * 60 * 1000);
    const tide = routeResult.tide || tideInfo(place, arrivalDate);
    if (!tide) return '';

    return `
      ${tideStateTemplate(tide)}
      <p class="route-time-used">🚗 Temps de route calculé automatiquement : <b>${escapeHTML(formatMinutes(safeMinutes))}</b></p>
    `;
  };

  const tideMiniTemplate = tide => tide ? `
    <div class="tide-strip" title="Marée indicative hors-ligne à vérifier avant sortie">
      <span>🌊 ${escapeHTML(tide.label)}</span>
      <span>Coeff. ≈ ${escapeHTML(tide.coefficient)}</span>
      <span>${escapeHTML(tide.arrow)} ${escapeHTML(tide.trend)}</span>
    </div>
  ` : '';

  const tideSessionLockedTemplate = place => `
    <div class="tide-session-lock">
      <strong>🔒 Marées déjà demandées pour cette balade</strong>
      <span>Cette fiche peut refaire une demande après fermeture puis réouverture de l’application.</span>
    </div>
  `;

  const tideDetailTemplate = (place, tide) => {
    if (!tide) return '';
    return `
      <section class="detail-panel tide-panel">
        <div class="panel-title-row"><span>🌊</span><h3>Marées</h3></div>
        <div class="tide-demand-box tide-demand-box--clean">
          ${hasRequestedTideThisSession(place.id)
            ? `<button class="btn btn-ghost tide-load-btn" type="button" disabled>🔒 Déjà demandé pendant cette session</button>`
            : `<button class="btn btn-primary tide-load-btn" data-load-tides="${place.id}" type="button">🌊 Estimer les marées</button>`}
          <small>${hasRequestedTideThisSession(place.id)
            ? 'Ferme puis relance l’application pour refaire une demande sur cette balade.'
            : 'Affiche la marée maintenant et l’estimation à ton arrivée.'}</small>
        </div>

        <div class="tide-results-grid" data-tide-results="${place.id}" ${hasRequestedTideThisSession(place.id) ? '' : 'hidden'}>
          <div class="tide-result-block">
            <div class="panel-title-row panel-title-row--mini"><span>🌊</span><h4>Marée maintenant</h4></div>
            <div data-live-tide="${place.id}">${hasRequestedTideThisSession(place.id) ? tideSessionLockedTemplate(place) : ''}</div>
          </div>
          <div class="tide-result-block">
            <div class="panel-title-row panel-title-row--mini"><span>🚗</span><h4>Marée à ton arrivée estimée</h4></div>
            <div data-route-tide="${place.id}">${hasRequestedTideThisSession(place.id) ? tideSessionLockedTemplate(place) : ''}</div>
          </div>
        </div>

        <details class="local-tide-details">
          <summary>Voir l’estimation locale de secours</summary>
          <div class="tide-detail-grid">
            <div><b>${escapeHTML(tide.label)}</b><span>État estimé</span></div>
            <div><b>Coeff. ≈ ${escapeHTML(tide.coefficient)}</b><span>Coefficient</span></div>
            <div><b>${escapeHTML(tide.arrow)} ${escapeHTML(tide.trend)}</b><span>Tendance</span></div>
          </div>
        </details>
      </section>
    `;
  };

  const updateLiveTide = async place => {
    if (!place || !isSeaPlace(place)) return;
    const box = document.querySelector(`[data-live-tide="${place.id}"]`);
    if (!box) return;
    box.innerHTML = tideStateTemplate(tideInfo(place, new Date()));
  };

  const ensureLocationForTides = async () => {
    if (Geo.getUserPosition()) return true;

    if (!navigator.geolocation) {
      showToast('Localisation indisponible sur cet appareil');
      return false;
    }

    try {
      showToast('Activation de ta position pour la marée à l’arrivée…');
      const pos = await Geo.getPosition();
      BreizhMap.setUser(pos);
      showToast('Position activée pour la marée à l’arrivée 📍');
      return true;
    } catch (_) {
      showToast('Localisation non activée : marée à l’arrivée impossible');
      return false;
    }
  };

  const updateArrivalTide = async place => {
    if (!place || !isSeaPlace(place)) return;
    const box = document.querySelector(`[data-route-tide="${place.id}"]`);
    if (!box) return;

    if (!Geo.getUserPosition()) {
      const located = await ensureLocationForTides();
      if (!located || !Geo.getUserPosition()) {
        box.innerHTML = arrivalTideSummary(place, { status: 'no-position' });
        return;
      }
    }

    box.innerHTML = arrivalTideSummary(place, { status: 'loading' });
    const routeResult = await getRouteMinutes(place);
    if (routeResult.status === 'ok' && routeResult.minutes != null) {
      const arrivalDate = new Date(Date.now() + routeResult.minutes * 60 * 1000);
      routeResult.tide = tideInfo(place, arrivalDate);
    }
    box.innerHTML = arrivalTideSummary(place, routeResult);
  };


  const smartProfile = place => {
    const cats = place.categories || [];
    const ideal = [];
    const avoid = [];
    let bestMoment = 'Une journée claire avec assez de temps pour profiter sans courir.';
    let creatixTip = 'Pars léger, garde de la batterie, et laisse-toi au moins 20 minutes pour juste regarder le lieu.';

    if (place.familyFriendly) ideal.push('Sortie famille');
    if (place.photoSpot || cats.includes('photo')) ideal.push('Spot photo');
    if (place.dogFriendly) ideal.push('Balade avec chien');
    if (cats.includes('mer') || cats.includes('gr34')) ideal.push('Air marin');
    if (cats.includes('patrimoine')) ideal.push('Patrimoine breton');
    if (cats.includes('megalithes') || cats.includes('legende')) ideal.push('Ambiance mystérieuse');
    if (cats.includes('foret') || cats.includes('nature')) ideal.push('Déconnexion nature');

    if (place.tideWatch) avoid.push('sans vérifier l’état de la marée maintenant et à l’arrivée');
    if (!place.strollerFriendly) avoid.push('avec poussette si le terrain est irrégulier');
    if (place.difficulty === 'sportif') avoid.push('si tu veux une sortie très tranquille');
    if ((place.warnings || []).some(w => normalize(w).includes('falaise') || normalize(w).includes('vent'))) avoid.push('par vent violent ou en restant trop près des falaises');

    if (cats.includes('mer') || cats.includes('gr34')) {
      bestMoment = 'Fin de journée ou matin clair : la lumière sur la mer et les falaises fait vraiment la différence.';
      creatixTip = 'Regarde la météo et le vent avant de partir : sur la côte bretonne, ça change toute l’ambiance.';
    }
    if (cats.includes('foret') || cats.includes('legende')) {
      bestMoment = 'Matin calme ou temps légèrement couvert : parfait pour une ambiance forêt/légende.';
      creatixTip = 'Prends ton temps dans les petits chemins : les meilleurs détails sont rarement au premier regard.';
    }
    if (cats.includes('patrimoine') || cats.includes('megalithes')) {
      bestMoment = 'Fin de matinée ou après-midi douce, avec assez de lumière pour lire les détails des pierres et bâtiments.';
      creatixTip = 'Avant d’y aller, garde la fiche en favori : beaucoup de lieux historiques gagnent à être combinés avec un village ou un port proche.';
    }
    if (cats.includes('ile')) {
      bestMoment = 'Départ tôt, avec horaires de bateau ou marées vérifiés avant de bouger.';
      creatixTip = 'Prévois marge, eau et batterie : sur une île, le timing fait toute la sortie.';
    }

    return {
      ideal: [...new Set(ideal)].slice(0, 5),
      bestMoment,
      avoid: [...new Set(avoid)].slice(0, 4),
      creatixTip
    };
  };

  const nearbyPlaces = place => places
    .filter(item => item.id !== place.id)
    .map(item => ({
      ...item,
      nearDistance: Geo.distanceKm(
        { latitude: place.latitude, longitude: place.longitude },
        { latitude: item.latitude, longitude: item.longitude }
      )
    }))
    .sort((a, b) => a.nearDistance - b.nearDistance)
    .slice(0, 3);

  const smartList = (items, emptyText = 'À compléter') => {
    const safeItems = items?.length ? items : [emptyText];
    return `<ul class="premium-list smart-list">${safeItems.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
  };

  const aroundCards = place => nearbyPlaces(place).map(item => `
    <button class="around-card" data-open="${item.id}" type="button">
      <strong>${escapeHTML(item.name)}</strong>
      <span>${escapeHTML(item.city)} · ${Geo.formatDistance(item.nearDistance)}</span>
    </button>
  `).join('');

  const openPlace = id => {
    const place = places.find(item => item.id === id);
    if (!place) return;
    const enriched = enrichPlace(place);
    const fav = Store.isFavorite(id);
    const later = Store.isLater(id);
    const visited = Store.isVisited(id);
    const note = Store.getNote(id);
    const distance = enriched.distanceFromUser != null ? Geo.formatDistance(enriched.distanceFromUser) : 'Active la localisation';
    const tags = place.categories.map(cat => `<span class="badge">${escapeHTML(getCategoryLabel(cat))}</span>`).join('');
    const pills = pillList(practicalPills(place), 'premium-pill');
    const warnings = place.warnings?.length ? place.warnings : [];
    const smart = smartProfile(place);
    const tide = tideInfo(place);
    const tidePanel = tideDetailTemplate(place, tide);
    els.dialogContent.innerHTML = `
      <div class="dialog-hero dialog-hero--premium">
        <img class="dialog-hero__img" src="${escapeHTML(normalizeImagePath(place.image))}" alt="Croquis noir et blanc de ${escapeHTML(place.name)}" decoding="async" ${imgFallback} />
        <div class="dialog-title dialog-title--premium">
          <div class="dialog-tags">${tags}</div>
          <h2>${escapeHTML(place.name)}</h2>
          <p>📍 ${escapeHTML(place.city)} · ${escapeHTML(place.department)}</p>
          <div class="dialog-metrics" aria-label="Résumé balade">
            <span><b>${escapeHTML(place.distanceKm)}</b><small>Distance possible</small></span>
            <span><b>${escapeHTML(place.duration)}</b><small>Durée estimée</small></span>
            <span><b>${difficultyIcon(place.difficulty)} ${escapeHTML(place.difficulty)}</b><small>Difficulté</small></span>
          </div>
        </div>
      </div>
      <div class="dialog-body dialog-body--premium">
        <div class="detail-main">
          <section class="detail-panel detail-panel--story">
            <div class="panel-title-row"><span>🌿</span><h3>Pourquoi y aller ?</h3></div>
            <p>${escapeHTML(place.description)}</p>
            <div class="visual-audit-box visual-audit-box--premium">
              <strong>✒️ Repères visuels du croquis</strong>
              <div class="marker-row">${markerChips(place)}</div>
            </div>
          </section>

          ${tidePanel}

          <section class="detail-panel detail-panel--split">
            <div>
              <div class="panel-title-row"><span>👀</span><h3>À voir sur place</h3></div>
              <ul class="premium-list">${place.thingsToSee.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
            </div>
            <div>
              <div class="panel-title-row"><span>🎒</span><h3>Conseils pratiques</h3></div>
              <ul class="premium-list">${place.tips.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
            </div>
          </section>

          ${warnings.length ? `<section class="detail-panel detail-panel--warning"><div class="panel-title-row"><span>⚠️</span><h3>À surveiller</h3></div><ul class="premium-list">${warnings.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul></section>` : ''}

          <section class="detail-panel smart-panel">
            <div class="panel-title-row"><span>✨</span><h3>Conseils intelligents</h3></div>
            <div class="smart-grid">
              <div class="smart-card">
                <b>Idéal pour</b>
                <div class="marker-row">${smart.ideal.map(item => `<span class="marker-chip">${escapeHTML(item)}</span>`).join('')}</div>
              </div>
              <div class="smart-card">
                <b>Meilleur moment</b>
                <p>${escapeHTML(smart.bestMoment)}</p>
              </div>
              <div class="smart-card">
                <b>À éviter si…</b>
                ${smartList(smart.avoid, 'rien de spécial, juste prévoir météo et chaussures adaptées')}
              </div>
              <div class="smart-card smart-card--accent">
                <b>Conseil CR3@TIX</b>
                <p>${escapeHTML(smart.creatixTip)}</p>
              </div>
            </div>
          </section>

          <section class="detail-panel around-panel">
            <div class="panel-title-row"><span>🧭</span><h3>À voir autour</h3></div>
            <div class="around-grid">${aroundCards(place)}</div>
          </section>
        </div>

        <aside class="detail-side">
          <section class="detail-panel detail-panel--route">
            <a class="route-cta" href="${googleMapsUrl(place)}" target="_blank" rel="noopener">
              <span>🧭</span>
              <strong>Ouvrir l’itinéraire</strong>
              <small>Google Maps depuis ta position</small>
            </a>
            <div class="pill-grid">${pills}</div>
            <div class="info-grid info-grid--premium">
              <div class="info-tile"><b>${distance}</b><span>Depuis toi</span></div>
              <div class="info-tile"><b>${escapeHTML(routeLabel(place))}</b><span>Type de balade</span></div>
              <div class="info-tile"><b>${place.parking ? 'Oui' : 'À vérifier'}</b><span>Parking</span></div>
              <div class="info-tile"><b>${place.tideWatch ? 'Oui' : 'Non'}</b><span>Marée</span></div>
            </div>
            <div class="dialog-actions dialog-actions--compact">
              <button class="mini-action ${fav ? 'is-on' : ''}" data-fav="${place.id}" type="button">${fav ? '❤️ Favori' : '🤍 Favori'}</button>
              <button class="mini-action ${later ? 'is-on' : ''}" data-later="${place.id}" type="button">${later ? '📌 À visiter' : '📍 À visiter'}</button>
              <button class="mini-action ${visited ? 'is-on' : ''}" data-visited="${place.id}" type="button">${visited ? '✅ Visité' : '☑️ Visité'}</button>
              <button class="mini-action gps-copy-btn" data-coords="${place.id}" type="button" title="Copier les coordonnées GPS du lieu">📍 Copier GPS</button>
              <button class="mini-action" data-share="${place.id}" type="button">📤 Partager</button>
            </div>
          </section>

          <section class="detail-panel detail-panel--map">
            <div class="panel-title-row"><span>🗺️</span><h3>Carte du lieu</h3></div>
            <div class="detail-map" id="detailMap"></div>
          </section>

          <section class="detail-panel">
            <div class="panel-title-row"><span>📝</span><h3>Note perso</h3></div>
            <textarea class="note-box" data-note="${place.id}" placeholder="Ex : y aller au coucher du soleil, prévoir pique-nique…">${escapeHTML(note)}</textarea>
          </section>
        </aside>
      </div>`;
    if (!els.dialog.open) els.dialog.showModal();
    resetDialogScroll();
    lockDialogHorizontalScroll();
    BreizhMap.renderDetailMap(place);
    setTimeout(() => BreizhMap.invalidate?.(), 700);
    bindDynamicButtons();
  };


  const resetDialogScroll = () => {
    try {
      const dialog = document.querySelector('.place-dialog');
      const body = document.querySelector('.dialog-body, .dialog-scroll, .place-dialog__scroll');
      if (dialog) dialog.scrollTop = 0;
      if (body) body.scrollTop = 0;
    } catch (_) {}
  };

  const requirePersonalAccount = () => {
    if (window.BreizhAuth?.isConnected?.()) return true;
    showToast('Connecte-toi pour enregistrer tes favoris, notes et listes personnelles.');
    window.BreizhAuth?.go?.('login');
    return false;
  };

  /* bindDynamicButtons : relie les boutons créés dynamiquement après le rendu, par exemple dans les cartes ou fiches. */
  const bindDynamicButtons = () => {
    document.querySelectorAll('[data-open]').forEach(btn => btn.onclick = () => openPlace(btn.dataset.open));
    document.querySelectorAll('[data-fav]').forEach(btn => btn.onclick = () => {
      if (!requirePersonalAccount()) return;
      const isOn = Store.toggleFavorite(btn.dataset.fav);
      showToast(isOn ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris');
      renderAll();
      if (els.dialog.open) openPlace(btn.dataset.fav);
    });
    document.querySelectorAll('[data-later]').forEach(btn => btn.onclick = () => {
      if (!requirePersonalAccount()) return;
      const isOn = Store.toggleLater(btn.dataset.later);
      showToast(isOn ? 'Ajouté à visiter plus tard 📌' : 'Retiré de la liste');
      renderAll();
      if (els.dialog.open) openPlace(btn.dataset.later);
    });
    document.querySelectorAll('[data-visited]').forEach(btn => btn.onclick = () => {
      if (!requirePersonalAccount()) return;
      const isOn = Store.toggleVisited(btn.dataset.visited);
      showToast(isOn ? 'Marqué comme visité ✅' : 'Retiré des visités');
      renderAll();
      if (els.dialog.open) openPlace(btn.dataset.visited);
    });
    document.querySelectorAll('[data-note]').forEach(input => {
      input.oninput = debounce(() => {
        if (!requirePersonalAccount()) return;
        Store.setNote(input.dataset.note, input.value);
        showToast('Note sauvegardée');
      }, 500);
    });
    document.querySelectorAll('[data-coords]').forEach(btn => btn.onclick = async () => {
      const place = places.find(item => item.id === btn.dataset.coords);
      if (!place) return;

      const coords = `${place.latitude}, ${place.longitude}`;
      const defaultText = btn.dataset.defaultText || btn.textContent;
      btn.dataset.defaultText = defaultText;

      const confirmButton = message => {
        btn.textContent = message;
        btn.classList.add('is-copied');
        btn.setAttribute('aria-live', 'polite');
        clearTimeout(btn.copyTimer);
        btn.copyTimer = setTimeout(() => {
          btn.textContent = btn.dataset.defaultText || '📍 Copier GPS';
          btn.classList.remove('is-copied');
        }, 2400);
      };

      try {
        await navigator.clipboard.writeText(coords);
        confirmButton('✅ GPS copié');
        showToast(`Coordonnées copiées : ${coords}`);
      } catch (_) {
        confirmButton('📍 Coordonnées affichées');
        showToast(`GPS : ${coords}`);
      }
    });
    document.querySelectorAll('[data-load-tides]').forEach(btn => btn.onclick = async () => {
      const place = places.find(item => item.id === btn.dataset.loadTides);
      if (!place) return;

      if (hasRequestedTideThisSession(place.id)) {
        btn.disabled = true;
        btn.textContent = '🔒 Déjà demandé pendant cette session';
        showToast('Une seule demande marée par balade et par session');
        const panel = document.querySelector(`[data-tide-results="${place.id}"]`);
        if (panel) panel.hidden = false;
        return;
      }

      const panel = document.querySelector(`[data-tide-results="${place.id}"]`);
      if (panel) panel.hidden = false;

      const originalText = btn.dataset.defaultText || btn.textContent;
      btn.dataset.defaultText = originalText;
      btn.disabled = true;
      btn.textContent = '🌊 Chargement des marées…';

      await ensureLocationForTides();

      const enriched = enrichPlace(place);

      await Promise.all([
        updateLiveTide(enriched),
        updateArrivalTide(enriched)
      ]);

      markTideRequestedThisSession(place.id);

      btn.disabled = true;
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-ghost');
      btn.textContent = '🔒 Déjà demandé pendant cette session';
      showToast('Marées chargées 🌊');
    });
    document.querySelectorAll('[data-share]').forEach(btn => btn.onclick = async () => {
      const place = places.find(item => item.id === btn.dataset.share);
      if (!place) return;
      const text = shareText(place);
      if (navigator.share) {
        try { await navigator.share({ title: place.name, text, url: googleMapsUrl(place) }); }
        catch (_) { /* user cancelled */ }
      } else {
        await navigator.clipboard.writeText(`${text} ${googleMapsUrl(place)}`);
        showToast('Lien copié');
      }
    });
  };

  const resetFilters = () => {
    state.query = '';
    state.category = 'all';
    state.department = 'all';
    state.radius = 'all';
    state.difficulty = 'all';
    state.sort = 'smart';
    state.quick.clear();
    state.mood = 'all';
    els.search.value = '';
    els.category.value = 'all';
    els.department.value = 'all';
    els.radius.value = 'all';
    els.difficulty.value = 'all';
    els.sort.value = 'smart';
    els.chips.forEach(chip => chip.classList.remove('is-active'));
    els.moods.forEach(chip => chip.classList.remove('is-active'));
    renderAll();
  };

  const chooseRandom = () => {
    const list = state.filtered.length ? state.filtered : getFiltered();
    if (!list.length) return showToast('Aucun lieu disponible avec ces filtres');
    const place = list[Math.floor(Math.random() * list.length)];
    openPlace(place.id);
    showToast('Sortie surprise trouvée 🎲');
  };


  /* forceNearestSortAfterLocation : quand l’utilisateur clique sur Autour de moi, cette fonction force le tri par proximité. */
  const forceNearestSortAfterLocation = () => {
    try {
      state.sort = 'distance';
      state.distanceMax = '';
      const sortSelect = document.getElementById('sortSelect');
      const distanceSelect = document.getElementById('distanceSelect');

      if (sortSelect) {
        const distanceOption = Array.from(sortSelect.options || []).find(option => {
          const value = String(option.value || '').toLowerCase();
          const text = String(option.textContent || '').toLowerCase();
          return value.includes('distance') || value.includes('proxim') || text.includes('distance') || text.includes('proxim');
        });

        if (distanceOption) {
          sortSelect.value = distanceOption.value;
          state.sort = distanceOption.value;
        }
      }

      if (distanceSelect) {
        const anyOption = Array.from(distanceSelect.options || []).find(option => {
          const value = String(option.value || '').toLowerCase();
          const text = String(option.textContent || '').toLowerCase();
          return value === '' || value === 'all' || text.includes('peu importe') || text.includes('toutes');
        });
        if (anyOption) {
          distanceSelect.value = anyOption.value;
          state.distanceMax = anyOption.value;
        }
      }
    } catch (_) {}
  };

  /* requestLocation : demande la position du téléphone puis met à jour les distances et le tri autour de moi. */
  const requestLocation = async () => {
    try {
      showToast('Recherche de ta position…');
      const pos = await Geo.getPosition();
      BreizhMap.setUser(pos);
      forceNearestSortAfterLocation();
      renderAll();
      showToast('Position activée ✅ Balades triées de la plus proche à la plus éloignée');
      if (state.view === 'map') BreizhMap.renderMarkers(getMapOverviewPlaces(), openPlace, { overview: true });
    } catch (error) {
      const message = error?.code === 1 ? 'Localisation refusée : autorise-la dans les réglages du navigateur si besoin' : 'Impossible de récupérer la position';
      showToast(message);
    }
  };

  const bindEvents = () => {
    els.tabs.forEach(tab => tab.addEventListener('click', () => setView(tab.dataset.view)));
    if (els.enableLocationStart) els.enableLocationStart.addEventListener('click', async () => {
      hideLocationPrompt();
      localStorage.removeItem(locationPromptStorageKey);
      await requestLocation();
    });
    if (els.skipLocationStart) els.skipLocationStart.addEventListener('click', () => {
      localStorage.setItem(locationPromptStorageKey, 'yes');
      hideLocationPrompt();
      showToast('Localisation ignorée pour le moment');
    });
    if (els.menuToggle) els.menuToggle.addEventListener('click', openMenu);
    if (els.menuClose) els.menuClose.addEventListener('click', closeMenu);
    if (els.menuOverlay) els.menuOverlay.addEventListener('click', closeMenu);
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
    els.search.addEventListener('input', debounce(event => { state.query = event.target.value; renderAll(); }));
    els.category.addEventListener('change', event => { state.category = event.target.value; renderAll(); });
    els.department.addEventListener('change', event => { state.department = event.target.value; renderAll(); });
    els.radius.addEventListener('change', event => {
      state.radius = event.target.value;
      if (state.radius !== 'all' && !Geo.getUserPosition()) requestLocation();
      renderAll();
    });
    els.difficulty.addEventListener('change', event => { state.difficulty = event.target.value; renderAll(); });
    els.sort.addEventListener('change', event => {
      state.sort = event.target.value;
      if (state.sort === 'distance' && !Geo.getUserPosition()) requestLocation();
      renderAll();
    });
    els.chips.forEach(chip => chip.addEventListener('click', () => {
      const key = chip.dataset.quick;
      if (state.quick.has(key)) state.quick.delete(key); else state.quick.add(key);
      chip.classList.toggle('is-active', state.quick.has(key));
      renderAll();
    }));
    els.moods.forEach(chip => chip.addEventListener('click', () => {
      const mood = chip.dataset.mood;
      state.mood = state.mood === mood ? 'all' : mood;
      els.moods.forEach(item => item.classList.toggle('is-active', item.dataset.mood === state.mood));
      renderAll();
      showToast(state.mood === 'all' ? 'Ambiance retirée' : `Ambiance ${moodLabel(state.mood)} activée`);
    }));
    els.locate.addEventListener('click', requestLocation);
    els.random.addEventListener('click', chooseRandom);
    els.reset.addEventListener('click', resetFilters);
    els.fitMap.addEventListener('click', () => {
      BreizhMap.renderMarkers(getMapOverviewPlaces(), openPlace, { overview: true });
      showToast('Carte recentrée sur toutes les balades de Bretagne 🗺️');
    });
    els.closeDialog.addEventListener('click', () => els.dialog.close());
    els.dialog.addEventListener('click', event => {
      const rect = els.dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) els.dialog.close();
    });
    window.addEventListener('hashchange', () => {
      const view = window.location.hash.replace('#', '');
      // Connexion obligatoire avant hashchange — V2.3.0
      const publicViews = ['explore', 'map', 'about', 'login', 'signup'];
      if (window.BreizhAuth && !window.BreizhAuth.isConnected() && view && !publicViews.includes(view)) {
        window.BreizhAuth.go('login');
        return;
      }
      if (view && document.getElementById(`view-${view}`)) setView(view);
    });
    const updateOfflineState = () => {
      if (!els.offline) return;
      els.offline.classList.toggle('is-visible', !navigator.onLine);
    };
    window.addEventListener('online', () => {
      updateOfflineState();
      showToast('Connexion retrouvée ✅');
    });
    window.addEventListener('offline', () => {
      updateOfflineState();
      showToast('Mode hors ligne activé');
    });
    updateOfflineState();

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      els.install.classList.remove('hidden');
    });
    els.install.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      els.install.classList.add('hidden');
    });
  };

  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(error => console.warn('SW registration failed', error));
      });
    }
  };


  const refreshViewportSafe = () => {
    try {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      setTimeout(() => {
        try { BreizhMap.invalidate?.(); } catch (_) {}
      }, 220);
    } catch (_) {}
  };


  const lockDialogHorizontalScroll = () => {
    try {
      const dialog = document.querySelector('.place-dialog');
      const body = document.querySelector('.dialog-body, .dialog-scroll, .place-dialog__scroll');
      if (dialog) dialog.scrollLeft = 0;
      if (body) body.scrollLeft = 0;
    } catch (_) {}
  };

  /* init : point de départ du JavaScript. Cette fonction lance l’application quand la page est prête. */
  const init = () => {
    if (els.heroPlacesCount) els.heroPlacesCount.textContent = `${places.length} lieux disponibles`;
    populateFilters();
    bindEvents();
    refreshViewportSafe();
    window.addEventListener('resize', refreshViewportSafe, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(refreshViewportSafe, 350), { passive: true });
    renderAll();
    const savedPosition = Geo.getUserPosition();
    if (savedPosition) { BreizhMap.setUser(savedPosition); renderAll(); }
    const initialView = window.location.hash.replace('#', '') || ((window.BreizhAuth && window.BreizhAuth.isConnected()) ? 'explore' : 'login');
    if (document.getElementById(`view-${initialView}`)) setView(initialView);
    registerServiceWorker();
    if (!window.L) {
      const fallback = document.getElementById('mapFallback');
      if (fallback) fallback.textContent = 'Carte indisponible hors connexion au premier chargement.';
    }
  };

  init();
})();
