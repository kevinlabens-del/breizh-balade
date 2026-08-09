/*
===============================================================================
BREIZH’ BALLADE — js/storage.js
===============================================================================

Ce fichier gère la petite mémoire locale de l’application.

Il sert à enregistrer dans le navigateur :
- les favoris ;
- les lieux à visiter plus tard ;
- les lieux déjà visités.

Important :
- localStorage reste sur le téléphone ou navigateur de l’utilisateur ;
- ce n’est pas une base de données en ligne ;
- si l’utilisateur vide les données du navigateur, ces listes peuvent disparaître.
===============================================================================
*/
const Store = (() => {
  const prefix = 'breizhBalade:';
  /* read : lit une liste enregistrée dans localStorage. */
  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(prefix + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('Storage read error', key, error);
      return fallback;
    }
  };
  /* write : sauvegarde une liste dans localStorage. */
  const write = (key, value) => {
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    } catch (error) {
      console.warn('Storage write error', key, error);
    }
  };
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
      write('notes', notes);
    }
  };
})();
