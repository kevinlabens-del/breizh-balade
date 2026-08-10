/* Breizh’ Balade V2.4.0 — sécurité des informations de marée.
   Les anciennes estimations locales calculées sont neutralisées tant qu'une source fiable
   n'est pas intégrée. L'application préfère afficher une absence de donnée plutôt qu'une
   estimation pouvant être interprétée comme une information opérationnelle. */
(() => {
  const STYLE_ID = 'bb-tide-safety-style';
  const SAFE_TEXT = 'Les estimations automatiques de marée sont temporairement désactivées. Vérifie les horaires officiels et les consignes locales avant toute sortie littorale.';

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .tide-strip{display:none!important}
      .bb-tide-safe-message{
        margin:0;
        padding:12px 13px;
        border-radius:16px;
        border:1px solid rgba(255,255,255,.14);
        background:rgba(255,255,255,.06);
        line-height:1.5;
      }
      .bb-tide-safe-message strong{display:block;margin-bottom:4px}
    `;
    document.head.appendChild(style);
  };

  const neutralizeTidePanel = panel => {
    if (!panel || panel.dataset.bbTideSafe === 'true') return;
    panel.dataset.bbTideSafe = 'true';
    panel.innerHTML = `
      <div class="panel-title-row"><span>🌊</span><h3>Marées</h3></div>
      <p class="bb-tide-safe-message">
        <strong>Données automatiques non affichées</strong>
        ${SAFE_TEXT}
      </p>
    `;
  };

  const updateInfoCard = card => {
    if (!card || card.dataset.bbTideSafe === 'true') return;
    card.dataset.bbTideSafe = 'true';
    const title = card.querySelector('h3');
    if (title) title.textContent = 'Données de marée';
    const paragraphs = card.querySelectorAll('p:not(.eyebrow)');
    if (paragraphs[0]) paragraphs[0].textContent = 'Les estimations automatiques sont temporairement désactivées tant qu’une source fiable n’est pas intégrée.';
    if (paragraphs[1]) paragraphs[1].textContent = 'Pour toute sortie littorale, vérifie les horaires officiels et les consignes locales avant de partir.';
  };

  const applySafety = () => {
    ensureStyle();
    document.querySelectorAll('.tide-strip').forEach(el => el.remove());
    document.querySelectorAll('.tide-panel, .maree-panel, [data-tide-root], [data-maree-root]').forEach(neutralizeTidePanel);
    document.querySelectorAll('.tide-credit-info-card').forEach(updateInfoCard);
  };

  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(applySafety, 50);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once:true });
  } else {
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
})();
