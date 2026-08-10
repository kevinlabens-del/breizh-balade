/* Breizh’ Balade V2.4.2 — marées API actualisées via proxy Supabase.
   Les anciennes estimations locales sont masquées pour le public.
   Les valeurs affichées proviennent de api-maree.fr (prévisions harmoniques Ifremer/PREVIMER).
*/
(() => {
  const ENDPOINT = 'https://kokmqcqlpkruoewhewcb.supabase.co/functions/v1/breizh-tides';
  const places = window.BREIZH_PLACES || [];

  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[ch]));

  const formatTime = value => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris'
    }).format(date);
  };

  const formatHeight = value => Number(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });

  const formatMinutes = minutes => {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    if (total < 60) return `${total} min`;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  };

  const trendLabel = trend => trend === 'montante' ? '↗ Marée montante' : '↘ Marée descendante';

  const extremaHTML = extrema => {
    if (!extrema) return '<span><b>—</b><small>prochain extrême</small></span>';
    const label = extrema.type === 'pleine mer' ? 'Pleine mer' : 'Basse mer';
    return `<span><b>${escapeHTML(label)} ${escapeHTML(formatTime(extrema.time))}</b><small>${escapeHTML(formatHeight(extrema.height))} m</small></span>`;
  };

  const tideHTML = (info, extra = '') => {
    if (!info) return '<div class="api-maree-status">⚠️ Donnée de marée indisponible.</div>';
    return `
      <div class="arrival-tide-result arrival-tide-result--api">
        <span><b>${escapeHTML(trendLabel(info.trend))}</b><small>${escapeHTML(formatTime(info.time))}</small></span>
        <span><b>${escapeHTML(formatHeight(info.height))} m</b><small>hauteur prévue</small></span>
        ${extremaHTML(info.nextExtremum)}
      </div>
      ${extra}
    `;
  };

  const sourceHTML = data => `
    <div class="bb-live-tide-source">
      <strong>Source : api-maree.fr</strong>
      <span>Port de référence : ${escapeHTML(data.site?.name || data.site?.id || 'site le plus proche')}${Number.isFinite(data.site?.distanceKm) ? ` · ${escapeHTML(data.site.distanceKm)} km du lieu` : ''}</span>
      <span>Données calculées à partir de composantes harmoniques Ifremer / PREVIMER · CC BY 4.0.</span>
      <span>Valeurs indicatives : vérifie les informations officielles du SHOM et les consignes locales avant une sortie littorale.</span>
    </div>
  `;

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

  const polishButtons = () => {
    document.querySelectorAll('.tide-panel').forEach(panel => {
      const button = panel.querySelector('.tide-load-btn');
      const results = panel.querySelector('[data-tide-results]');
      if (!button) return;
      const placeId = button.dataset.loadTides || results?.dataset.tideResults;
      if (!placeId) return;
      button.dataset.loadTides = placeId;
      button.dataset.bbLiveTides = '1';
      button.textContent = '🌊 Charger les marées actualisées';
      button.disabled = false;
      button.removeAttribute('aria-disabled');
    });
  };

  const requestPosition = async () => {
    try {
      const geo = typeof Geo !== 'undefined' ? Geo : window.Geo;
      const mapApi = typeof BreizhMap !== 'undefined' ? BreizhMap : window.BreizhMap;
      const existing = geo?.getUserPosition?.();
      if (existing) return existing;
      if (!geo?.getPosition) return null;
      const pos = await geo.getPosition();
      try { mapApi?.setUser?.(pos); } catch (_) {}
      return pos;
    } catch (_) {
      return null;
    }
  };

  const routeMinutes = async (position, place) => {
    if (!position || !place) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
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

  const fetchLiveTides = async (place, travelMinutes) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        arrivalMinutes: Number(travelMinutes || 0)
      })
    });
    if (!response.ok) throw new Error(`tides_${response.status}`);
    return response.json();
  };

  const show = async (button, placeId) => {
    const place = places.find(item => item.id === placeId);
    if (!place) return;

    const selectorId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(placeId) : String(placeId).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    const liveBox = document.querySelector(`[data-live-tide="${selectorId}"]`);
    const routeBox = document.querySelector(`[data-route-tide="${selectorId}"]`);
    const results = document.querySelector(`[data-tide-results="${selectorId}"]`);
    if (!liveBox || !routeBox) return;

    if (results) results.hidden = false;
    button.disabled = true;
    button.textContent = '🌊 Chargement des marées…';
    liveBox.innerHTML = '<div class="bb-live-tide-loading">Connexion à api-maree.fr…</div>';
    routeBox.innerHTML = '<div class="bb-live-tide-loading">Calcul du temps de trajet…</div>';

    const position = await requestPosition();
    const minutes = position ? await routeMinutes(position, place) : null;

    try {
      const data = await fetchLiveTides(place, minutes);
      liveBox.innerHTML = tideHTML(data.now) + sourceHTML(data);

      if (minutes && data.arrival) {
        const arrivalText = `<p class="route-time-used">🚗 Arrivée estimée vers <b>${escapeHTML(formatTime(data.arrival.requestedTime || data.arrival.time))}</b> après environ <b>${escapeHTML(formatMinutes(minutes))}</b> de trajet.</p>`;
        routeBox.innerHTML = tideHTML(data.arrival, arrivalText);
      } else if (!position) {
        routeBox.innerHTML = '<div class="api-maree-status">📍 Autorise la localisation pour calculer le temps de trajet et obtenir la marée prévue à ton arrivée.</div>';
      } else {
        routeBox.innerHTML = '<div class="api-maree-status">🚗 Temps de trajet indisponible pour le moment. La marée actuelle reste affichée ci-dessus.</div>';
      }

      button.textContent = '↻ Actualiser les marées';
      button.disabled = false;
    } catch (_) {
      liveBox.innerHTML = '<div class="api-maree-status">⚠️ Données de marée momentanément indisponibles.</div>';
      routeBox.innerHTML = '<div class="api-maree-status">Réessaie dans quelques instants.</div>';
      button.textContent = '↻ Réessayer les marées';
      button.disabled = false;
    }
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-load-tides]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    show(button, button.dataset.loadTides);
  }, true);

  ensureStyle();
  polishButtons();
  new MutationObserver(() => {
    ensureStyle();
    polishButtons();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
