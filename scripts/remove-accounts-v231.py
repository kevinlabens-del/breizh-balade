from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('V2.3.0','V2.3.1').replace('v=230','v=231').replace("!key.includes('v2.3.0')","!key.includes('v2.3.1')")
s=re.sub(r'\s*<button[^>]+data-account-go="(?:login|signup)"[^>]*>.*?</button>','',s,flags=re.S)
s=re.sub(r'\s*<button[^>]+data-view="(?:login|signup|profile)"[^>]*>.*?</button>','',s,flags=re.S)
s=s.replace('Navigation libre • compte optionnel','Accès public • données enregistrées sur cet appareil')
s=s.replace('data-access="private"','data-access="public"')
for vid in ('login','signup','profile'):
    s=re.sub(r'\s*<section class="view[^\"]*" id="view-'+vid+r'">.*?</section>','',s,flags=re.S)
s=re.sub(r'\s*<script src="js/auth-local\.js\?v=231"></script>','',s)
p.write_text(s,encoding='utf-8')

p=Path('js/app.js'); s=p.read_text(encoding='utf-8')
s=s.replace("const initialView = window.location.hash.replace('#', '') || ((window.BreizhAuth && window.BreizhAuth.isConnected()) ? 'explore' : 'login');","const initialView = window.location.hash.replace('#', '') || 'explore';")
s=s.replace('V2.3.0','V2.3.1')
p.write_text(s,encoding='utf-8')

p=Path('service-worker.js'); s=p.read_text(encoding='utf-8')
s=s.replace('breizh-balade-v2.3.0','breizh-balade-v2.3.1').replace("  './js/auth-local.js',\n",'')
p.write_text(s,encoding='utf-8')

p=Path('manifest.webmanifest'); s=p.read_text(encoding='utf-8').replace('V2.3.0','V2.3.1'); p.write_text(s,encoding='utf-8')
Path('CHANGEMENTS_V2.3.1_PUBLIC_SANS_COMPTE.md').write_text('# Breizh’ Balade V2.3.1 — Accès public sans compte\n\n- Suppression complète de la connexion, inscription et profil.\n- Explorer, Carte, Favoris, À visiter, Visités et Infos accessibles à tous.\n- Favoris, listes et notes conservés localement sur l’appareil.\n- Migration automatique des anciennes données locales liées aux anciens comptes.\n- Aucun mot de passe ni adresse email demandé.\n- Version et cache mis à jour en V2.3.1.\n',encoding='utf-8')
