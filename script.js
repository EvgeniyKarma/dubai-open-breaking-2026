// Wait for the intended typeface before revealing the title.
async function revealTitle() {
  await document.fonts.ready;
  let index = 0;
  document.querySelectorAll('.title-line').forEach(line => {
    const fragment = document.createDocumentFragment();
    for (const character of line.textContent) {
      const mask = document.createElement('span');
      mask.className = 'title-letter-mask';
      mask.setAttribute('aria-hidden', 'true');
      const letter = document.createElement('span');
      letter.className = 'title-letter';
      letter.style.setProperty('--letter-index', index++);
      letter.textContent = character === ' ' ? '\u00a0' : character;
      mask.append(letter);
      fragment.append(mask);
    }
    line.replaceChildren(fragment);
  });
  document.querySelector('.page-title').classList.add('is-ready');
}
revealTitle();
