// Helpers to generate simple palette presets like greyscale, redscale, etc.

function clamp255(x) {
  return Math.max(0, Math.min(255, x | 0));
}

function generateScale(levels, mapValueToRGB) {
  const count = Number.isFinite(levels) ? Math.max(2, Math.min(256, levels | 0)) : 8;
  const step = 255 / (count - 1);
  const out = [];
  for (let i = 0; i < count; i++) {
    const v = clamp255(Math.round(i * step));
    const { r, g, b } = mapValueToRGB(v);
    out.push({ r: clamp255(r), g: clamp255(g), b: clamp255(b) });
  }
  return out;
}

function getPresetPaletteDefs(name, opts = {}) {
  const preset = String(name || '').toLowerCase();
  const levels = opts.levels == null ? 8 : opts.levels;
  switch (preset) {
    case 'greyscale':
    case 'grayscale':
    case 'gray':
    case 'grey':
      return generateScale(levels, (v) => ({ r: v, g: v, b: v }));
    case 'redscale':
    case 'red':
      return generateScale(levels, (v) => ({ r: v, g: 0, b: 0 }));
    case 'greenscale':
    case 'green':
      return generateScale(levels, (v) => ({ r: 0, g: v, b: 0 }));
    case 'bluescale':
    case 'blue':
      return generateScale(levels, (v) => ({ r: 0, g: 0, b: v }));
    default:
      throw new Error(`Unknown palette preset: ${name}`);
  }
}

module.exports = { getPresetPaletteDefs };


