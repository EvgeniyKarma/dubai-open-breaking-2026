import assert from 'node:assert/strict';
import {constrainMap, zoomMap, fitMapLocations, locationOffset} from '../world-breaking-championships/map-geometry.mjs';

for (const [width,height,base] of [[1872,952,2400],[976,1190,2400],[440,804,2400],[320,488,2400]]) {
  const frame = {width,height,base};
  const initial = {scale:1,x:0,y:0};
  const minimum = Math.max(width,height)/base;
  assert.equal(constrainMap({...initial,scale:2},frame).scale,1);
  assert.equal(constrainMap({...initial,scale:0},frame).scale,minimum);
  for (const scale of [minimum,.5,.75,1]) {
    for (const x of [-10000,10000]) for (const y of [-10000,10000]) {
      const s=constrainMap({scale,x,y},frame);
      const size=base*s.scale;
      assert.ok(size>=width && size>=height);
      assert.ok(Math.abs(s.x)<=(size-width)/2 + 1e-8);
      assert.ok(Math.abs(s.y)<=(size-height)/2 + 1e-8);
    }
  }
  const center={x:width/2,y:height/2};
  const zoomed=zoomMap(initial,.75,center,center,frame);
  assert.equal(zoomed.x,0);
  assert.equal(zoomed.y,0);
}
// Pinch keeps the chosen geographic point under the moving fingers.
const frame={width:440,height:804,base:2400};
const start={scale:1,x:100,y:-40};
const from={x:170,y:280}, to={x:190,y:300};
const result=zoomMap(start,.5,from,to,frame);
assert.equal((from.x-frame.width/2-start.x)/start.scale,(to.x-frame.width/2-result.x)/result.scale);
assert.equal((from.y-frame.height/2-start.y)/start.scale,(to.y-frame.height/2-result.y)/result.scale);
// Maximum-scale clamping still follows a two-finger pan.
const capped=zoomMap({scale:1,x:0,y:0},1.5,{x:220,y:402},{x:250,y:422},frame);
assert.deepEqual(capped,{scale:1,x:30,y:20});
console.log('Travel map geometry: bounds, zoom anchors and pinch limits passed.');

for (const [width,height] of [[408,804],[288,488]]) {
 const dimensions={width,height,base:2400};
 const points=[{x:0,y:0,left:-40,right:40,top:-75,bottom:6},{x:-247,y:106,left:-20,right:20,top:-20,bottom:20},{x:-115,y:203,left:-20,right:20,top:-20,bottom:20}];
 const fitted=fitMapLocations(points,dimensions);
 for(const point of points) {
  const offset=locationOffset(point,fitted,2400);
  assert.ok(width/2+offset.x+point.left>=16-.001);
  assert.ok(width/2+offset.x+point.right<=width-16+.001);
  assert.ok(height/2+offset.y+point.top>=80-.001);
  assert.ok(height/2+offset.y+point.bottom<=height-120+.001);
 }
}
console.log('Hotel framing: venue and both fixed-size markers fit mobile control/tab insets.');
