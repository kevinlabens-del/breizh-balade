/* Breizh’ Balade V2.4.0 — statistiques anonymes.
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

  const send = async event => {
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

  const ensureStyle = () => {
    if (document.getElementById('bb-public-stats-style')) return;
    const style = document.createElement('style');
    style.id = 'bb-public-stats-style';
    style.textContent = `
      #publicVisitorStats{
        width:100%;
        margin-top:7px;
        display:grid;
        justify-items:center;
        gap:3px;
        text-align:center;
        font-size:clamp(10px,2.6vw,12px);
        line-height:1.35;
        font-weight:600;
        letter-spacing:-.01em;
        opacity:.74;
        user-select:none;
        overflow:visible;
      }
      #publicVisitorStats .bb-stats-top{
        max-width:100%;
        display:flex;
        justify-content:center;
        align-items:center;
        flex-wrap:wrap;
        gap:3px 5px;
      }
      #publicVisitorStats .bb-stats-item,
      #publicVisitorStats .bb-stats-online{
        white-space:nowrap;
      }
      #publicVisitorStats .bb-stats-online{
        display:block;
      }
      @media (max-width:360px){
        #publicVisitorStats{font-size:10px}
        #publicVisitorStats .bb-stats-separator{display:none}
        #publicVisitorStats .bb-stats-top{gap:2px 8px}
      }
    `;
    document.head.appendChild(style);
  };

  const createPublicStatsLine = () => {
    const existing = document.getElementById('publicVisitorStats');
    if (existing) return existing;

    const actions = document.querySelector('.hero-actions');
    if (!actions) return null;

    ensureStyle();
    const line = document.createElement('div');
    line.id = 'publicVisitorStats';
    line.setAttribute('aria-live', 'polite');
    line.setAttribute('aria-label', 'Fréquentation de Breizh Balade');
    line.textContent = '👥 chargement des visiteurs…';
    actions.insertAdjacentElement('afterend', line);
    return line;
  };

  const renderStats = (line, total, today, online) => {
    const totalText = `👥 ${formatNumber(total)} ${plural(total, 'visiteur', 'visiteurs')} depuis le lancement`;
    const todayText = `📅 ${formatNumber(today)} ${plural(today, 'visiteur', 'visiteurs')} aujourd’hui`;
    const onlineText = `🟢 ${formatNumber(online)} ${plural(online, 'utilisateur', 'utilisateurs')} en ligne`;

    const top = document.createElement('span');
    top.className = 'bb-stats-top';

    const totalNode = document.createElement('span');
    totalNode.className = 'bb-stats-item';
    totalNode.textContent = totalText;

    const separator = document.createElement('span');
    separator.className = 'bb-stats-separator';
    separator.textContent = '·';
    separator.setAttribute('aria-hidden', 'true');

    const todayNode = document.createElement('span');
    todayNode.className = 'bb-stats-item';
    todayNode.textContent = todayText;

    const onlineNode = document.createElement('span');
    onlineNode.className = 'bb-stats-online';
    onlineNode.textContent = onlineText;

    top.append(totalNode, separator, todayNode);
    line.replaceChildren(top, onlineNode);
    line.setAttribute('aria-label', `${totalText}. ${todayText}. ${onlineText}.`);
  };

  const loadPublicStats = async () => {
    const line = createPublicStatsLine();
    if (!line) return;

    try {
      const response = await fetch(ENDPOINT, { cache: 'no-store' });
      if (!response.ok) throw new Error('stats');
      const data = await response.json();
      renderStats(
        line,
        Number(data.total_visitors || 0),
        Number(data.visitors_today || 0),
        Number(data.online_now || 0)
      );
      line.style.opacity = '0.74';
    } catch (_) {
      line.textContent = '👥 statistiques momentanément indisponibles';
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
    setInterval(loadPublicStats, 30000);
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
