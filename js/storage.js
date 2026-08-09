/* Breizh’ Balade — stockage public local.
   Favoris, À visiter, Visités et Notes sont enregistrés uniquement sur cet appareil.
   Les anciennes données éventuellement liées à un ancien compte local sont fusionnées
   une seule fois puis les anciennes clés de compte sont supprimées. */
const Store = (() => {
  const prefix = 'breizhBalade:';
  const migrationFlag = prefix + 'public-no-account-migrated';

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

  const migrateFormerAccountData = () => {
    if (localStorage.getItem(migrationFlag)) return;

    for (const key of ['favorites', 'later', 'visited']) {
      const merged = new Set(readJSON(prefix + key, []));
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i) || '';
        if (storageKey.startsWith(prefix + 'user:') && storageKey.endsWith(':' + key)) {
          for (const value of readJSON(storageKey, [])) merged.add(value);
        }
      }
      writeJSON(prefix + key, [...merged]);
    }

    const notes = { ...readJSON(prefix + 'notes', {}) };
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i) || '';
      if (storageKey.startsWith(prefix + 'user:') && storageKey.endsWith(':notes')) {
        Object.assign(notes, readJSON(storageKey, {}));
      }
    }
    writeJSON(prefix + 'notes', notes);

    const obsoleteKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i) || '';
      if (storageKey.startsWith('breizhAuth:') || storageKey.startsWith(prefix + 'user:')) {
        obsoleteKeys.push(storageKey);
      }
    }
    obsoleteKeys.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(migrationFlag, '1');
  };

  migrateFormerAccountData();

  const read = (key, fallback) => readJSON(prefix + key, fallback);
  const write = (key, value) => writeJSON(prefix + key, value);
  const toggleInArray = (key, id) => {
    const list = read(key, []);
    const next = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
    write(key, next);
    return next.includes(id);
  };

  return {
    read,
    write,
    all: () => ({
      favorites: read('favorites', []),
      later: read('later', []),
      visited: read('visited', []),
      notes: read('notes', {})
    }),
    isFavorite: id => read('favorites', []).includes(id),
    isLater: id => read('later', []).includes(id),
    isVisited: id => read('visited', []).includes(id),
    toggleFavorite: id => toggleInArray('favorites', id),
    toggleLater: id => toggleInArray('later', id),
    toggleVisited: id => toggleInArray('visited', id),
    getNote: id => read('notes', {})[id] || '',
    setNote: (id, note) => {
      const notes = read('notes', {});
      notes[id] = note;
      return write('notes', notes);
    }
  };
})();
