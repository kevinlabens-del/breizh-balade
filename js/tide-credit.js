/* Breizh’ Balade V2.4.3 — information de source des marées, sans observateur global. */
(() => {
  if (window.__BREIZH_TIDE_CREDIT_LOADED__) return;
  window.__BREIZH_TIDE_CREDIT_LOADED__ = true;

  const ensureStyle = () => {
    if (document.getElementById('bb-tide-credit-style')) return;
    const style = document.createElement('style');
    style.id = 'bb-tide-credit-style';
    style.textContent = `
      .tide-strip{display:none!important}
      .local-tide-details{display:none!important}
      .tide-credit-visible{margin:10px 0 0;color:var(--muted,#6f817c);font-size:.78rem;line-height:1.45}
    `;
    document.head.appendChild(style);
  };

  const updateInfoCard = () => {
    const card = document.querySelector('.tide-credit-info-card');
    if (!card || card.dataset.bbTideInfoUpdated === '1') return;
    card.dataset.bbTideInfoUpdated = '1';
    const paragraphs = card.querySelectorAll('p:not(.eyebrow)');
    if (paragraphs[0]) paragraphs[0].textContent = 'Breizh’ Balade utilise api-maree.fr pour afficher une prévision de marée actualisée au moment de la consultation et, si ta position est autorisée, à l’heure d’arrivée estimée.';
    if (paragraphs[1]) paragraphs[1].textContent = 'Ces données restent indicatives et ne remplacent pas les informations officielles du SHOM ni les consignes locales de sécurité.';
  };

  ensureStyle();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateInfoCard, { once: true });
  else updateInfoCard();
})();
