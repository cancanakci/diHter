const { findNearestPaletteIndex } = require('./quantize');

function to01(v) { return v / 255; }
function from01(v) { return Math.max(0, Math.min(255, Math.round(v * 255))); }

function getPixel01(rgba, width, x, y) {
  const i = (y * width + x) * 4;
  return [to01(rgba[i]), to01(rgba[i + 1]), to01(rgba[i + 2]), rgba[i + 3] / 255];
}

function setPixel01(rgba, width, x, y, r, g, b) {
  const i = (y * width + x) * 4;
  rgba[i] = from01(r);
  rgba[i + 1] = from01(g);
  rgba[i + 2] = from01(b);
}

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function nearestOnly(rgba, width, height, palette, opts) {
  const out = Array.from({ length: height }, () => new Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel01(rgba, width, x, y);
      const idx = findNearestPaletteIndex(r, g, b, palette.float);
      out[y][x] = palette.entries[idx].id;
      const p = palette.float[idx];
      setPixel01(rgba, width, x, y, p.r, p.g, p.b);
    }
  }
  return out;
}

function diffuse(rgba, width, height, palette, opts, kernel, divisor, serpentine = true) {
  const out = Array.from({ length: height }, () => new Array(width));
  const strength = opts.strength == null ? 1 : Math.max(0, Math.min(1, opts.strength));
  for (let y = 0; y < height; y++) {
    const leftToRight = serpentine ? (y % 2 === 0) : true;
    const xStart = leftToRight ? 0 : width - 1;
    const xEnd = leftToRight ? width : -1;
    const xStep = leftToRight ? 1 : -1;
    for (let x = xStart; x !== xEnd; x += xStep) {
      const [r, g, b] = getPixel01(rgba, width, x, y);
      const idx = findNearestPaletteIndex(r, g, b, palette.float);
      out[y][x] = palette.entries[idx].id;
      const p = palette.float[idx];
      const er = r - p.r;
      const eg = g - p.g;
      const eb = b - p.b;
      setPixel01(rgba, width, x, y, p.r, p.g, p.b);
      for (const k of kernel) {
        const nx = x + (leftToRight ? k.dx : -k.dx);
        const ny = y + k.dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const i = (ny * width + nx) * 4;
        const factor = (k.w / divisor) * strength;
        rgba[i] = from01(clamp01(to01(rgba[i]) + er * factor));
        rgba[i + 1] = from01(clamp01(to01(rgba[i + 1]) + eg * factor));
        rgba[i + 2] = from01(clamp01(to01(rgba[i + 2]) + eb * factor));
      }
    }
  }
  return out;
}

function floydSteinberg(rgba, w, h, palette, opts) {
  const kernel = [
    { dx: 1, dy: 0, w: 7 },
    { dx: -1, dy: 1, w: 3 },
    { dx: 0, dy: 1, w: 5 },
    { dx: 1, dy: 1, w: 1 },
  ];
  return diffuse(rgba, w, h, palette, opts, kernel, 16, opts.serpentine !== false);
}

function atkinson(rgba, w, h, palette, opts) {
  const kernel = [
    { dx: 1, dy: 0, w: 1 },
    { dx: 2, dy: 0, w: 1 },
    { dx: -1, dy: 1, w: 1 },
    { dx: 0, dy: 1, w: 1 },
    { dx: 1, dy: 1, w: 1 },
    { dx: 0, dy: 2, w: 1 },
  ];
  return diffuse(rgba, w, h, palette, opts, kernel, 8, opts.serpentine !== false);
}

function jarvisJudiceNinke(rgba, w, h, palette, opts) {
  const kernel = [
    { dx: 1, dy: 0, w: 7 }, { dx: 2, dy: 0, w: 5 },
    { dx: -2, dy: 1, w: 3 }, { dx: -1, dy: 1, w: 5 }, { dx: 0, dy: 1, w: 7 }, { dx: 1, dy: 1, w: 5 }, { dx: 2, dy: 1, w: 3 },
    { dx: -2, dy: 2, w: 1 }, { dx: -1, dy: 2, w: 3 }, { dx: 0, dy: 2, w: 5 }, { dx: 1, dy: 2, w: 3 }, { dx: 2, dy: 2, w: 1 },
  ];
  return diffuse(rgba, w, h, palette, opts, kernel, 48, opts.serpentine !== false);
}

function bayerMatrix(n) {
  // Generates Bayer matrix of size n (2^k recommended, but accept 3 as well)
  if (n === 2) return [[0, 2], [3, 1]];
  if (n === 3) return [
    [0, 7, 3],
    [6, 5, 2],
    [4, 1, 8],
  ];
  if (n === 4) {
    const m2 = bayerMatrix(2);
    const M = Array.from({ length: 4 }, () => new Array(4));
    const add = [[0, 2], [3, 1]];
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const qx = Math.floor(x / 2);
        const qy = Math.floor(y / 2);
        M[y][x] = 4 * m2[y % 2][x % 2] + add[qy][qx];
      }
    }
    return M;
  }
  if (n === 8) {
    const m4 = bayerMatrix(4);
    const M = Array.from({ length: 8 }, () => new Array(8));
    const add = [
      [0, 2, 8, 10],
      [3, 1, 11, 9],
      [12, 14, 4, 6],
      [15, 13, 7, 5],
    ];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const qx = Math.floor(x / 2);
        const qy = Math.floor(y / 2);
        M[y][x] = 16 * m4[y % 4][x % 4] + add[qy][qx];
      }
    }
    return M;
  }
  throw new Error('Unsupported Bayer matrix size. Use 2, 3, 4, or 8');
}

function orderedDither(rgba, w, h, palette, opts) {
  const n = opts.orderedSize || 4;
  const M = bayerMatrix(n);
  const denom = n * n;
  const out = Array.from({ length: h }, () => new Array(w));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = getPixel01(rgba, w, x, y);
      const t = (M[y % n][x % n] + 0.5) / denom - 0.5; // [-0.5, 0.5)
      const rr = clamp01(r + t / 255);
      const gg = clamp01(g + t / 255);
      const bb = clamp01(b + t / 255);
      const idx = findNearestPaletteIndex(rr, gg, bb, palette.float);
      out[y][x] = palette.entries[idx].id;
      const p = palette.float[idx];
      setPixel01(rgba, w, x, y, p.r, p.g, p.b);
    }
  }
  return out;
}

module.exports = {
  nearestOnly,
  floydSteinberg,
  atkinson,
  jarvisJudiceNinke,
  orderedDither,
};

