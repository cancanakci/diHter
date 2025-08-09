function colorDistanceSq(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function findNearestPaletteIndex(r, g, b, paletteFloat) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < paletteFloat.length; i += 1) {
    const p = paletteFloat[i];
    const d = colorDistanceSq({ r, g, b }, p);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

module.exports = { findNearestPaletteIndex };

