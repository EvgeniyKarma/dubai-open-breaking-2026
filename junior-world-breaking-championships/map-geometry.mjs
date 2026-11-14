export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function constrainMap({scale, x, y}, {width, height, base}) {
  const minimum = Math.min(1, Math.max(width, height) / base);
  scale = clamp(scale, minimum, 1);
  const halfX = Math.max(0, (base * scale - width) / 2);
  const halfY = Math.max(0, (base * scale - height) / 2);
  return {scale, x:clamp(x, -halfX, halfX), y:clamp(y, -halfY, halfY)};
}

// Preserve the geographic point under the gesture's initial center.
export function zoomMap(state, scale, from, to, dimensions) {
  const next = constrainMap({...state, scale}, dimensions);
  const ratio = next.scale / state.scale;
  return constrainMap({scale:next.scale,
    x:to.x - dimensions.width / 2 - (from.x - dimensions.width / 2 - state.x) * ratio,
    y:to.y - dimensions.height / 2 - (from.y - dimensions.height / 2 - state.y) * ratio
  }, dimensions);
}

export function locationOffset(point, state, base) {
  const ratio = base * state.scale / 2400;
  return {x:state.x + point.x * ratio, y:state.y + point.y * ratio};
}

// Fit geographic anchors together with their fixed-size marker bounds.
export function fitMapLocations(points, dimensions, {side=16, top=80, bottom=120}={}) {
  const minimum = Math.min(1,Math.max(dimensions.width,dimensions.height)/dimensions.base);
  function bounds(scale) {
    const ratio=dimensions.base*scale/2400;
    return {
      left:Math.min(...points.map(p=>p.x*ratio+p.left)),
      right:Math.max(...points.map(p=>p.x*ratio+p.right)),
      top:Math.min(...points.map(p=>p.y*ratio+p.top)),
      bottom:Math.max(...points.map(p=>p.y*ratio+p.bottom))
    };
  }
  let low=minimum, high=1;
  for(let i=0;i<24;i++) {
    const mid=(low+high)/2, b=bounds(mid);
    if(b.right-b.left<=dimensions.width-side*2 && b.bottom-b.top<=dimensions.height-top-bottom) low=mid;
    else high=mid;
  }
  const scale=high>1-.00001?1:low;
  const b=bounds(scale);
  return constrainMap({scale,x:-(b.left+b.right)/2,
    y:(top-bottom)/2-(b.top+b.bottom)/2},dimensions);
}
