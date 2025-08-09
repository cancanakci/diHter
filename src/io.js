const sharp = require('sharp');
const fs = require('fs');

async function loadImageToRGBA(path, resize) {
  let pipeline = sharp(path, { limitInputPixels: false }).ensureAlpha();
  if (resize && (resize.width || resize.height)) {
    pipeline = pipeline.resize({ width: resize.width, height: resize.height, fit: 'inside' });
  }
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

async function saveOutput(indices2D, outPath) {
  const json = JSON.stringify(indices2D);
  if (!outPath) {
    process.stdout.write(json + '\n');
    return;
  }
  await fs.promises.writeFile(outPath, json, 'utf8');
}

module.exports = { loadImageToRGBA, saveOutput };

