// Vanilla js port of diHter library
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

const ALL_COLORS_BY_ID = {
  0:  { r: 0, g: 0, b: 0, name: 'Transparent' },
  1:  { r: 0, g: 0, b: 0, name: 'Black' },
  2:  { r: 60, g: 60, b: 60, name: 'Dark Gray' },
  3:  { r: 120, g: 120, b: 120, name: 'Gray' },
  32: { r: 170, g: 170, b: 170, name: 'Medium Gray' },
  4:  { r: 210, g: 210, b: 210, name: 'Light Gray' },
  5:  { r: 255, g: 255, b: 255, name: 'White' },
  6:  { r: 96, g: 0, b: 24, name: 'Deep Red' },
  33: { r: 165, g: 14, b: 30, name: 'Dark Red' },
  7:  { r: 237, g: 28, b: 36, name: 'Red' },
  34: { r: 250, g: 128, b: 114, name: 'Light Red' },
  35: { r: 228, g: 92, b: 26, name: 'Dark Orange' },
  8:  { r: 255, g: 127, b: 39, name: 'Orange' },
  9:  { r: 246, g: 170, b: 9, name: 'Gold' },
  10: { r: 249, g: 221, b: 59, name: 'Yellow' },
  11: { r: 255, g: 250, b: 188, name: 'Light Yellow' },
  37: { r: 156, g: 132, b: 49, name: 'Dark Goldenrod' },
  38: { r: 197, g: 173, b: 49, name: 'Goldenrod' },
  39: { r: 232, g: 212, b: 95, name: 'Light Goldenrod' },
  40: { r: 74, g: 107, b: 58, name: 'Dark Olive' },
  41: { r: 90, g: 148, b: 74, name: 'Olive' },
  42: { r: 132, g: 197, b: 115, name: 'Light Olive' },
  12: { r: 14, g: 185, b: 104, name: 'Dark Green' },
  13: { r: 19, g: 230, b: 123, name: 'Green' },
  14: { r: 135, g: 255, b: 94, name: 'Light Green' },
  15: { r: 12, g: 129, b: 110, name: 'Dark Teal' },
  16: { r: 16, g: 174, b: 166, name: 'Teal' },
  17: { r: 19, g: 225, b: 190, name: 'Light Teal' },
  43: { r: 15, g: 121, b: 159, name: 'Dark Cyan' },
  20: { r: 96, g: 247, b: 242, name: 'Cyan' },
  44: { r: 187, g: 250, b: 242, name: 'Light Cyan' },
  18: { r: 40, g: 80, b: 158, name: 'Dark Blue' },
  19: { r: 64, g: 147, b: 228, name: 'Blue' },
  45: { r: 125, g: 199, b: 255, name: 'Light Blue' },
  46: { r: 77, g: 49, b: 184, name: 'Dark Indigo' },
  21: { r: 107, g: 80, b: 246, name: 'Indigo' },
  22: { r: 153, g: 177, b: 251, name: 'Light Indigo' },
  47: { r: 74, g: 66, b: 132, name: 'Dark Slate Blue' },
  48: { r: 122, g: 113, b: 196, name: 'Slate Blue' },
  49: { r: 181, g: 174, b: 241, name: 'Light Slate Blue' },
  23: { r: 120, g: 12, b: 153, name: 'Dark Purple' },
  24: { r: 170, g: 56, b: 185, name: 'Purple' },
  25: { r: 224, g: 159, b: 249, name: 'Light Purple' },
  26: { r: 203, g: 0, b: 122, name: 'Dark Pink' },
  27: { r: 236, g: 31, b: 128, name: 'Pink' },
  28: { r: 243, g: 141, b: 169, name: 'Light Pink' },
  53: { r: 155, g: 82, b: 73, name: 'Dark Peach' },
  54: { r: 209, g: 128, b: 120, name: 'Peach' },
  55: { r: 250, g: 182, b: 164, name: 'Light Peach' },
  29: { r: 104, g: 70, b: 52, name: 'Dark Brown' },
  30: { r: 149, g: 104, b: 42, name: 'Brown' },
  50: { r: 219, g: 164, b: 99, name: 'Light Brown' },
  56: { r: 123, g: 99, b: 82, name: 'Dark Tan' },
  57: { r: 156, g: 132, b: 107, name: 'Tan' },
  36: { r: 214, g: 181, b: 148, name: 'Light Tan' },
  51: { r: 209, g: 128, b: 81, name: 'Dark Beige' },
  31: { r: 248, g: 178, b: 119, name: 'Beige' },
  52: { r: 255, g: 197, b: 165, name: 'Light Beige' },
  61: { r: 109, g: 100, b: 63, name: 'Dark Stone' },
  62: { r: 148, g: 140, b: 107, name: 'Stone' },
  63: { r: 205, g: 197, b: 158, name: 'Light Stone' },
  58: { r: 51, g: 57, b: 65, name: 'Dark Slate' },
  59: { r: 109, g: 117, b: 141, name: 'Slate' },
  60: { r: 179, g: 185, b: 209, name: 'Light Slate' },
};

const PREMIUM_COLOR_IDS = Object.keys(ALL_COLORS_BY_ID).filter((id) => id >= 32).reduce((o, key) => Object.assign(o, { [key]: ALL_COLORS_BY_ID[key] }), {});
const DEFAULT_PALETTE_DEFS = Object.keys(ALL_COLORS_BY_ID).filter((id) => id < 32).reduce((o, key) => Object.assign(o, { [key]: ALL_COLORS_BY_ID[key] }), {});

function preprocessGamma(rgbLinear01, gamma) {
  if (!gamma || gamma === 1) return rgbLinear01;
  const inv = 1 / gamma;
  return rgbLinear01.map((v) => Math.pow(clamp01(v), inv));
}

function buildPalette(defs) {
  if (!Array.isArray(defs) || defs.length === 0) {
    throw new Error('Palette must be a non-empty array of RGB entries');
  }
  const entries = defs.map((d, i) => {
    const r = d.r ?? (Array.isArray(d) ? d[0] : undefined);
    const g = d.g ?? (Array.isArray(d) ? d[1] : undefined);
    const b = d.b ?? (Array.isArray(d) ? d[2] : undefined);
    if ([r, g, b].some((v) => v == null)) {
      throw new Error(`Palette entry ${i} is invalid; expected {r,g,b}`);
    }
    return { id: d.id ?? i, r: r|0, g: g|0, b: b|0 };
  });
  const float = entries.map((e) => ({
    id: e.id,
    r: e.r / 255,
    g: e.g / 255,
    b: e.b / 255,
  }));
  return { entries, float };
}

function ditherImage({ width, height, rgba, palette, algorithm, gamma, strength, serpentine, orderedSize }) {
  const working = new Uint8ClampedArray(rgba);

  if (gamma && gamma !== 1) {
    for (let i = 0; i < working.length; i += 4) {
      const r = working[i] / 255;
      const g = working[i + 1] / 255;
      const b = working[i + 2] / 255;
      const [rr, gg, bb] = preprocessGamma([r, g, b], gamma);
      working[i] = Math.max(0, Math.min(255, Math.round(rr * 255)));
      working[i + 1] = Math.max(0, Math.min(255, Math.round(gg * 255)));
      working[i + 2] = Math.max(0, Math.min(255, Math.round(bb * 255)));
    }
  }

  const opts = { strength, serpentine, orderedSize };
  let indices2D;
  switch (algorithm) {
    case 'none':
    case 'nearest':
      indices2D = nearestOnly(working, width, height, palette, opts);
      break;
    case 'floyd':
    case 'floyd-steinberg':
      indices2D = floydSteinberg(working, width, height, palette, opts);
      break;
    case 'atkinson':
      indices2D = atkinson(working, width, height, palette, opts);
      break;
    case 'jjn':
    case 'jarvis':
      indices2D = jarvisJudiceNinke(working, width, height, palette, opts);
      break;
    case 'ordered':
      indices2D = orderedDither(working, width, height, palette, opts);
      break;
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }

  return { indices2D, quantizedRGBA: working };
}

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

function ditherImageFromUrl(imageUrl, width, height, options) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);

      const ditheredResult = ditherImage({
        width,
        height,
        rgba: imgData.data,
        palette: buildPalette(options.paletteDefs || DEFAULT_PALETTE_DEFS),
        algorithm: options.algorithm || 'floyd-steinberg',
        gamma: options.gamma || 1.0,
        strength: options.strength || 1.0,
        serpentine: options.serpentine !== false,
        orderedSize: options.orderedSize || 8,
      });

      const ditheredImageData = new ImageData(ditheredResult.quantizedRGBA, width, height);
      ctx.putImageData(ditheredImageData, 0, 0);

      resolve(canvas.toDataURL());
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}