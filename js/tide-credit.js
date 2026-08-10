/*
===============================================================================
BREIZH’ BALLADE — js/tide-credit.js
===============================================================================

V2.1.6.11 — Crédit api-maree.fr non répétitif.

Objectif :
- ne plus répéter le crédit dans chaque sous-bloc ;
- afficher une seule mention par zone marée complète ;
- conserver la mention dans la page Infos.
===============================================================================
*/

(() => {
  const CREDIT_TEXT = "Données de marée calculées via api-maree.fr, à partir de composantes harmoniques issues de l’atlas Ifremer / PREVIMER.";
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

/*
===============================================================================
Correctif mobile — compteur de visiteurs
===============================================================================
Sur petit écran, les deux premières statistiques restent sur la première ligne
et la troisième (utilisateur en ligne) passe proprement sur une seconde ligne.
Le correctif détecte le compteur même s'il est ajouté dynamiquement.
===============================================================================
*/
(() => {
  const STYLE_ID = 'bb-visitor-counter-mobile-fix';

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .bb-visitor-counter-fix{
        width:100% !important;
        max-width:100% !important;
        margin-inline:auto !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:center !important;
        gap:3px !important;
        text-align:center !important;
        overflow:visible !important;
        white-space:normal !important;
        line-height:1.3 !important;
        font-size:clamp(10px,2.8vw,13px) !important;
      }

      .bb-visitor-counter-fix .bb-visitor-counter-top{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:4px !important;
        max-width:100% !important;
        white-space:nowrap !important;
      }

      .bb-visitor-counter-fix .bb-visitor-counter-bottom{
        display:block !important;
        width:100% !important;
        text-align:center !important;
        white-space:nowrap !important;
      }

      @media (max-width:390px){
        .bb-visitor-counter-fix{
          font-size:10px !important;
        }
        .bb-visitor-counter-fix .bb-visitor-counter-top{
          gap:3px !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const normalizeText = value => String(value || '').replace(/\s+/g, ' ').trim();

  const looksLikeVisitorCounter = element => {
    const text = normalizeText(element?.textContent).toLowerCase();
    return text.includes('visiteur') &&
           text.includes('lancement') &&
           text.includes("aujourd") &&
           text.includes('en ligne');
  };

  const findVisitorCounter = () => {
    const hero = document.querySelector('.hero');
    if (!hero) return null;

    const candidates = Array.from(hero.querySelectorAll('*')).filter(looksLikeVisitorCounter);
    return candidates.find(element =>
      !Array.from(element.children).some(looksLikeVisitorCounter)
    ) || null;
  };

  const formatVisitorCounter = () => {
    ensureStyle();

    const counter = findVisitorCounter();
    if (!counter) return;

    counter.classList.add('bb-visitor-counter-fix');

    const alreadyFormatted =
      counter.querySelector(':scope > .bb-visitor-counter-top') &&
      counter.querySelector(':scope > .bb-visitor-counter-bottom');

    if (alreadyFormatted) return;

    const parts = normalizeText(counter.textContent)
      .split(/\s*(?:·|•|\|)\s*/)
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length < 3) return;

    const top = document.createElement('span');
    top.className = 'bb-visitor-counter-top';

    const first = document.createElement('span');
    first.textContent = parts[0];

    const separator = document.createElement('span');
    separator.textContent = '·';
    separator.setAttribute('aria-hidden', 'true');

    const second = document.createElement('span');
    second.textContent = parts[1];

    const bottom = document.createElement('span');
    bottom.className = 'bb-visitor-counter-bottom';
    bottom.textContent = parts.slice(2).join(' · ');

    top.append(first, separator, second);
    counter.replaceChildren(top, bottom);
    counter.setAttribute('aria-label', parts.join(' ; '));
  };

  let timer = null;
  const scheduleVisitorFix = () => {
    clearTimeout(timer);
    timer = setTimeout(formatVisitorCounter, 60);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleVisitorFix);
  } else {
    scheduleVisitorFix();
  }

  new MutationObserver(scheduleVisitorFix).observe(document.documentElement, {
    childList:true,
    subtree:true,
    characterData:true
  });
})();
