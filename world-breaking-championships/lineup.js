(() => {
  const section = document.querySelector('#lineup');
  if (!section) return;
  const tabs = [...section.querySelectorAll('[role="tab"]')];
  const rails = [...section.querySelectorAll('.lineup-rail')];
  const previous = section.querySelector('.lineup-prev');
  const next = section.querySelector('.lineup-next');
  const status = section.querySelector('.lineup-status');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const timers = new Map();
  let selected = 0;
  let destination = null;
  let settleTimer;

  // Word wrappers retain natural line breaks; masks include glyph descenders.
  section.querySelectorAll('[data-lineup-text]').forEach(element => {
    const label = element.textContent;
    element.setAttribute('aria-label', label);
    element.replaceChildren();
    let index = 0;
    label.split(' ').forEach((word, wordIndex) => {
      if (wordIndex) element.append(' ');
      const wrapper = document.createElement('span');
      wrapper.className = 'lineup-word';
      wrapper.setAttribute('aria-hidden', 'true');
      for (const character of word) {
        const mask = document.createElement('span');
        mask.className = 'letter-mask';
        const letter = document.createElement('span');
        letter.className = 'lineup-letter';
        letter.style.setProperty('--char-index', index++);
        letter.textContent = character;
        mask.append(letter);
        wrapper.append(mask);
      }
      element.append(wrapper);
    });
  });

  function stops(rail) {
    const maximum = rail.scrollWidth - rail.clientWidth;
    const cards = [...rail.querySelectorAll('.lineup-card')];
    return [...new Set(cards.map(card => Math.min(maximum, card.offsetLeft - cards[0].offsetLeft)))];
  }
  function updateControls() {
    const rail = rails[selected];
    previous.hidden = rail.scrollLeft <= 2;
    next.hidden = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
  }
  function move(direction) {
    const rail = rails[selected];
    const current = destination ?? rail.scrollLeft;
    const positions = stops(rail);
    destination = direction > 0
      ? positions.find(position => position > current + 2) ?? positions.at(-1)
      : positions.findLast(position => position < current - 2) ?? 0;
    rail.scrollTo({left: destination, behavior: reduced.matches ? 'instant' : 'smooth'});
    status.textContent = `${tabs[selected].textContent.trim()}: ${Math.max(1, positions.indexOf(destination) + 1)} of ${positions.length}`;
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  const revealObserver = new IntersectionObserver(entries => {
    const entering = entries.filter(entry => entry.isIntersecting && !entry.target.closest('[hidden]'));
    entering.sort((a, b) => a.boundingClientRect.left - b.boundingClientRect.left);
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        clearTimeout(timers.get(entry.target));
        timers.delete(entry.target);
        entry.target.classList.remove('is-revealed');
      }
    }
    entering.forEach((entry, index) => {
      clearTimeout(timers.get(entry.target));
      const timer = setTimeout(async () => {
        const image = entry.target.querySelector('img');
        image.loading = 'eager';
        // Keep the orange mask until the incoming poster is decoded, including
        // when a mobile connection loads a card after its first intersection.
        try { if (!image.complete || !image.naturalWidth) await image.decode(); } catch { /* Preserve the caption if an image fails. */ }
        if (timers.get(entry.target) !== timer || entry.target.closest('[hidden]')) return;
        entry.target.classList.add('is-revealed');
        timers.delete(entry.target);
      }, reduced.matches ? 0 : index * 150);
      timers.set(entry.target, timer);
    });
  }, {threshold: .01, rootMargin: '0px 0px -100px 0px'});
  section.querySelectorAll('.lineup-card').forEach(card => revealObserver.observe(card));

  function selectTab(index, focus = false) {
    if (index !== selected) {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
      clearTimeout(settleTimer);
      destination = null;
      rails.forEach((rail, i) => {
        rail.hidden = i !== index;
        rail.querySelectorAll('.lineup-card').forEach(card => {
          card.classList.remove('is-revealed');
          revealObserver.unobserve(card);
        });
      });
      selected = index;
      rails[index].scrollTo({left: 0, behavior: 'instant'});
      rails[index].querySelectorAll('.lineup-card').forEach(card => revealObserver.observe(card));
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      status.textContent = tabs[index].textContent.trim();
      updateControls();
    }
    if (focus) tabs[index].focus({preventScroll: true});
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        selectTab(target, true);
      }
    });
  });
  rails.forEach(rail => {
    rail.addEventListener('scroll', () => {
      updateControls();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => { destination = null; }, 150);
    }, {passive: true});
    rail.addEventListener('pointerdown', () => { destination = null; }, {passive: true});
    rail.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
  });
  new ResizeObserver(() => { destination = null; updateControls(); }).observe(section);
  updateControls();
})();
