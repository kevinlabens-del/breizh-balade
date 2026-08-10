/* Breizh’ Balade V2.4.1 — avertissement marées non destructif.
   Les estimations de marée restent disponibles :
   - estimation actuelle ;
   - estimation à l’arrivée calculée à partir du temps de trajet lorsque la position est disponible.
   Ce fichier ajoute uniquement une mention de prudence et ne masque aucune donnée. */
(() => {
  const CREDIT_CLASS = 'tide-credit-visible';
  const CREDIT_TEXT = 'Estimation indicative : vérifie toujours les horaires officiels de marée, la météo et les consignes locales avant une sortie littorale.';

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
      paragraphs[0].textContent = 'Breizh’ Balade affiche une estimation de la marée actuelle et, lorsque ta position est activée, une estimation à ton arrivée calculée avec le temps de trajet.';
    }
    if (paragraphs[1]) {
      paragraphs[1].textContent = 'Ces valeurs sont indicatives : vérifie toujours les horaires officiels de marée, la météo et les consignes locales avant une sortie littorale.';
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
