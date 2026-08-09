/* Breizh’ Balade — statistiques anonymes V2.3.2
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
      await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      // Les statistiques ne doivent jamais gêner l'utilisation de l'application.
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

  startHeartbeat();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      send('heartbeat');
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
  });
  window.addEventListener('pagehide', () => send('heartbeat'));
})();
