// Palette builder can consume either explicit RGB arrays, or select from known IDs.
// Each entry can be: [r,g,b] or { id: number, r, g, b }
const { ALL_COLORS_BY_ID, MAIN_COLOR_IDS } = require('./palette-constants');

// Default is the main 27 colors by their provided IDs
const DEFAULT_PALETTE_DEFS = MAIN_COLOR_IDS.map((id) => ({ id, ...ALL_COLORS_BY_ID[id] }));

function clamp01(x) { return Math.max(0, Math.min(1, x)); }

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

module.exports = { DEFAULT_PALETTE_DEFS, buildPalette, preprocessGamma };

