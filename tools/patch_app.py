from pathlib import Path
p=Path('js/app.js'); s=p.read_text(encoding='utf-8')
s=s.replace("enabled: true,\n    baseUrl: 'https://api-maree.fr',\n    key: '479a92fa8d6e995646aff4a4ca7043e5',","enabled: false,\n    baseUrl: 'https://api-maree.fr',\n    key: '',")
needle="    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2200);\n  };"
if 'window.showToast = showToast;' not in s: s=s.replace(needle,needle+'\n  window.showToast = showToast;',1)
s=s.replace("const publicViews = ['login', 'signup'];","const publicViews = ['explore', 'map', 'about', 'login', 'signup'];")
s=s.replace('decoding="async" fetchpriority="auto"','loading="lazy" decoding="async" fetchpriority="low"')
s=s.replace('    preloadPlaceImages();\n','')
s=s.replace('    checkLocationAtStartup();\n',"    const savedPosition = Geo.getUserPosition();\n    if (savedPosition) { BreizhMap.setUser(savedPosition); renderAll(); }\n")
anchor='  /* bindDynamicButtons : relie les boutons créés dynamiquement après le rendu, par exemple dans les cartes ou fiches. */\n  const bindDynamicButtons = () => {'
helper="""  const requirePersonalAccount = () => {\n    if (window.BreizhAuth?.isConnected?.()) return true;\n    showToast('Connecte-toi pour enregistrer tes favoris, notes et listes personnelles.');\n    window.BreizhAuth?.go?.('login');\n    return false;\n  };\n\n  /* bindDynamicButtons : relie les boutons créés dynamiquement après le rendu, par exemple dans les cartes ou fiches. */\n  const bindDynamicButtons = () => {"""
s=s.replace(anchor,helper)
s=s.replace("document.querySelectorAll('[data-fav]').forEach(btn => btn.onclick = () => {\n      const isOn","document.querySelectorAll('[data-fav]').forEach(btn => btn.onclick = () => {\n      if (!requirePersonalAccount()) return;\n      const isOn")
s=s.replace("document.querySelectorAll('[data-later]').forEach(btn => btn.onclick = () => {\n      const isOn","document.querySelectorAll('[data-later]').forEach(btn => btn.onclick = () => {\n      if (!requirePersonalAccount()) return;\n      const isOn")
s=s.replace("document.querySelectorAll('[data-visited]').forEach(btn => btn.onclick = () => {\n      const isOn","document.querySelectorAll('[data-visited]').forEach(btn => btn.onclick = () => {\n      if (!requirePersonalAccount()) return;\n      const isOn")
s=s.replace("input.oninput = debounce(() => {\n        Store.setNote","input.oninput = debounce(() => {\n        if (!requirePersonalAccount()) return;\n        Store.setNote")
s=s.replace('🌊 Afficher les marées','🌊 Estimer les marées')
start=s.find('  const updateLiveTide = async place => {'); end=s.find('\n\n  const ensureLocationForTides',start)
if start!=-1 and end!=-1: s=s[:start]+'''  const updateLiveTide = async place => {\n    if (!place || !isSeaPlace(place)) return;\n    const box = document.querySelector(`[data-live-tide="${place.id}"]`);\n    if (!box) return;\n    box.innerHTML = tideStateTemplate(tideInfo(place, new Date()));\n  };'''+s[end:]
old="""    if (routeResult.status === 'ok' && routeResult.minutes != null && apiMareeKeyReady()) {\n      try {\n        const arrivalDate = new Date(Date.now() + routeResult.minutes * 60 * 1000);\n        routeResult.tide = await apiMareeInfo(place, arrivalDate);\n      } catch (_) {\n        routeResult.tide = { status: 'error' };\n      }\n    }"""
new="""    if (routeResult.status === 'ok' && routeResult.minutes != null) {\n      const arrivalDate = new Date(Date.now() + routeResult.minutes * 60 * 1000);\n      routeResult.tide = tideInfo(place, arrivalDate);\n    }"""
s=s.replace(old,new).replace('V2.1.6.11','V2.3.0').replace('v2.1.6.11','v2.3.0')
p.write_text(s,encoding='utf-8')
