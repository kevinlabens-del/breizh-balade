(() => {
  const initAdvancedSearchAccordion = () => {
    const panel = document.querySelector('.search-panel');
    if (!panel || panel.dataset.advancedSearchReady === 'true') return;

    panel.dataset.advancedSearchReady = 'true';
    panel.classList.add('advanced-search-panel');

    const content = document.createElement('div');
    content.className = 'advanced-search-content';
    content.id = 'advancedSearchContent';

    while (panel.firstChild) content.appendChild(panel.firstChild);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'advanced-search-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', content.id);
    toggle.innerHTML = '<span class="advanced-search-toggle__label">🔎 Recherche avancée</span><span class="advanced-search-toggle__chevron" aria-hidden="true">⌄</span>';

    content.hidden = true;
    panel.append(toggle, content);

    const setOpen = open => {
      toggle.setAttribute('aria-expanded', String(open));
      content.hidden = !open;
      panel.classList.toggle('is-open', open);
      const chevron = toggle.querySelector('.advanced-search-toggle__chevron');
      if (chevron) chevron.textContent = open ? '⌃' : '⌄';
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    setOpen(false);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedSearchAccordion, { once: true });
  } else {
    initAdvancedSearchAccordion();
  }
})();
