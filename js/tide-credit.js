/* Breizh’ Balade V2.4.2 — crédits et sécurité des données de marée. */
(() => {
  const CREDIT_CLASS = 'tide-credit-visible';
  const CREDIT_TEXT = 'Données fournies par api-maree.fr à partir de composantes harmoniques Ifremer / PREVIMER. Valeurs indicatives : vérifie aussi les informations officielles du SHOM, la météo et les consignes locales avant une sortie littorale.';

  const ensureStyle = () => {
    if (document.getElementById('bb-tide-credit-style')) return;
    const style = document.createElement('style');
    style.id = 'bb-tide-credit-style';
    style.textContent = `
      .${CREDIT_CLASS}{
        margin:10px 0 0;
        color:var(--muted, #6f817c);
        font-size:.78rem;
        line-height:1.45;
      }
    `;
    document.head.appendChild(style);
  };

  const updateInfoCard = card => {
    if (!card) return;
    const paragraphs = card.querySelectorAll('p:not(.eyebrow)');
    if (paragraphs[0]) {
      paragraphs[0].textContent = 'Breizh’ Balade interroge api-maree.fr pour afficher la hauteur de marée prévue au moment de la consultation et, lorsque ta position est activée, à l’heure d’arrivée estimée selon le temps de trajet.';
    }
    if (paragraphs[1]) {
      paragraphs[1].textContent = 'Données calculées à partir de composantes harmoniques Ifremer / PREVIMER. Elles restent indicatives et ne remplacent pas les informations officielles du SHOM ni les consignes locales de sécurité.';
    }
  };

  const addCredit = panel => {
    if (!panel || panel.querySelector(`:scope > .${CREDIT_CLASS}`)) return;
    const credit = document.createElement('p');
    credit.className = CREDIT_CLASS;
    credit.textContent = CREDIT_TEXT;
    panel.appendChild(credit);
  };

  const apply = () => {
    ensureStyle();
    document.querySelectorAll('.tide-panel, .maree-panel, [data-tide-root], [data-maree-root]').forEach(addCredit);
    document.querySelectorAll('.tide-credit-info-card').forEach(updateInfoCard);
  };

  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(apply, 60);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once:true });
  } else {
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
})();
