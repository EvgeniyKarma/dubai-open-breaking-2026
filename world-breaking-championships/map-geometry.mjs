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
