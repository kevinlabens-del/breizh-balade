/* Breizh’ Balade V2.4.3 — marées actualisées via Supabase -> api-maree.fr. */
(() => {
  if (window.__BREIZH_LIVE_TIDES_LOADED__) return;
  window.__BREIZH_LIVE_TIDES_LOADED__ = true;

  const ENDPOINT = 'https://kokmqcqlpkruoewhewcb.supabase.co/functions/v1/breizh-tides';
  const places = window.BREIZH_PLACES || [];

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[ch]));

  const formatTime = value => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris'
    }).format(d);
  };

  const formatHeight = value => Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  const formatMinutes = value => {
    const minutes = Math.max(0, Math.round(Number(value) || 0));
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  };

  const tideHTML = info => {
    if (!info) return '<div class="api-maree-status">⚠️ Donnée de marée indisponible.</div>';
    const trend = info.trend === 'montante' ? '↗ Marée montante' : '↘ Marée descendante';
    const next = info.nextExtremum
      ? `<span><b>${esc(info.nextExtremum.type === 'pleine mer' ? 'Pleine mer' : 'Basse mer')} ${esc(formatTime(info.nextExtremum.time))}</b><small>${esc(formatHeight(info.nextExtremum.height))} m</small></span>`
      : '<span><b>—</b><small>prochain extrême</small></span>';
    return `
      <div class="arrival-tide-result arrival-tide-result--api">
        <span><b>${esc(trend)}</b><small>${esc(formatTime(info.time))}</small></span>
        <span><b>${esc(formatHeight(info.height))} m</b><small>hauteur prévue</small></span>
        ${next}
      </div>`;
  };

  const sourceHTML = data => `
    <div class="bb-live-tide-source">
      <strong>Source : api-maree.fr</strong>
      <span>Port de référence : ${esc(data.site?.name || data.site?.id || 'site le plus proche')}${Number.isFinite(data.site?.distanceKm) ? ` · ${esc(data.site.distanceKm)} km du lieu` : ''}</span>
      <span>Données indicatives issues de prévisions harmoniques. Vérifie aussi les informations officielles du SHOM et les consignes locales.</span>
    </div>`;

  const ensureStyle = () => {
    if (document.getElementById('bb-live-tides-style')) return;
    const style = document.createElement('style');
    style.id = 'bb-live-tides-style';
    style.textContent = `
      .tide-strip{display:none!important}
      .local-tide-details{display:none!important}
      .bb-live-tide-source{display:grid;gap:3px;margin-top:9px;font-size:.75rem;line-height:1.4;color:var(--muted)}
      .bb-live-tide-source strong{color:var(--text)}
      .bb-live-tide-loading{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid var(--line);color:var(--muted)}
    `;
    document.head.appendChild(style);
  };

  const getGeo = () => {
    try { return typeof Geo !== 'undefined' ? Geo : null; } catch (_) { return null; }
  };

  const getMapApi = () => {
    try { return typeof BreizhMap !== 'undefined' ? BreizhMap : null; } catch (_) { return null; }
  };

  const requestPosition = async () => {
    const geo = getGeo();
    if (!geo) return null;
    const saved = geo.getUserPosition?.();
    if (saved) return saved;
    try {
      const pos = await geo.getPosition();
      try { getMapApi()?.setUser?.(pos); } catch (_) {}
      return pos;
    } catch (_) {
      return null;
    }
  };

  const routeMinutes = async (position, place) => {
    if (!position || !place) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${position.longitude},${position.latitude};${place.longitude},${place.latitude}?overview=false&alternatives=false&steps=false`;
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || data.code !== 'Ok' || !data.routes?.length) return null;
      return Math.max(1, Math.round(data.routes[0].duration / 60));
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const fetchTides = async (place, minutes) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        arrivalMinutes: Number(minutes || 0)
      })
    });
    if (!response.ok) throw new Error(`tides_${response.status}`);
    return response.json();
  };

  const handle = async button => {
    const placeId = button.dataset.loadTides;
    const place = places.find(item => item.id === placeId);
    if (!place) return;

    const liveBox = document.querySelector(`[data-live-tide="${placeId}"]`);
    const routeBox = document.querySelector(`[data-route-tide="${placeId}"]`);
    const results = document.querySelector(`[data-tide-results="${placeId}"]`);
    if (!liveBox || !routeBox) return;

    if (results) results.hidden = false;
    button.disabled = true;
    button.textContent = '🌊 Chargement des marées…';
    liveBox.innerHTML = '<div class="bb-live-tide-loading">Récupération de la marée actuelle…</div>';
    routeBox.innerHTML = '<div class="bb-live-tide-loading">Calcul de la marée à l’arrivée…</div>';

    const position = await requestPosition();
    const minutes = position ? await routeMinutes(position, place) : null;

    try {
      const data = await fetchTides(place, minutes);
      liveBox.innerHTML = tideHTML(data.now) + sourceHTML(data);

      if (minutes && data.arrival) {
        routeBox.innerHTML = tideHTML(data.arrival) +
          `<p class="route-time-used">🚗 Arrivée estimée vers <b>${esc(formatTime(data.arrival.requestedTime || data.arrival.time))}</b> après environ <b>${esc(formatMinutes(minutes))}</b> de trajet.</p>`;
      } else if (!position) {
        routeBox.innerHTML = '<div class="api-maree-status">📍 Autorise la localisation pour calculer la marée prévue à ton arrivée.</div>';
      } else {
        routeBox.innerHTML = '<div class="api-maree-status">🚗 Temps de trajet indisponible pour le moment. La marée actuelle reste disponible.</div>';
      }

      button.textContent = '↻ Actualiser les marées';
    } catch (_) {
      liveBox.innerHTML = '<div class="api-maree-status">⚠️ Données de marée momentanément indisponibles.</div>';
      routeBox.innerHTML = '<div class="api-maree-status">Réessaie dans quelques instants.</div>';
      button.textContent = '↻ Réessayer les marées';
    } finally {
      button.disabled = false;
    }
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-load-tides]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    handle(button);
  }, true);

  ensureStyle();
})();
