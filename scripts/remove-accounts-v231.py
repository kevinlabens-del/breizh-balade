from pathlib import Path
import re

# INDEX
p=Path('index.html'); s=p.read_text(encoding='utf-8')
s=s.replace('V2.3.0','V2.3.1').replace('v=230','v=231').replace("!key.includes('v2.3.0')","!key.includes('v2.3.1')")
s=s.replace('<body class="is-guest">','<body class="is-authenticated">')
s=re.sub(r'\s*<button[^>]+data-account-go="(?:login|signup)"[^>]*>.*?</button>','',s,flags=re.S)
s=re.sub(r'\s*<button[^>]+data-view="(?:login|signup|profile)"[^>]*>.*?</button>','',s,flags=re.S)
s=s.replace('Navigation libre • compte optionnel','Accès public • favoris et listes enregistrés sur cet appareil')
s=s.replace('data-access="private"','data-access="public"')
for vid in ('login','signup','profile'):
    s=re.sub(r'\s*<section class="view[^\"]*" id="view-'+vid+r'">.*?</section>','',s,flags=re.S)
s=re.sub(r'\s*<script src="js/auth-local\.js\?v=231"></script>','',s)
p.write_text(s,encoding='utf-8')

# APP: remove every account gate
p=Path('js/app.js'); s=p.read_text(encoding='utf-8')
s=s.replace('V2.3.0','V2.3.1')
s=s.replace("""    // Connexion obligatoire avant setView — V2.3.1\n    const publicViews = ['explore', 'map', 'about', 'login', 'signup'];\n    if (window.BreizhAuth && !window.BreizhAuth.isConnected() && !publicViews.includes(view)) {\n      window.BreizhAuth.go('login');\n      return;\n    }\n""",'')
s=re.sub(r"\n  const requirePersonalAccount = \(\) => \{.*?\n  \};\n", "\n  const requirePersonalAccount = () => true;\n", s, flags=re.S)
s=s.replace("""      // Connexion obligatoire avant hashchange — V2.3.1\n      const publicViews = ['explore', 'map', 'about', 'login', 'signup'];\n      if (window.BreizhAuth && !window.BreizhAuth.isConnected() && view && !publicViews.includes(view)) {\n        window.BreizhAuth.go('login');\n        return;\n      }\n""",'')
s=re.sub(r"const initialView = window\.location\.hash\.replace\('#', ''\) \|\| .*?;", "const initialView = window.location.hash.replace('#', '') || 'explore';", s)
p.write_text(s,encoding='utf-8')

# STORAGE: public local data + migration of former account-scoped data
Path('js/storage.js').write_text(r'''const Store = (() => {
  const prefix = 'breizhBalade:';
  const migrationFlag = prefix + 'v231-account-data-migrated';
  const readJSON = (key, fallback) => { try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(_) { return fallback; } };
  const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch(_) { return false; } };
  const migrateOldAccountData = () => {
    if (localStorage.getItem(migrationFlag)) return;
    const arrayKeys=['favorites','later','visited'];
    const noteKey='notes';
    for (const key of arrayKeys) {
      const merged = new Set(readJSON(prefix+key, []));
      for (let i=0;i<localStorage.length;i++) { const k=localStorage.key(i)||''; if (k.startsWith(prefix+'user:') && k.endsWith(':'+key)) for (const v of readJSON(k,[])) merged.add(v); }
      writeJSON(prefix+key,[...merged]);
    }
    const notes={...readJSON(prefix+noteKey,{})};
    for (let i=0;i<localStorage.length;i++) { const k=localStorage.key(i)||''; if (k.startsWith(prefix+'user:') && k.endsWith(':'+noteKey)) Object.assign(notes,readJSON(k,{})); }
    writeJSON(prefix+noteKey,notes);
    const remove=[]; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||''; if(k.startsWith('breizhAuth:')||k.startsWith(prefix+'user:')) remove.push(k);} remove.forEach(k=>localStorage.removeItem(k));
    localStorage.setItem(migrationFlag,'1');
  };
  migrateOldAccountData();
  const read=(key,fallback)=>readJSON(prefix+key,fallback);
  const write=(key,value)=>writeJSON(prefix+key,value);
  const toggleInArray=(key,id)=>{const list=read(key,[]);const next=list.includes(id)?list.filter(x=>x!==id):[...list,id];write(key,next);return next.includes(id);};
  return {read,write,all:()=>({favorites:read('favorites',[]),later:read('later',[]),visited:read('visited',[]),notes:read('notes',{})}),isFavorite:id=>read('favorites',[]).includes(id),isLater:id=>read('later',[]).includes(id),isVisited:id=>read('visited',[]).includes(id),toggleFavorite:id=>toggleInArray('favorites',id),toggleLater:id=>toggleInArray('later',id),toggleVisited:id=>toggleInArray('visited',id),getNote:id=>read('notes',{})[id]||'',setNote:(id,note)=>{const notes=read('notes',{});notes[id]=note;return write('notes',notes);}};
})();
''',encoding='utf-8')

# CACHE / MANIFEST
p=Path('service-worker.js'); s=p.read_text(encoding='utf-8').replace('breizh-balade-v2.3.0','breizh-balade-v2.3.1').replace("  './js/auth-local.js',\n",''); p.write_text(s,encoding='utf-8')
p=Path('manifest.webmanifest'); s=p.read_text(encoding='utf-8').replace('V2.3.0','V2.3.1'); p.write_text(s,encoding='utf-8')

Path('CHANGEMENTS_V2.3.1_PUBLIC_SANS_COMPTE.md').write_text('''# Breizh’ Balade V2.3.1 — Accès public sans compte\n\n- Suppression complète de la connexion, inscription et profil.\n- Explorer, Carte, Favoris, À visiter, Visités et Infos accessibles à tous.\n- Favoris, listes et notes conservés localement sur l’appareil.\n- Migration automatique des anciennes données locales liées aux anciens comptes.\n- Suppression des anciennes données de compte après migration.\n- Aucun mot de passe ni adresse email demandé.\n- Version et cache mis à jour en V2.3.1.\n''',encoding='utf-8')
