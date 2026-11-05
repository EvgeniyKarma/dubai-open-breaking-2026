const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// Exercise the shipped carousel controller, including deferred image decoding.
let timerId = 0;
const timers = new Map();
const frames = [];
const windowEvents = {};
const rails = [];
function card(rail, left, right) {
  const classes = new Set();
  const image = {complete:true, naturalWidth:960};
  return {
    bounds:{left,right,top:200,bottom:640}, offsetLeft:left,
    classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c)},
    closest:()=>rail.hidden ? rail : null,
    getBoundingClientRect(){return this.bounds;},
    querySelector:()=>image,
    image,
  };
}
function rail() {
  const r = {hidden:false,scrollLeft:0,scrollWidth:1000,clientWidth:440,events:{},
    getBoundingClientRect:()=>({left:0,right:440}),
    addEventListener(name,fn){this.events[name]=fn;},
    querySelectorAll:()=>r.cards,
    scrollTo({left}){this.scrollLeft=left;},
  };
  r.cards = [card(r,16,316),card(r,376,676)];
  return r;
}
rails.push(rail(),rail()); rails[1].hidden = true;
const tabs = rails.map((r,i)=>({textContent:i?'DJs & Hosts':'Judges',events:{},
  addEventListener(name,fn){this.events[name]=fn;},setAttribute(){},focus(){}}));
const previous={addEventListener(){}};
const next={addEventListener(){}};
const section={querySelectorAll:s=>s==='[role="tab"]'?tabs:s==='.lineup-rail'?rails:[],
 querySelector:s=>s==='.lineup-prev'?previous:s==='.lineup-next'?next:{}};
// A second carousel remains below the viewport but must keep independent state.
const otherRails = [rail(), rail()];
otherRails[1].hidden = true;
otherRails.forEach(r=>r.cards.forEach(c=>{c.bounds.top=2000;c.bounds.bottom=2440;}));
const otherTabs = otherRails.map((r,i)=>({textContent:i?'Winners':'Crews',events:{},
 addEventListener(name,fn){this.events[name]=fn;},setAttribute(){},focus(){}}));
const otherSection={
 querySelectorAll:s=>s==='[role="tab"]'?otherTabs:s==='.lineup-rail'?otherRails:[],
 querySelector:()=>({addEventListener(){}}),
};
vm.runInNewContext(readFileSync('world-breaking-championships/lineup.js','utf8'),{
 document:{querySelectorAll:()=>[section,otherSection]},matchMedia:()=>({matches:false}),
 innerWidth:440,innerHeight:956,
 setTimeout(fn,delay){timers.set(++timerId,{fn,delay});return timerId;},
 clearTimeout(id){timers.delete(id);},
 requestAnimationFrame(fn){frames.push(fn);return frames.length;},
 ResizeObserver:class{observe(){}},
 window:{addEventListener(name,fn){(windowEvents[name]??=[]).push(fn);}},
});
function flushFrames(){while(frames.length)frames.shift()();}
// Keep browser timer handles available while callbacks execute.
async function runTimers(){for(const [id,t] of [...timers]){await t.fn();timers.delete(id);}}
(async()=>{
 flushFrames();
 assert.equal(timers.size,1,'a partial edge card must not schedule a reveal');
 await runTimers();
 assert(rails[0].cards[0].classList.contains('is-revealed'));
 assert(!rails[0].cards[1].classList.contains('is-revealed'));
 otherTabs[1].events.click();flushFrames();
 assert(!rails[0].hidden,'switching the second carousel must not change the first');
 assert(!otherRails[1].hidden);
 rails[0].cards[0].bounds={left:-350,right:-50,top:200,bottom:640};
 rails[0].cards[1].bounds={left:16,right:316,top:200,bottom:640};
 rails[0].events.scroll();flushFrames();await runTimers();
 assert(rails[0].cards[0].classList.contains('is-revealed'),'leaving must preserve the revealed state');
 assert(rails[0].cards[1].classList.contains('is-revealed'),'a newly fully visible card reveals');
 rails[0].cards[0].bounds={left:16,right:316,top:200,bottom:640};
 rails[0].events.scroll();flushFrames();
 assert.equal([...timers.values()].filter(t=>t.delay!==150).length,0,'returning to a revealed card must not queue an animation');
 await runTimers();
 tabs[1].events.click();flushFrames();await runTimers();
 assert(!rails[0].cards[0].classList.contains('is-revealed'),'switching tabs resets reveal state');
 assert.equal(rails[1].scrollLeft,0);
 assert(rails[1].cards[0].classList.contains('is-revealed'));
 // Pending decode from the old tab must not reveal a card after a tab switch.
 let decodeDone;
 rails[1].cards[1].bounds={left:16,right:316,top:200,bottom:640};
 rails[1].cards[1].image.complete=false;
 rails[1].cards[1].image.decode=()=>new Promise(resolve=>{decodeDone=resolve;});
 windowEvents.scroll.forEach(fn=>fn());flushFrames();
 const pending=[...timers.values()].find(t=>t.delay===0);
 const decoding=pending.fn();
 tabs[0].events.click();flushFrames();
 decodeDone();await decoding;
 assert(!rails[1].cards[1].classList.contains('is-revealed'),'stale image decode cannot reveal a hidden tab');
 await runTimers();
 assert(rails[0].cards[0].classList.contains('is-revealed'),'returning to the tab replays its first card');
 assert(!otherRails[1].hidden,'switching the first carousel must not reset the second');
 console.log('Carousel reveal lifecycle and section independence: passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
