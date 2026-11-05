const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source=readFileSync('world-breaking-championships/championships.js','utf8');
const start=source.indexOf('function navigateToSection(');
const end=source.indexOf('// Separate wrappers',start);
const calls=[];
const target={scrollIntoView:options=>calls.push(['scroll',options])};
function link(hash,drawer=false){return{hash,closest:()=>drawer?{}:null,addEventListener(type,fn){this.click=fn;}};}
const links=[link('#schedule'),link('#lineup'),link('#contact',true),link('#top')];
const context={
 reducedMotion:{matches:false},navigationTarget:null,menu:{},
 document:{getElementById:id=>['schedule','lineup','contact','top'].includes(id)?target:null,querySelectorAll:()=>links},
 history:{pushState:(_state,_title,hash)=>calls.push(['hash',hash])},
 closeDialog:()=>calls.push(['close']),
};
vm.runInNewContext(source.slice(start,end),context);
function click(element,options={}){
 let prevented=false;
 element.click({button:0,preventDefault(){prevented=true;},...options});
 return prevented;
}
for(const element of [links[0],links[1],links[3]]){
 calls.length=0;
 assert(click(element));
 assert.equal(calls[0][1],element.hash);
 assert.equal(calls[1][1].behavior,'smooth','all direct section links must glide');
}
calls.length=0;
assert(click(links[2]));
assert.equal(context.navigationTarget,'#contact');
assert.deepEqual(calls,[['close']],'drawer navigation waits until the body is unlocked');
for(const options of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{button:1}]){
 calls.length=0;
 assert(!click(links[0],options));
 assert.equal(calls.length,0,'modified clicks retain native link behavior');
}
context.reducedMotion.matches=true;
calls.length=0;click(links[0]);
assert.equal(calls[1][1].behavior,'instant');
console.log('Section navigation behavior: passed');
