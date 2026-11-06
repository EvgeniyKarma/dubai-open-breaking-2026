import assert from 'node:assert/strict';

// Exercise the production pointer handlers without a browser/touch-device dependency.
class Element {
  constructor(name) {
    this.name=name; this.events=new Map(); this.attributes={}; this.values=new Map(); this.classes=new Set();
    this.style={setProperty:(k,v)=>this.values.set(k,v)};
    this.classList={contains:c=>this.classes.has(c),add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};
    this.dataset={}; this.children=new Map(); this.capture=new Set(); this.offsetWidth=80; this.offsetHeight=80;
  }
  addEventListener(type,fn) { this.events.set(type,[...(this.events.get(type)||[]),fn]); }
  emit(type,event={}) { for(const fn of this.events.get(type)||[]) fn(event); }
  setAttribute(k,v) { this.attributes[k]=v; }
  closest(selectors) { return selectors.split(',').some(s=>this.classes.has(s.replace('.','')))?this:null; }
  matches() { return false; }
  contains(target) { return this===target; }
  querySelector(selector) { return selector===':focus-visible'?null:(this.children.get(selector)||elements.get(selector)); }
  querySelectorAll(selector) { return selector==='.travel-location'?places:tabs; }
  hasPointerCapture(id) { return this.capture.has(id); }
  setPointerCapture(id) { this.capture.add(id); }
  releasePointerCapture(id) { this.capture.delete(id); }
  focus() {}
  getBoundingClientRect() {
    if(this.name==='art') {
      const size=Number.parseFloat(map.values.get('--map-size')||2400);
      return {width:size,height:size,left:220-size/2+Number.parseFloat(map.values.get('--map-x')||0),top:402-size/2+Number.parseFloat(map.values.get('--map-y')||0)};
    }
    return {width:440,height:804,left:0,top:0};
  }
}
const elements=new Map([
  ['.travel-map',new Element('map')],['.travel-map-art',new Element('art')],
  ['.travel-location',new Element('location')],['.travel-marker',new Element('marker')],
  ['.travel-tooltip',new Element('tooltip')],['.map-zoom-in',new Element('plus')],
  ['.map-zoom-out',new Element('minus')],['.map-reset',new Element('reset')]
]);
const map=elements.get('.travel-map'),marker=elements.get('.travel-marker'),location=elements.get('.travel-location');
const places=[location];
location.dataset={mapX:'0',mapY:'0'};
for (const [name,x,y] of [['ibis',-247,106],['novotel',-115,203]]) {
  const el=new Element(name),button=new Element(name+' marker'),tip=new Element(name+' tooltip');
  el.dataset={mapX:String(x),mapY:String(y),category:'hotels'};el.hidden=true;el.classList.add('travel-hotel');
  button.offsetWidth=40;button.offsetHeight=40;
  el.children.set('.travel-marker',button);el.children.set('.travel-tooltip',tip);places.push(el);
}
for(const [name,x,y] of [['world-trade-centre',-306,-23],['emirates-towers',-624,489],['max',125,-605]]) {
 const el=new Element(name),button=new Element(name+' marker'),tip=new Element(name+' tooltip');
 el.dataset={mapX:String(x),mapY:String(y),category:'transport',station:name};el.hidden=true;
 button.offsetWidth=40;button.offsetHeight=40;
 el.children.set('.travel-marker',button);el.children.set('.travel-tooltip',tip);places.push(el);
}
for(const [name,x,y] of [['cosmic',-417,-237],['black-coffee',-234,-300],['fumee',-377,-124],['andaliman',43,-217],['home-bakery',89,-164],['vana-nana',-110,201],['more-cafe',-296,209]]) {
 const el=new Element(name),button=new Element(name+' marker'),tip=new Element(name+' tooltip');
 el.dataset={mapX:String(x),mapY:String(y),category:'food'};el.hidden=true;
 button.offsetWidth=40;button.offsetHeight=40;
 el.children.set('.travel-marker',button);el.children.set('.travel-tooltip',tip);places.push(el);
}
const info=new Element('info'),infoToggle=new Element('info toggle');
info.hidden=true;infoToggle.hidden=true;info.classList.add('transport-info');infoToggle.classList.add('map-info-toggle');
elements.set('.transport-info',info);elements.set('.map-info-toggle',infoToggle);
const tabs=[new Element('venue tab'),new Element('hotels tab'),new Element('transport tab'),new Element('food tab')];
tabs[0].id='travel-venue-tab';tabs[1].id='travel-hotels-tab';tabs[2].id='travel-transport-tab';tabs[3].id='travel-food-tab';
elements.set('.travel-markers',new Element('panel'));
const plus=elements.get('.map-zoom-in'),minus=elements.get('.map-zoom-out'),reset=elements.get('.map-reset');
globalThis.window=new Element('window');
globalThis.document=new Element('document');
globalThis.innerWidth=440;
globalThis.matchMedia=()=>({matches:true});
globalThis.ResizeObserver=class { observe(){} };
const originalNow=Date.now;
let now=10000;
Date.now=()=>now;
await import('../world-breaking-championships/travel-map.js');
const value=key=>Number.parseFloat(map.values.get(key));
const pointer=(id,x,y,target=map)=>({button:0,pointerId:id,pointerType:'mouse',clientX:x,clientY:y,target});
const down=(id,x,y,target)=>map.emit('pointerdown',pointer(id,x,y,target));
const move=(id,x,y)=>window.emit('pointermove',pointer(id,x,y));
const up=id=>window.emit('pointerup',pointer(id,0,0));
assert.equal(value('--map-size'),2400);
assert.equal(plus.disabled,true);
down(1,100,400);move(1,200,450);up(1);
assert.equal(value('--map-x'),100);assert.equal(value('--map-y'),50);
assert.equal(map.classList.contains('is-dragging'),false);
let suppressed=false;
map.emit('click',{target:marker,preventDefault(){suppressed=true},stopPropagation(){}});
assert.equal(suppressed,true,'drag must not activate a venue click');
now+=500;reset.emit('click');
assert.equal(value('--map-x'),0);assert.equal(value('--map-size'),2400);
// Two fingers shrink around their midpoint; lifting one continues as a pan.
down(1,120,402);down(2,320,402);move(1,170,402);move(2,270,402);
assert.equal(value('--map-size'),1200);assert.equal(value('--map-x'),0);
move(1,190,422);move(2,290,422);up(1);move(2,310,442);up(2);
assert.equal(value('--map-size'),1200);assert.equal(value('--map-x'),40);assert.equal(value('--map-y'),40);
minus.emit('click');assert.equal(value('--map-size'),804);assert.equal(minus.disabled,true);
reset.emit('click');assert.equal(value('--map-size'),2400);assert.equal(plus.disabled,true);
// Touch focus alone does not open details during a gesture; a tap does.
down(3,220,380,marker);location.emit('focusin');
assert.equal(location.classList.contains('is-open'),false);
up(3);now+=500;marker.emit('click');assert.equal(location.classList.contains('is-open'),true);
document.emit('pointerdown',{target:map});assert.equal(location.classList.contains('is-open'),false);
// Cancellation releases captures and leaves the next gesture usable.
down(4,100,400);move(4,200,400);window.emit('pointercancel',pointer(4,200,400));
assert.equal(map.capture.size,0);assert.equal(map.classList.contains('is-dragging'),false);
// Category changes reset user pan; Hotels fits all markers on mobile.
reset.emit('click');tabs[1].emit('click');
assert.equal(tabs[1].attributes['aria-selected'],'true');assert.equal(places[1].hidden,false);
assert.ok(value('--map-x')>0);
const initialHotels=value('--map-x');
down(5,100,400);move(5,160,400);up(5);assert.notEqual(value('--map-x'),initialHotels);
tabs[1].emit('click');assert.equal(value('--map-x'),initialHotels);
places[1].children.get('.travel-marker').emit('click');assert.equal(places[1].classList.contains('is-open'),true);
marker.emit('click');assert.equal(places[1].classList.contains('is-open'),false);assert.equal(location.classList.contains('is-open'),true);
reset.emit('click');assert.equal(value('--map-x'),0);assert.equal(value('--map-y'),0);assert.equal(value('--map-size'),2400);
assert.equal(tabs[1].attributes['aria-selected'],'true');assert.equal(places[1].hidden,false);
tabs[0].emit('click');assert.equal(places[1].hidden,true);assert.equal(value('--map-x'),0);
// Info auto-opens once per module/page lifetime, and is exclusive with station tooltips.
tabs[2].emit('click');assert.equal(info.hidden,false);assert.equal(infoToggle.hidden,false);
assert.equal(places[1].hidden,true);assert.ok(places.filter(p=>p.dataset.category==='transport').every(p=>!p.hidden));
assert.equal(places[3].children.get('.travel-marker').values.get('--marker-delay'),'300ms');
const transportX=value('--map-x');assert.ok(transportX>0);
map.emit('pointerdown',pointer(8,100,300,info));move(8,100,350);up(8);assert.equal(value('--map-x'),transportX);
document.emit('pointerdown',{target:map});assert.equal(info.hidden,true);
tabs[0].emit('click');assert.equal(infoToggle.hidden,true);
tabs[2].emit('click');assert.equal(info.hidden,true);
infoToggle.emit('click');assert.equal(info.hidden,false);
places[3].children.get('.travel-marker').emit('click');assert.equal(info.hidden,true);assert.equal(places[3].classList.contains('is-open'),true);
infoToggle.emit('click');assert.equal(info.hidden,false);assert.equal(places[3].classList.contains('is-open'),false);
info.emit('keydown',{key:'Escape',stopPropagation(){}});assert.equal(info.hidden,true);
reset.emit('click');assert.equal(value('--map-x'),0);assert.equal(value('--map-y'),0);assert.equal(tabs[2].attributes['aria-selected'],'true');
tabs[1].emit('click');assert.ok(places.filter(p=>p.dataset.category==='transport').every(p=>p.hidden));assert.equal(infoToggle.hidden,true);
// Food reuses category isolation, fixed marker sizing, stagger and venue reset.
tabs[3].emit('click');
const food=places.filter(p=>p.dataset.category==='food');
assert.equal(food.length,7);assert.ok(food.every(p=>!p.hidden));
assert.ok(places.filter(p=>['hotels','transport'].includes(p.dataset.category)).every(p=>p.hidden));
assert.equal(infoToggle.hidden,true);assert.equal(info.hidden,true);
assert.equal(food[6].children.get('.travel-marker').values.get('--marker-delay'),'2100ms');
assert.ok(value('--map-size')<2400);
food[0].children.get('.travel-marker').emit('click');assert.equal(food[0].classList.contains('is-open'),true);
food[1].children.get('.travel-marker').emit('click');assert.equal(food[0].classList.contains('is-open'),false);assert.equal(food[1].classList.contains('is-open'),true);
reset.emit('click');assert.equal(value('--map-x'),0);assert.equal(value('--map-y'),0);assert.equal(value('--map-size'),2400);assert.equal(tabs[3].attributes['aria-selected'],'true');
tabs[0].emit('click');assert.ok(food.every(p=>p.hidden));
// Phone input: one finger belongs to native page scroll, two fingers pan/pinch.
reset.emit('click');
const phoneEvent=(points,type='touchmove')=>({type,target:map,touches:points.map(([clientX,clientY])=>({clientX,clientY})),prevented:false,preventDefault(){this.prevented=true;}});
const singleStart=phoneEvent([[100,400]],'touchstart');map.emit('touchstart',singleStart);
const singleMove=phoneEvent([[180,460]]);map.emit('touchmove',singleMove);
assert.equal(singleStart.prevented,false);assert.equal(singleMove.prevented,false);
assert.equal(value('--map-x'),0,'one finger must not move the phone map');
map.emit('pointerdown',{...pointer(99,100,400),pointerType:'touch'});
window.emit('pointermove',{...pointer(99,180,460),pointerType:'touch'});
assert.equal(value('--map-x'),0,'phone touch must not enter the mouse/tablet pointer path');
const twoStart=phoneEvent([[120,402],[320,402]],'touchstart');map.emit('touchstart',twoStart);
assert.equal(twoStart.prevented,true);
const twoPan=phoneEvent([[160,422],[360,422]]);map.emit('touchmove',twoPan);
assert.equal(twoPan.prevented,true);assert.equal(value('--map-x'),40);assert.equal(value('--map-y'),20);
map.emit('touchend',phoneEvent([[160,422]],'touchend'));
const leftover=phoneEvent([[190,442]]);map.emit('touchmove',leftover);
assert.equal(leftover.prevented,false);assert.equal(value('--map-x'),40,'lifting one finger ends map movement');
map.emit('touchend',phoneEvent([],'touchend'));reset.emit('click');
map.emit('touchstart',phoneEvent([[120,402],[320,402]],'touchstart'));
map.emit('touchmove',phoneEvent([[170,402],[270,402]]));
assert.equal(value('--map-size'),1200,'phone two-finger pinch retains zoom');
map.emit('touchcancel',phoneEvent([],'touchcancel'));
assert.equal(map.classList.contains('is-dragging'),false);
// Tablet touch dragging still follows the original pointer controller.
globalThis.innerWidth=1024;reset.emit('click');
map.emit('pointerdown',{...pointer(101,100,400),pointerType:'touch'});
window.emit('pointermove',{...pointer(101,180,400),pointerType:'touch'});
window.emit('pointerup',{...pointer(101,180,400),pointerType:'touch'});
assert.equal(value('--map-x'),80);
Date.now=originalNow;
console.log('Travel map gestures: mouse/tablet pan, phone two-finger pan/pinch, native one-finger scroll, tap suppression and reset passed.');
