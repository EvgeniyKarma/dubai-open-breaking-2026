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

// Responsive schedule: accessible day tabs and independently revealed text/lines.
const schedule = document.querySelector('.schedule');
const scheduleMobile = matchMedia('(max-width:600px)');
const scheduleTabs = [...document.querySelectorAll('.schedule-tab')];
const scheduleDays = [...document.querySelectorAll('.schedule-day')];
const scheduleText = [...schedule.querySelectorAll('[data-schedule-text]')];
const scheduleCopies = new Map(scheduleText.map(element => [element,
  element.innerHTML.replace(/<br\s*\/?\s*>/gi, '\n')
]));
let selectedDay = 0;
let scheduleFrame = 0;
let scheduleReady = false;
let scheduleWidth = window.innerWidth;
let scheduleResizeTimer;
const scheduleTextWidths = new WeakMap();

// Preserve measured word wrapping while revealing individual letters, as in the hero.
function prepareScheduleText(element) {
  const width = element.clientWidth;
  // Keep existing letters (and their animation state) when switching days.
  // Rebuild masks only for a new element or when its available width changes.
  if (element.classList.contains('is-prepared') && scheduleTextWidths.get(element) === width) return;
  const fragment = document.createDocumentFragment();
  const words = [];
  scheduleCopies.get(element).split('\n').forEach((text, index) => {
    if (index) fragment.append(document.createElement('br'));
    text.trim().split(/\s+/).forEach((word, wordIndex) => {
      if (wordIndex) fragment.append(' ');
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      span.textContent = word;
      fragment.append(span);
      words.push(span);
    });
  });
  element.replaceChildren(fragment);
  const lines = [];
  for (const word of words) {
    const y = word.offsetTop;
    if (!lines.length || Math.abs(lines[lines.length - 1].y - y) > 1) lines.push({ y, words: [] });
    lines[lines.length - 1].words.push(word.textContent);
  }
  const output = document.createDocumentFragment();
  const accessibleCopy = document.createElement('span');
  accessibleCopy.className = 'schedule-sr-copy';
  accessibleCopy.textContent = scheduleCopies.get(element).replace(/\s+/g, ' ').trim();
  output.append(accessibleCopy);
  let letterIndex = 0;
  lines.forEach(line => {
    const mask = document.createElement('span');
    mask.className = 'schedule-text-mask';
    mask.setAttribute('aria-hidden', 'true');
    const content = document.createElement('span');
    content.className = 'schedule-text-line';
    for (const character of line.words.join(' ')) {
      const letterMask = document.createElement('span');
      letterMask.className = 'letter-mask';
      const letter = document.createElement('span');
      letter.className = 'reveal-letter schedule-letter';
      letter.style.setProperty('--letter-index', letterIndex++);
      letter.textContent = character === ' ' ? '\u00a0' : character;
      letterMask.append(letter);
      content.append(letterMask);
    }
    mask.append(content);
    output.append(mask);
  });
  element.replaceChildren(output);
  element.classList.add('is-prepared');
  scheduleTextWidths.set(element, width);
}
function syncScheduleLayout() {
  const previousScrollY = window.scrollY;
  scheduleDays.forEach((day, index) => {
    day.hidden = scheduleMobile.matches && index !== selectedDay;
    day.setAttribute('aria-labelledby', scheduleMobile.matches ? scheduleTabs[index].id : `schedule-date-${18 + index}`);
    if (scheduleMobile.matches) day.setAttribute('role', 'tabpanel');
    else day.removeAttribute('role');
  });
  scheduleTabs.forEach((tab, index) => {
    tab.setAttribute('aria-selected', String(index === selectedDay));
    tab.tabIndex = index === selectedDay ? 0 : -1;
  });
  if (scheduleReady) {
    scheduleText.forEach(element => {
      if (!element.closest('[hidden]')) prepareScheduleText(element);
    });
    // Measuring hidden-to-visible panels can briefly shrink the document.
    // Restore the reading position after all line masks have their final height.
    window.scrollTo(0, previousScrollY);
    queueScheduleReveal();
  }
}
function revealSchedule(replayVisible = false) {
  scheduleFrame = 0;
  if (!scheduleReady || activeDialog) return;
  const height = window.innerHeight;
  // The current page ends here: reveal remaining visible content at its end,
  // even when there is not enough space below to scroll it to screen center.
  const atPageEnd = window.scrollY + height >= document.documentElement.scrollHeight - 2;
  for (const element of schedule.querySelectorAll('[data-schedule-text], .schedule-rule')) {
    if (element.classList.contains('is-revealed') || element.closest('[hidden]')) continue;
    const box = element.getBoundingClientRect();
    const isLine = element.classList.contains('schedule-rule');
    const threshold = isLine ? height / 2 : height * .85;
    if (box.top <= threshold || ((replayVisible || atPageEnd) && box.top < height)) element.classList.add('is-revealed');
  }
}
function queueScheduleReveal() {
  if (!scheduleFrame) scheduleFrame = requestAnimationFrame(() => revealSchedule());
}
function selectScheduleDay(index, moveFocus = false) {
  if (index === selectedDay) {
    if (moveFocus) scheduleTabs[index].focus({ preventScroll: true });
    return;
  }
  selectedDay = index;
  const day = scheduleDays[index];
  day.querySelectorAll('.is-revealed').forEach(element => element.classList.remove('is-revealed'));
  syncScheduleLayout();
  // Explicitly commit the reset so revisiting a tab restarts its mask animations.
  day.getBoundingClientRect();
  if (scheduleFrame) cancelAnimationFrame(scheduleFrame);
  scheduleFrame = requestAnimationFrame(() => revealSchedule(true));
  if (moveFocus) scheduleTabs[index].focus({ preventScroll: true });
}
scheduleTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectScheduleDay(index));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % scheduleTabs.length;
    if (event.key === 'ArrowLeft') next = (index + scheduleTabs.length - 1) % scheduleTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = scheduleTabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectScheduleDay(next, true);
  });
});
window.addEventListener('scroll', queueScheduleReveal, { passive: true });
window.addEventListener('resize', () => {
  queueScheduleReveal();
  if (window.innerWidth === scheduleWidth) return;
  scheduleWidth = window.innerWidth;
  clearTimeout(scheduleResizeTimer);
  scheduleResizeTimer = setTimeout(syncScheduleLayout, 120);
});
scheduleMobile.addEventListener('change', syncScheduleLayout);
syncScheduleLayout();
document.fonts.ready.then(() => {
  scheduleReady = true;
  syncScheduleLayout();
});
