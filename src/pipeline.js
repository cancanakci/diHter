const { preprocessGamma } = require('./palette');
const algorithms = require('./algorithms');

function ditherImage({ width, height, rgba, palette, algorithm, gamma, strength, serpentine, orderedSize }) {
  const working = Buffer.from(rgba); // mutable copy
  // Optional gamma pre-transform
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
      indices2D = algorithms.nearestOnly(working, width, height, palette, opts);
      break;
    case 'floyd':
    case 'floyd-steinberg':
      indices2D = algorithms.floydSteinberg(working, width, height, palette, opts);
      break;
    case 'atkinson':
      indices2D = algorithms.atkinson(working, width, height, palette, opts);
      break;
    case 'jjn':
    case 'jarvis':
      indices2D = algorithms.jarvisJudiceNinke(working, width, height, palette, opts);
      break;
    case 'ordered':
      indices2D = algorithms.orderedDither(working, width, height, palette, opts);
      break;
    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
  return indices2D;
}

module.exports = { ditherImage };

