const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync('world-breaking-championships/championships.js','utf8');
const buttons=[{},{}];
buttons.forEach(button=>{button.addEventListener=(_type,fn)=>button.click=()=>fn({currentTarget:button});});
const menu={};const price={};const originalTrigger={focus(){throw Error('handoff must not focus the closing drawer');}};
const closed=[];const opened=[];const scrolls=[];
const context={closing:false,activeDialog:menu,menu,price,opener:originalTrigger,queuedDialog:null,
 document:{body:{style:{cssText:'position:fixed'}},querySelectorAll:selector=>selector==='[data-open-price]'?buttons:[]},
 closeDialog:dialog=>closed.push(dialog),openDialog:(dialog,trigger)=>opened.push({dialog,trigger}),
 drawerAnimation:null,savedBodyStyle:'',lockedY:240,toggles:[],navigationTarget:null,
 window:{scrollTo:(x,y)=>scrolls.push([x,y])},updateHeader(){},
};
vm.runInNewContext(source.slice(source.indexOf("document.querySelectorAll('[data-open-price]')"),source.indexOf("document.querySelector('.close-price')")),context);
buttons[1].click();
assert.equal(closed[0],menu);
assert.equal(opened.length,0,'wait for the menu close before opening price');
assert.equal(context.queuedDialog.dialog,price);
assert.equal(context.queuedDialog.trigger,originalTrigger);
vm.runInNewContext(source.slice(source.indexOf('function afterClose('),source.indexOf('toggles.forEach(button => button.addEventListener')),context);
context.afterClose({target:{id:'page-menu',classList:{remove(){}},querySelector:()=>({style:{removeProperty(){}}})}});
assert.equal(context.document.body.style.cssText,'','the old body lock is released before handoff');
assert.equal(opened[0].dialog,price);
assert.equal(opened[0].trigger,originalTrigger);
assert.equal(context.queuedDialog,null);
assert.deepEqual(scrolls,[[0,240]]);
context.activeDialog=null;buttons[0].click();
assert.equal(opened[1].trigger,buttons[0],'hero entry retains its own focus target');
context.closing=true;buttons[1].click();
assert.equal(opened.length,2,'ignore additional price clicks during a closing transition');
console.log('Registration price entry and drawer handoff: passed');
