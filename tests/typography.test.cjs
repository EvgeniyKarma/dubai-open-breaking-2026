const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const context={};vm.runInNewContext(readFileSync('typography.js','utf8'),context);
const {protect}=context.DOBTypography;
const n='\u00a0';
for(const [input,expected] of [
 ['5 rounds (1 routine)',`5${n}rounds (1${n}routine)`],
 ['DJs & Hosts', `DJs &${n}Hosts`],
 ['Top-16', 'Top\u201116'],
 ['Top 16',`Top${n}16`],
 ['5 vs 5',`5${n}vs${n}5`],
 ['$ 10 000', `$${n}10${n}000`],
 ['USD 1 000', `USD${n}1${n}000`],
 ['USD 20/day',`USD${n}20/day`],
 ['to the final',`to${n}the${n}final`],
 ['Battle format for crews (5 vs 5):',`Battle format for${n}crews (5${n}vs${n}5):`],
 ['на сцене и в зале',`на${n}сцене и${n}в${n}зале`],
]){assert.equal(protect(input),expected);assert.equal(protect(expected),expected,'typography must be idempotent');}
assert.equal(protect('Line one\nLine two'),'Line one\nLine two');
assert.equal(protect('info@dubaiopenbreaking.com'),'info@dubaiopenbreaking.com');
console.log('Nonbreaking typography: passed');
