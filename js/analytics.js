/* Breizh’ Balade — statistiques anonymes V2.3.5
   Aucun nom, email ou compte. Un identifiant aléatoire local distingue les visiteurs. */
(() => {
  const ENDPOINT = 'https://kokmqcqlpkruoewhewcb.supabase.co/functions/v1/breizh-analytics';
  const VISITOR_KEY = 'breizh.analytics.visitorId';
  const SESSION_KEY = 'breizh.analytics.sessionId';

  const fallbackUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  const uuid = () => crypto?.randomUUID?.() || fallbackUuid();

  const getVisitorId = () => {
    try {
      let id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = uuid();
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch (_) {
      return uuid();
    }
  };

  const getSessionId = () => {
    try {
      let id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = uuid();
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (_) {
      return uuid();
    }
  };

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const currentPath = () => `${location.pathname}${location.hash || ''}`.slice(0, 300);

  const send = async (event) => {
    const payload = {
      event,
      visitorId,
      sessionId,
      path: currentPath(),
      referrer: event === 'visit' ? (document.referrer || '') : ''
    };
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (_) {
      return false;
    }
  };

  const formatNumber = value => Number(value || 0).toLocaleString('fr-FR');
  const plural = (value, singular, pluralForm) => Number(value || 0) === 1 ? singular : pluralForm;

  const createPublicStatsLine = () => {
    if (document.getElementById('publicVisitorStats')) return document.getElementById('publicVisitorStats');
    const actions = document.querySelector('.hero-actions');
    if (!actions) return null;

    const line = document.createElement('div');
    line.id = 'publicVisitorStats';
    line.setAttribute('aria-live', 'polite');
    line.setAttribute('aria-label', 'Fréquentation de Breizh Balade');
    line.textContent = '👥 chargement des visiteurs…';
    Object.assign(line.style, {
      width: '100%',
      marginTop: '7px',
      textAlign: 'center',
      fontSize: 'clamp(9px, 2.35vw, 11.5px)',
      lineHeight: '1.35',
      fontWeight: '600',
      letterSpacing: '-0.015em',
      opacity: '0.72',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      userSelect: 'none'
    });
    actions.insertAdjacentElement('afterend', line);
    return line;
  };

  const loadPublicStats = async () => {
    const line = createPublicStatsLine();
    if (!line) return;
    try {
      const response = await fetch(ENDPOINT, { cache: 'no-store' });
      if (!response.ok) throw new Error('stats');
      const data = await response.json();
      const total = Number(data.total_visitors || 0);
      const today = Number(data.visitors_today || 0);
      const online = Number(data.online_now || 0);
      line.textContent = `👥 ${formatNumber(total)} ${plural(total, 'visiteur', 'visiteurs')} depuis le lancement · 📅 ${formatNumber(today)} ${plural(today, 'visiteur', 'visiteurs')} aujourd’hui · 🟢 ${formatNumber(online)} ${plural(online, 'utilisateur', 'utilisateurs')} en ligne`;
      line.style.visibility = 'visible';
      line.style.opacity = '0.72';
    } catch (_) {
      line.textContent = '👥 statistiques momentanément indisponibles';
      line.style.visibility = 'visible';
      line.style.opacity = '0.58';
    }
  };

  send('visit');

  let heartbeatTimer = null;
  const startHeartbeat = () => {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(() => {
      if (document.visibilityState === 'visible') send('heartbeat');
    }, 45000);
  };
  const stopHeartbeat = () => {
    if (!heartbeatTimer) return;
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  };

  const initPublicStats = () => {
    createPublicStatsLine();
    loadPublicStats();
    setInterval(loadPublicStats, 20000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPublicStats, { once: true });
  } else {
    initPublicStats();
  }

  startHeartbeat();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      send('heartbeat');
      loadPublicStats();
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
  });
  window.addEventListener('pagehide', () => send('heartbeat'));
})();
