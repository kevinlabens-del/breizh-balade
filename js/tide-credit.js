/*
===============================================================================
BREIZH’ BALLADE — js/tide-credit.js
===============================================================================

V2.3.0 — Mention de sécurité marée non répétitive.

Objectif :
- ne plus répéter le crédit dans chaque sous-bloc ;
- afficher une seule mention par zone marée complète ;
- conserver la mention dans la page Infos.
===============================================================================
*/

(() => {
  const CREDIT_TEXT = "Estimation locale indicative : vérifie toujours les horaires officiels de marée et les consignes locales avant une sortie littorale.";
  const CREDIT_CLASS = 'tide-credit-visible';
  const CREDIT_DONE_ATTR = 'data-tide-credit-container-done';

  const removeDuplicateCredits = () => {
    const credits = Array.from(document.querySelectorAll(`.${CREDIT_CLASS}`));

    credits.forEach(credit => {
      const inInfos = credit.closest('.tide-credit-info-card');
      if (inInfos) return;

      const container =
        credit.closest('.tide-section, .maree-section, .tide-wrapper, .maree-wrapper, .tide-card, .maree-card, [data-tide-root], [data-maree-root]') ||
        credit.closest('article, section, .panel');

      if (!container) return;

      const creditsInContainer = Array.from(container.querySelectorAll(`.${CREDIT_CLASS}`))
        .filter(item => !item.closest('.tide-credit-info-card'));

      creditsInContainer.forEach((item, index) => {
        if (index > 0) item.remove();
      });
    });
  };

  const textLooksLikeTide = element => {
    const text = (element.textContent || '').toLowerCase();
    return text.includes('marée maintenant') ||
           text.includes('marée à ton arrivée') ||
           text.includes('pleine mer') ||
           text.includes('marée basse') ||
           text.includes('marée haute') ||
           text.includes('coefficient') ||
           text.includes('hauteur');
  };

  const findMainTideContainers = () => {
    const selectors = [
      '.tide-section',
      '.maree-section',
      '.tide-wrapper',
      '.maree-wrapper',
      '[data-tide-root]',
      '[data-maree-root]',
      '.tide-card',
      '.maree-card',
      '.tide-panel',
      '.maree-panel'
    ];

    const containers = new Set();

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => containers.add(element));
    });

    // Secours : chercher uniquement les grands panneaux qui contiennent vraiment plusieurs infos de marée.
    document.querySelectorAll('article.panel, section.panel, .panel, article, section').forEach(element => {
      if (element.closest('.tide-credit-info-card')) return;
      const text = (element.textContent || '').toLowerCase();
      const score =
        (text.includes('marée maintenant') ? 1 : 0) +
        (text.includes('marée à ton arrivée') ? 1 : 0) +
        (text.includes('coefficient') ? 1 : 0) +
        (text.includes('hauteur') ? 1 : 0);

      if (score >= 2) containers.add(element);
    });

    return Array.from(containers).filter(textLooksLikeTide);
  };

  const makeCredit = () => {
    const credit = document.createElement('p');
    credit.className = CREDIT_CLASS;
    credit.textContent = CREDIT_TEXT;
    return credit;
  };

  const ensureOneCredit = () => {
    removeDuplicateCredits();

    const containers = findMainTideContainers();

    containers.forEach(container => {
      if (container.closest('.tide-credit-info-card')) return;

      const existing = Array.from(container.querySelectorAll(`.${CREDIT_CLASS}`))
        .filter(item => !item.closest('.tide-credit-info-card'));

      if (existing.length > 0) {
        existing.forEach((item, index) => {
          if (index > 0) item.remove();
        });
        container.setAttribute(CREDIT_DONE_ATTR, 'true');
        return;
      }

      container.insertAdjacentElement('beforeend', makeCredit());
      container.setAttribute(CREDIT_DONE_ATTR, 'true');
    });
  };

  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(ensureOneCredit, 80);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true });
})();
