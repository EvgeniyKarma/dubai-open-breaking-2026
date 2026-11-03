import assert from 'node:assert/strict';

// Exercise the production pointer handlers without a browser/touch-device dependency.
class Element {
  constructor(name) {
    this.name=name; this.events=new Map(); this.attributes={}; this.values=new Map(); this.classes=new Set();
    this.style={setProperty:(k,v)=>this.values.set(k,v)};
    this.classList={contains:c=>this.classes.has(c),add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};
    this.capture=new Set(); this.offsetWidth=80; this.offsetHeight=80;
  }
  addEventListener(type,fn) { this.events.set(type,[...(this.events.get(type)||[]),fn]); }
  emit(type,event={}) { for(const fn of this.events.get(type)||[]) fn(event); }
  setAttribute(k,v) { this.attributes[k]=v; }
  closest() { return null; }
  matches() { return false; }
  contains(target) { return this===target; }
  querySelector(selector) { return selector===':focus-visible'?null:elements.get(selector); }
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
const pointer=(id,x,y,target=map)=>({button:0,pointerId:id,pointerType:'touch',clientX:x,clientY:y,target});
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
Date.now=originalNow;
console.log('Travel map gestures: touch pan, pinch, finger handoff, tap suppression, bounds and reset passed.');
