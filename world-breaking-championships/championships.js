const hero = document.querySelector('.hero');
const header = document.querySelector('.sticky-header');
const menu = document.querySelector('#page-menu');
const price = document.querySelector('.price-dialog');
const toggles = document.querySelectorAll('[aria-controls="page-menu"]');
const compact = matchMedia('(max-width:1200px)');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
let scrollFrame = 0;
let lockedY = 0;
let savedBodyStyle = '';
let opener;
let activeDialog;
let closing = false;
let navigationTarget;
let drawerAnimation;

function updateHeader() {
  scrollFrame = 0;
  const threshold = compact.matches ? header.offsetHeight : hero.offsetHeight;
  const visible = (activeDialog ? lockedY : window.scrollY) >= threshold;
  header.classList.toggle('is-visible', visible);
  header.inert = !visible;
  header.setAttribute('aria-hidden', String(!visible));
}
function queueHeader() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeader);
}
window.addEventListener('scroll', queueHeader, { passive: true });
window.addEventListener('resize', queueHeader);
compact.addEventListener('change', queueHeader);
updateHeader();

function openDialog(dialog, trigger) {
  if (activeDialog) return;
  activeDialog = dialog;
  closing = false;
  opener = trigger;
  lockedY = window.scrollY;
  savedBodyStyle = document.body.style.cssText;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedY}px`;
  document.body.style.width = '100%';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
  dialog.showModal();
  dialog.querySelector('.menu-panel').focus({ preventScroll: true });
  dialog.classList.add('is-open', 'has-opened');
  const panel = dialog.querySelector('.menu-panel');
  // Explicit keyframes also animate the first render after showModal().
  // A CSS transition may skip its initial state when the dialog was display:none.
  if (!reducedMotion.matches) animatePanel(panel, -panel.offsetWidth, 0);
  toggles.forEach(button => button.setAttribute('aria-expanded', String(dialog === menu)));
}
function animatePanel(panel, from, to, onFinish) {
  const animation = panel.animate([{ right: `${from}px` }, { right: `${to}px` }], {
    duration: 550,
    easing: 'ease-in-out',
    fill: 'both',
  });
  drawerAnimation = animation;
  animation.finished.then(() => {
    if (drawerAnimation === animation) drawerAnimation = null;
    animation.cancel();
    onFinish?.();
  }).catch(() => {}); // Cancellation is expected when reversing an opening panel.
}
function closeDialog(dialog) {
  if (!dialog.open || closing) return;
  closing = true;
  const panel = dialog.querySelector('.menu-panel');
  const currentRight = parseFloat(getComputedStyle(panel).right);
  drawerAnimation?.cancel();
  drawerAnimation = null;
  dialog.classList.remove('is-open');
  if (reducedMotion.matches) dialog.close();
  else animatePanel(panel, currentRight, -panel.offsetWidth, () => dialog.close());
}
function afterClose(event) {
  drawerAnimation?.cancel();
  drawerAnimation = null;
  event.target.classList.remove('is-open', 'has-opened');
  document.body.style.cssText = savedBodyStyle;
  activeDialog = null;
  closing = false;
  window.scrollTo(0, lockedY);
  toggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
  updateHeader();
  opener?.focus({ preventScroll: true });
  if (navigationTarget) {
    const hash = navigationTarget;
    navigationTarget = null;
    const target = document.querySelector(hash);
    history.pushState(null, '', hash);
    target?.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
}
toggles.forEach(button => button.addEventListener('click', () => openDialog(menu, button)));
document.querySelector('.close-menu').addEventListener('click', () => closeDialog(menu));
document.querySelector('[data-open-price]').addEventListener('click', event => openDialog(price, event.currentTarget));
document.querySelector('.close-price').addEventListener('click', () => closeDialog(price));
for (const dialog of [menu, price]) {
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(dialog); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
  dialog.addEventListener('close', afterClose);
}
document.querySelectorAll('.panel-nav a').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  navigationTarget = link.hash;
  closeDialog(menu);
}));

// Separate wrappers let the entrance reveal and hover roll run independently.
function splitLetters(element, { roll = false, reveal = false, lines = false } = {}) {
  const label = element.textContent.replace(/\s+/g, ' ').trim();
  const lineTexts = lines ? element.innerHTML.split(/<br\s*\/?\s*>/i).map(text => text.trim()) : [label];
  element.setAttribute('aria-label', lines ? lineTexts.join(' ') : label);
  const fragment = document.createDocumentFragment();
  let index = 0;
  for (const text of lineTexts) {
    const line = document.createElement('span');
    line.setAttribute('aria-hidden', 'true');
    if (lines) line.className = 'text-line';
    for (const character of text) {
      const mask = document.createElement('span');
      mask.className = 'letter-mask';
      mask.style.setProperty('--letter-index', index);
      mask.style.setProperty('--char-index', index++);
      let container = mask;
      if (reveal) {
        const entrance = document.createElement('span');
        entrance.className = 'reveal-letter';
        mask.append(entrance);
        container = entrance;
      }
      if (roll) {
        const clip = document.createElement('span');
        clip.className = 'roll-mask';
        const letter = document.createElement('span');
        letter.className = 'roll-letter';
        letter.dataset.char = character === ' ' ? '\u00a0' : character;
        letter.textContent = letter.dataset.char;
        clip.append(letter);
        container.append(clip);
      } else container.textContent = character === ' ' ? '\u00a0' : character;
      line.append(mask);
    }
    fragment.append(line);
  }
  element.replaceChildren(fragment);
}
async function animateText() {
  await document.fonts.ready;
  for (const element of document.querySelectorAll('#championship-title, .event-date')) {
    splitLetters(element, { reveal: true, lines: true });
    element.classList.add('is-ready');
  }
  document.querySelectorAll('.hero-nav a').forEach(link => splitLetters(link, { roll: true }));
  document.querySelectorAll('.panel-nav a').forEach((link, row) => {
    link.style.setProperty('--row-index', row);
    splitLetters(link, { roll: true, reveal: true });
  });
}
animateText();
