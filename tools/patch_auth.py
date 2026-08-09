from pathlib import Path
p=Path('js/auth-local.js'); s=p.read_text(encoding='utf-8')
s=s.replace("const publicViews = new Set(['login', 'signup']);","const publicViews = new Set(['explore', 'map', 'about', 'login', 'signup']);\n  const authViews = new Set(['login', 'signup']);")
s=s.replace("const guestDefaultView = 'login';","const guestDefaultView = 'explore';")
old="""  const setMessage = (message, type = 'info') => {\n    const box = $('authMessage');\n    if (!box) return;\n    box.textContent = message;\n    box.dataset.type = type;\n    box.classList.add('is-visible');\n  };"""
new="""  const setMessage = (message, type = 'info') => {\n    const box = $('authMessage');\n    if (box) { box.textContent = message; box.dataset.type = type; box.classList.add('is-visible'); }\n    const loginVisible = document.getElementById('view-login')?.classList.contains('is-visible');\n    if (!loginVisible && typeof window.showToast === 'function') window.showToast(message);\n  };"""
s=s.replace(old,new)
s=s.replace("if (password.length < 4) {\n      setMessage('Le mot de passe local doit contenir au moins 4 caractères.', 'error');","if (password.length < 8) {\n      setMessage('Le mot de passe local doit contenir au moins 8 caractères.', 'error');")
s=s.replace("  const logout = () => {\n    setSession('');","  const logout = () => {\n    setSession('');\n    try { if (typeof Geo !== 'undefined') Geo.clearUserPosition(); } catch (_) {}")
s=s.replace("    if (!requestedView || publicViews.has(requestedView)) {","    if (!requestedView || authViews.has(requestedView)) {")
s=s.replace("    const label = document.getElementById('currentViewLabel');\n    if (label) label.textContent = target === 'signup' ? 'Inscription' : 'Connexion';","    const label = document.getElementById('currentViewLabel');\n    if (label) { const labels={explore:'Explorer',map:'Carte',about:'Infos',login:'Connexion',signup:'Inscription'}; label.textContent=labels[target]||'Explorer'; }")
s=s.replace("        : 'Connexion obligatoire';","        : 'Navigation libre • compte optionnel';")
s=s.replace('Connexion obligatoire : connecte-toi ou crée un compte local pour accéder à l’application.','Cette section personnelle nécessite un compte local sur cet appareil.')
s=s.replace('Connexion obligatoire : crée un compte ou connecte-toi pour accéder à l’application.','Connecte-toi pour accéder à cette section personnelle.')
s=s.replace('Déconnexion locale effectuée. Connexion obligatoire pour accéder à l’application.','Déconnexion effectuée. Explorer et la carte restent accessibles sans compte.')
s=s.replace('V2.1.6.11','V2.3.0').replace('v2.1.6.11','v2.3.0')
p.write_text(s,encoding='utf-8')
