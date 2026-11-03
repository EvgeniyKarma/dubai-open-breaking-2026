import {clamp, constrainMap, zoomMap, locationOffset, fitMapLocations} from './map-geometry.mjs?v=20261103-travel-hotels';

const map = document.querySelector('.travel-map');
const art = map.querySelector('.travel-map-art');
const places = [...map.querySelectorAll('.travel-location')].map(element => ({
  element, marker:element.querySelector('.travel-marker'), tooltip:element.querySelector('.travel-tooltip'),
  point:{x:Number(element.dataset.mapX),y:Number(element.dataset.mapY)}
}));
const tabs = [...map.querySelectorAll('.travel-tab:not(:disabled)')];
const panel = map.querySelector('.travel-markers');
let category = 'venue';
let activePlace = null;
const plus = map.querySelector('.map-zoom-in');
const minus = map.querySelector('.map-zoom-out');
const reset = map.querySelector('.map-reset');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
const pointers = new Map();
let dimensions = {width:0,height:0,base:2400};
let state = {scale:1,x:0,y:0};
let gesture;
let moved = false;
let closeTimer;
let animationTimer;
let suppressClickUntil = 0;

function positionTooltip(place) {
  const {marker,tooltip,offset} = place;
  const x = dimensions.width / 2 + offset.x;
  const y = dimensions.height / 2 + offset.y;
  const top = clamp(y - marker.offsetHeight - 208, 16, Math.max(16, dimensions.height - 216)) - y;
  const left = clamp(x + 24, 12, Math.max(12, dimensions.width - 292)) - x;
  tooltip.style.setProperty('--tooltip-top', `${top}px`);
  tooltip.style.setProperty('--tooltip-left', `${left}px`);
  tooltip.style.setProperty('--bridge-left', `${Math.min(-marker.offsetWidth / 2 - left, 0)}px`);
  tooltip.style.setProperty('--bridge-width', `${Math.max(280, marker.offsetWidth / 2 - left) - Math.min(-marker.offsetWidth / 2 - left, 0)}px`);
  tooltip.style.setProperty('--bridge-height', `${Math.max(0, -top - 194)}px`);
}
function render() {
  state = constrainMap(state, dimensions);
  map.style.setProperty('--map-size', `${dimensions.base * state.scale}px`);
  map.style.setProperty('--map-x', `${state.x}px`);
  map.style.setProperty('--map-y', `${state.y}px`);
  plus.disabled = state.scale >= 1 - .00001;
  minus.disabled = state.scale <= Math.max(dimensions.width, dimensions.height) / dimensions.base + .00001;
  for (const place of places) {
    place.offset = locationOffset(place.point,state,dimensions.base);
    place.element.style.setProperty('--location-x', `${place.offset.x}px`);
    place.element.style.setProperty('--location-y', `${place.offset.y}px`);
    positionTooltip(place);
  }
}
function showTooltip(open, place=activePlace) {
  clearTimeout(closeTimer);
  if (open && (!place || place.element.hidden || (moved && pointers.size))) return;
  for (const item of places) {
    const visible=open && item===place;
    item.element.classList.toggle('is-open', visible);
    item.marker.setAttribute('aria-expanded', String(visible));
    item.tooltip.inert = !visible;
  }
  activePlace=open?place:null;
  if (open) positionTooltip(place);
}
function startingView() {
  if (category !== 'hotels' || innerWidth > 600) return {scale:1,x:0,y:0};
  return fitMapLocations(places.map(p=>({...p.point,
    left:-p.marker.offsetWidth/2,right:p.marker.offsetWidth/2,
    top:p.element.classList.contains('travel-hotel')?-20:-75,
    bottom:p.element.classList.contains('travel-hotel')?20:6
  })), dimensions);
}
function selectCategory(tab, moveFocus=false) {
  if (pointers.size) endGesture();
  category=tab.id==='travel-hotels-tab'?'hotels':'venue';
  showTooltip(false);
  for (const item of tabs) {
    const selected=item===tab;
    item.setAttribute('aria-selected',String(selected));
    item.tabIndex=selected?0:-1;
  }
  panel.setAttribute('aria-labelledby',tab.id);
  for (const place of places) place.element.hidden=place.element.dataset.category==='hotels' && category!=='hotels';
  if (moveFocus) tab.focus({preventScroll:true});
  animate(startingView());
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectCategory(tab));
  tab.addEventListener('keydown',event=>{
    let next;
    if (event.key==='ArrowRight') next=(index+1)%tabs.length;
    if (event.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
    if (event.key==='Home') next=0;
    if (event.key==='End') next=tabs.length-1;
    if (next===undefined) return;
    event.preventDefault();
    selectCategory(tabs[next],true);
  });
});
function interruptAnimation() {
  clearTimeout(animationTimer);
  if (map.classList.contains('is-animating')) {
    const frame = map.getBoundingClientRect();
    const current = art.getBoundingClientRect();
    state = {scale:current.width / dimensions.base,
      x:current.left + current.width / 2 - frame.left - frame.width / 2,
      y:current.top + current.height / 2 - frame.top - frame.height / 2};
  }
  map.classList.remove('is-animating');
  render();
}
function animate(next) {
  showTooltip(false);
  interruptAnimation();
  // Commit the current geometry before transitioning both map and marker together.
  art.getBoundingClientRect();
  if (!reducedMotion.matches) map.classList.add('is-animating');
  state = next;
  render();
  animationTimer = setTimeout(() => map.classList.remove('is-animating'), 360);
}
function resize() {
  if (pointers.size) endGesture();
  interruptAnimation();
  const frame = map.getBoundingClientRect();
  const widthChanged=frame.width!==dimensions.width;
  dimensions = {width:frame.width, height:frame.height,
    base:Math.max(innerWidth <= 1200 ? 2400 : innerWidth * 1.25, frame.width, frame.height)};
  if (widthChanged && category==='hotels') state=startingView();
  render();
}
plus.addEventListener('click', () => animate(zoomMap(state, state.scale + .25,
  {x:dimensions.width/2,y:dimensions.height/2}, {x:dimensions.width/2,y:dimensions.height/2}, dimensions)));
minus.addEventListener('click', () => animate(zoomMap(state, state.scale - .25,
  {x:dimensions.width/2,y:dimensions.height/2}, {x:dimensions.width/2,y:dimensions.height/2}, dimensions)));
reset.addEventListener('click', () => animate({scale:1,x:0,y:0}));

function localPoint(event) {
  const box = map.getBoundingClientRect();
  return {x:event.clientX-box.left,y:event.clientY-box.top};
}
function rebase() {
  const points = [...pointers.values()];
  if (points.length >= 2) {
    const [a,b] = points;
    gesture = {state:{...state}, center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}, distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
  } else if (points.length) gesture = {state:{...state}, start:points[0]};
}
function capturePointers() {
  for (const id of pointers.keys()) {
    if (!map.hasPointerCapture(id)) map.setPointerCapture(id);
  }
}
function endGesture() {
  const ids = [...pointers.keys()];
  pointers.clear();
  gesture = null;
  map.classList.remove('is-dragging');
  for (const id of ids) if (map.hasPointerCapture(id)) map.releasePointerCapture(id);
}
map.addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.target.closest('.travel-map-controls,.travel-tabs,.travel-tooltip')) return;
  if (!pointers.size) {
    interruptAnimation();
    moved = false;
  }
  pointers.set(event.pointerId, localPoint(event));
  rebase();
  if (pointers.size >= 2) {
    moved = true;
    showTooltip(false);
    capturePointers();
  }
});
window.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, localPoint(event));
  const points = [...pointers.values()];
  if (points.length >= 2) {
    const [a,b] = points;
    const center = {x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    state = zoomMap(gesture.state, gesture.state.scale * Math.hypot(a.x-b.x,a.y-b.y) / gesture.distance,
      gesture.center, center, dimensions);
  } else {
    const delta = {x:points[0].x-gesture.start.x,y:points[0].y-gesture.start.y};
    if (!moved && Math.hypot(delta.x,delta.y) < 6) return;
    state = {...gesture.state,x:gesture.state.x+delta.x,y:gesture.state.y+delta.y};
  }
  moved = true;
  showTooltip(false);
  map.classList.add('is-dragging');
  capturePointers();
  render();
});
function releasePointer(event) {
  if (!pointers.has(event.pointerId)) return;
  if (moved) suppressClickUntil = Date.now() + 400;
  pointers.delete(event.pointerId);
  if (map.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
  if (pointers.size) rebase();
  else endGesture();
}
window.addEventListener('pointerup', releasePointer);
window.addEventListener('pointercancel', releasePointer);
window.addEventListener('blur', endGesture);
map.addEventListener('click', event => {
  if (Date.now() >= suppressClickUntil || event.target.closest('.travel-map-controls,.travel-tabs')) return;
  event.preventDefault();
  event.stopPropagation();
}, true);
for (const place of places) {
  const {element,marker}=place;
  element.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && !pointers.size && Date.now() >= suppressClickUntil) showTooltip(true,place);
  });
  element.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    closeTimer = setTimeout(() => {
      if (activePlace===place && !element.querySelector(':focus-visible')) showTooltip(false);
    },160);
  });
  element.addEventListener('focusin', () => {
    if (!pointers.size || element.querySelector(':focus-visible')) showTooltip(true,place);
  });
  element.addEventListener('focusout', event => {
    if (activePlace===place && !element.contains(event.relatedTarget) && !element.matches(':hover')) showTooltip(false);
  });
  marker.addEventListener('click', () => showTooltip(true,place));
  element.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    marker.focus({preventScroll:true});
    showTooltip(false);
  });
}
document.addEventListener('pointerdown', event => {
  if (activePlace && !activePlace.element.contains(event.target)) showTooltip(false);
});
map.addEventListener('keydown', event => {
  if (event.target !== map) return;
  const offsets = {ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};
  if (!offsets[event.key]) return;
  event.preventDefault();
  const [x,y] = offsets[event.key];
  animate({...state,x:state.x+x,y:state.y+y});
});
new ResizeObserver(resize).observe(map);
resize();
