const hero = document.querySelector('.hero');
const header = document.querySelector('.sticky-header');
const menu = document.querySelector('#page-menu');
const price = document.querySelector('.price-dialog');
const formatPopup = document.querySelector('#format-popup');
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
  const scrollContent = dialog.querySelector('.format-panel-content');
  const panel = dialog.querySelector('.menu-panel');
  // Keep the native dialog's autofocus on its stationary viewport, rather than
  // asking the browser to reveal a focusable panel that is still offscreen.
  panel.style.right = '-100%';
  dialog.showModal();
  dialog.focus({preventScroll:true});
  dialog.scrollLeft = 0;
  dialog.scrollTop = 0;
  const from = -panel.offsetWidth;
  panel.style.right = `${from}px`;
  dialog.classList.add('has-opened');
  // Commit the outside position before activating the open class or animation.
  panel.getBoundingClientRect();
  if (scrollContent) scrollContent.scrollTop = 0;
  if (reducedMotion.matches) {
    panel.style.right = '0px';
    dialog.classList.add('is-open');
    panel.focus({preventScroll:true});
  } else requestAnimationFrame(() => {
    if (!dialog.open || closing || activeDialog !== dialog) return;
    if (scrollContent) scrollContent.scrollTop = 0;
    dialog.classList.add('is-open');
    panel.style.right = '0px';
    animatePanel(panel, from, 0, () => {
      if (dialog.open && !closing && document.activeElement === dialog) panel.focus({preventScroll:true});
    });
  });
  toggles.forEach(button => button.setAttribute('aria-expanded', String(dialog === menu)));
  if (dialog.id) document.querySelectorAll(`[aria-controls="${dialog.id}"]`).forEach(button => button.setAttribute('aria-expanded', 'true'));
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
  event.target.querySelector('.menu-panel').style.removeProperty('right');
  document.body.style.cssText = savedBodyStyle;
  activeDialog = null;
  closing = false;
  window.scrollTo(0, lockedY);
  toggles.forEach(button => button.setAttribute('aria-expanded', 'false'));
  if (event.target.id) document.querySelectorAll(`[aria-controls="${event.target.id}"]`).forEach(button => button.setAttribute('aria-expanded', 'false'));
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
document.querySelector('.format-learn').addEventListener('click', event => openDialog(formatPopup, event.currentTarget));
document.querySelector('.close-format').addEventListener('click', () => closeDialog(formatPopup));
for (const dialog of [menu, price, formatPopup]) {
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
// Keep the hover motion on one track, independent of the drawer's letter entrance.
function prepareWholeRoll(element, reveal=false) {
  const label=element.textContent.replace(/\s+/g,' ').trim();
  element.setAttribute('aria-label',label);
  element.classList.add('whole-roll-link');
  const clip=document.createElement('span');
  clip.className='whole-roll-mask';
  clip.setAttribute('aria-hidden','true');
  const track=document.createElement('span');
  track.className='whole-roll-track';
  const copy=document.createElement('span');
  copy.className='whole-roll-copy';
  if (reveal) {
    let index=0;
    label.split(' ').forEach((word,wordIndex)=>{
      if (wordIndex) copy.append(' ');
      const span=document.createElement('span');
      span.className='menu-reveal-word';
      span.textContent=word;
      splitLetters(span,{reveal:true});
      span.querySelectorAll('.letter-mask').forEach(mask=>{
        mask.style.setProperty('--char-index',index);
        mask.style.setProperty('--letter-index',index++);
      });
      copy.append(span);
    });
  } else copy.textContent=label;
  const duplicate=copy.cloneNode(true);
  duplicate.classList.add('whole-roll-duplicate');
  track.append(copy,duplicate);
  clip.append(track);
  element.replaceChildren(clip);
}
async function animateText() {
  await document.fonts.ready;
  for (const element of document.querySelectorAll('#championship-title, .event-date')) {
    splitLetters(element, { reveal: true, lines: true });
    element.classList.add('is-ready');
  }
  document.querySelectorAll('.hero-nav a,.price-link').forEach(link => prepareWholeRoll(link));
  document.querySelectorAll('.panel-nav a').forEach((link, row) => {
    link.style.setProperty('--row-index', row);
    prepareWholeRoll(link,true);
  });
}
animateText();

// Responsive schedule: accessible day tabs and independently revealed text/lines.
const schedule = document.querySelector('.schedule');
const scheduleMobile = matchMedia('(max-width:600px)');
const scheduleTabs = [...document.querySelectorAll('.schedule-tab')];
const scheduleDays = [...document.querySelectorAll('.schedule-day')];
// Editorial headings and map labels share the same measured per-letter reveal pipeline.
const scheduleText = [...document.querySelectorAll('[data-schedule-text]')];
const scheduleCopies = new Map(scheduleText.map(element => {
  const copy = element.cloneNode(true);
  copy.querySelectorAll('br').forEach(lineBreak => lineBreak.replaceWith('\n'));
  return [element, copy.textContent];
}));
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
  // Reveal remaining visible content at the document end,
  // even when there is not enough space below to scroll it to the line reveal threshold.
  const atPageEnd = window.scrollY + height >= document.documentElement.scrollHeight - 2;
  for (const element of document.querySelectorAll('.schedule [data-schedule-text], .schedule .schedule-rule, .prize-money [data-schedule-text], .prize-money .schedule-rule, .travel-guide [data-schedule-text], .lineup [data-schedule-text]')) {
    if (element.classList.contains('is-revealed') || element.closest('[hidden]') || !element.getClientRects().length) continue;
    const box = element.getBoundingClientRect();
    const isLine = element.classList.contains('schedule-rule');
    const threshold = isLine ? Math.max(0, height - 200) : height * .85;
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

// A finite nine-card track follows native vertical scrolling. CSS sticky pins
// the scene for exactly the distance from the first centered card to the last.
const judges = document.querySelector('.judges');
// Keep this unfinished section available in source without activating its scroll handlers.
if (judges && !judges.hidden) {
const judgesStage = judges.querySelector('.judges-stage');
const judgeTitle = document.querySelector('#judges-title');
const judgeCards = [...judges.querySelectorAll('.judge-card')];
const judgesDesktop = matchMedia('(min-width:1201px)');
const judgesReducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
let judgesVisible = false;
let judgesFrame = 0;
let judgesLastTime = 0;
let judgesStart = 0;
let judgesScale = 1;
let judgesTravel = 0;
let judgesCenter = 0;
let judgesActive = null;
// Each card retains its current expansion while the centered selection changes.
// The same value controls its scale and the space it adds around its neighbors.
const judgesExpansions = judgeCards.map(() => 0);
const judgeCaptions = judgeCards.map(card => card.querySelector('.judge-caption'));

function measureJudges() {
  if (!judgesDesktop.matches) return;
  // Read the rendered fluid width: it also fits shorter desktop viewports.
  judgesScale = judgeCards[0].getBoundingClientRect().width / 240;
  judgesTravel = (judgeCards.length - 1) * 340 * judgesScale;
  judgesCenter = judges.clientWidth / 2 - 120 * judgesScale;
  const pinnedTop = parseFloat(getComputedStyle(judgesStage).top);
  judgesStart = judges.getBoundingClientRect().top + (activeDialog ? lockedY : window.scrollY) - pinnedTop;
  judges.style.setProperty('--judges-travel', `${judgesTravel}px`);
  requestJudgesFrame();
}

function renderJudges(time) {
  judgesFrame = 0;
  const elapsed = judgesLastTime ? Math.min((time - judgesLastTime) / 1000, .05) : 0;
  judgesLastTime = time;
  const reduced = judgesReducedMotion.matches;
  const blend = reduced ? 1 : 1 - Math.exp(-elapsed * 10);
  const progress = Math.min(Math.max((activeDialog ? lockedY : window.scrollY) - judgesStart, 0), judgesTravel);
  const step = 340 * judgesScale;
  const position = step ? progress / step : 0;
  judgesActive = judgeCards[Math.min(Math.round(position), judgeCards.length - 1)];
  let settling = false;
  judgeCards.forEach((card, index) => {
    const target = card === judgesActive ? 1 : 0;
    card.classList.toggle('is-active', card === judgesActive);
    const value = judgesExpansions[index] + (target - judgesExpansions[index]) * blend;
    judgesExpansions[index] = Math.abs(target - value) < .0001 ? target : value;
    settling ||= judgesExpansions[index] !== target;
  });
  const positions = judgeCards.map((_, index) => judgesCenter + index * 340 * judgesScale - progress);
  const shiftAt = index => positions.reduce((sum, x, other) => other === index ? sum :
    sum + Math.sign(positions[index] - x) * 80 * judgesScale * judgesExpansions[other], 0);
  // Interpolate between neighboring centers, keeping both movement and scale
  // continuous while each settled card lands exactly in the viewport center.
  const left = Math.floor(position);
  const right = Math.min(left + 1, judgeCards.length - 1);
  const fraction = position - left;
  const anchorShift = shiftAt(left) * (1 - fraction) + shiftAt(right) * fraction;
  judgeCards.forEach((card, index) => {
    // The outgoing and incoming cards share their space throughout the transition.
    const x = positions[index] + shiftAt(index) - anchorShift;
    const expansion = judgesExpansions[index];
    card.style.transform = `translate3d(${x}px,0,0)`;
    card.style.setProperty('--judge-expansion', expansion);
    card.style.zIndex = card === judgesActive ? 3 : expansion > 0 ? 2 : 1;
    judgeCaptions[index].style.visibility = expansion > .001 ? 'visible' : 'hidden';
  });
  if (judgesVisible && !document.hidden && judgesDesktop.matches && settling) requestJudgesFrame();
  else judgesLastTime = 0;
}
function requestJudgesFrame() {
  if (!judgesFrame) judgesFrame = requestAnimationFrame(renderJudges);
}
const judgesObserver = new IntersectionObserver(entries => {
  judgesVisible = entries[0].isIntersecting;
  judgesLastTime = 0;
  if (judgesVisible) requestJudgesFrame();
}, {threshold:0});
judgesObserver.observe(judgesStage);
const judgesTitleObserver = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  judgeTitle.classList.add('is-ready');
  judgesTitleObserver.disconnect();
}, {rootMargin:'0px 0px -15% 0px'});
document.fonts.ready.then(() => {
  splitLetters(judgeTitle, {reveal:true});
  judgesTitleObserver.observe(judgeTitle);
});
window.addEventListener('scroll', requestJudgesFrame, {passive:true});
window.addEventListener('resize', measureJudges, {passive:true});
document.addEventListener('visibilitychange', () => {judgesLastTime = 0; requestJudgesFrame();});
judgesDesktop.addEventListener('change', measureJudges);
judgesReducedMotion.addEventListener('change', requestJudgesFrame);
// Schedule text wrapping can change the section's document offset on font load.
new ResizeObserver(measureJudges).observe(schedule);
document.fonts.ready.then(measureJudges);
measureJudges();

// One wheel/trackpad gesture selects one card. Momentum events belong to the
// same gesture; outside this pinned section the browser scrolls normally.
let judgesGestureLocked = false;
let judgesGestureTimer;
let judgesGestureTarget = 0;
let judgesGestureStarted = 0;
function releaseJudgesGesture() {
  if (Math.abs(window.scrollY - judgesGestureTarget) > 1 && Date.now() - judgesGestureStarted < 800) {
    judgesGestureTimer = setTimeout(releaseJudgesGesture, 50);
    return;
  }
  judgesGestureLocked = false;
}
function settleJudge(index) {
  judgesGestureTarget = judgesStart + Math.max(0, Math.min(index, judgeCards.length - 1)) * 340 * judgesScale;
  judgesGestureStarted = Date.now();
  judgesGestureLocked = true;
  clearTimeout(judgesGestureTimer);
  judgesGestureTimer = setTimeout(releaseJudgesGesture, 240);
  window.scrollTo({top:judgesGestureTarget, behavior:judgesReducedMotion.matches ? 'instant' : 'smooth'});
}
window.addEventListener('wheel', event => {
  if (!judgesDesktop.matches || activeDialog || event.ctrlKey || !event.cancelable || !event.deltaY) return;
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
  const y = window.scrollY;
  const end = judgesStart + judgesTravel;
  const inside = y >= judgesStart - 1 && y <= end + 1;
  if (inside && judgesGestureLocked) {
    event.preventDefault();
    clearTimeout(judgesGestureTimer);
    judgesGestureTimer = setTimeout(releaseJudgesGesture, 240);
    return;
  }
  // Land on the first/last card when a normal page scroll enters the section.
  if (y < judgesStart - 1 && delta > 0 && y + delta >= judgesStart) {
    event.preventDefault();
    settleJudge(0);
    return;
  }
  if (y > end + 1 && delta < 0 && y + delta <= end) {
    event.preventDefault();
    settleJudge(judgeCards.length - 1);
    return;
  }
  if (!inside || (y <= judgesStart + 1 && delta < 0) || (y >= end - 1 && delta > 0)) return;
  event.preventDefault();
  const index = Math.round((y - judgesStart) / (340 * judgesScale));
  settleJudge(index + Math.sign(delta));
}, {passive:false});
window.addEventListener('keydown', event => {
  if (!judgesDesktop.matches || activeDialog || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.target.closest('button,a,input,textarea,select,[contenteditable]')) return;
  const direction = ['ArrowDown','PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey) ? 1 :
    ['ArrowUp','PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0;
  if (!direction) return;
  const y = window.scrollY;
  const end = judgesStart + judgesTravel;
  if (y < judgesStart - 1 || y > end + 1 || (y <= judgesStart + 1 && direction < 0) || (y >= end - 1 && direction > 0)) return;
  event.preventDefault();
  if (!judgesGestureLocked) settleJudge(Math.round((y - judgesStart) / (340 * judgesScale)) + direction);
});

}

// Keep word wrapping responsive while sharing the existing per-letter masks.
const formatTitle = document.querySelector('#format-title');
const formatTitleObserver = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  formatTitle.classList.add('is-ready');
  formatTitleObserver.disconnect();
}, {rootMargin:'0px 0px -15% 0px'});
document.fonts.ready.then(() => {
  const label = formatTitle.textContent.trim();
  formatTitle.setAttribute('aria-label', label);
  const fragment = document.createDocumentFragment();
  label.split(/\s+/).forEach((word, index) => {
    if (index) fragment.append(document.createTextNode(' '));
    const span = document.createElement('span');
    span.className = 'format-word';
    span.textContent = word;
    splitLetters(span, {reveal:true});
    span.setAttribute('aria-hidden', 'true');
    fragment.append(span);
  });
  formatTitle.replaceChildren(fragment);
  formatTitle.querySelectorAll('.letter-mask').forEach((mask, index) => mask.style.setProperty('--letter-index', index));
  formatTitle.classList.add('is-prepared');
  formatTitleObserver.observe(formatTitle);
});

// The photo travels at 95.5% of the section's native scroll speed.
const formatSection = document.querySelector('.competition-format');
const formatPhoto = formatSection.querySelector('.format-photo');
let formatPhotoVisible = false;
let formatPhotoFrame = 0;
function updateFormatParallax() {
  formatPhotoFrame = 0;
  if (reducedMotion.matches) {
    formatPhoto.style.setProperty('--format-parallax', '0px');
    return;
  }
  if (!formatPhotoVisible || activeDialog) return;
  const box = formatSection.getBoundingClientRect();
  const limit = box.height * .055;
  const offset = Math.max(-limit, Math.min(limit, (header.offsetHeight - box.top) * .045));
  formatPhoto.style.setProperty('--format-parallax', `${offset}px`);
}
function queueFormatParallax() {
  if (!formatPhotoFrame) formatPhotoFrame = requestAnimationFrame(updateFormatParallax);
}
new IntersectionObserver(entries => {
  formatPhotoVisible = entries[0].isIntersecting;
  if (formatPhotoVisible) queueFormatParallax();
}).observe(formatSection);
window.addEventListener('scroll', () => {
  if (formatPhotoVisible) queueFormatParallax();
}, {passive:true});
window.addEventListener('resize', queueFormatParallax, {passive:true});
reducedMotion.addEventListener('change', queueFormatParallax);
