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

async function saveRGBAtoPNG({ width, height, rgbaBuffer, outPath }) {
  await sharp(rgbaBuffer, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outPath);
}

async function saveSideBySidePNG({ width, height, originalRGBA, quantizedRGBA, outPath }) {
  const composite = Buffer.alloc(width * 2 * height * 4);
  // left: original, right: quantized
  for (let y = 0; y < height; y++) {
    const rowOffsetLeft = y * width * 4;
    const rowOffsetRight = rowOffsetLeft;
    const dstRowOffset = y * (width * 2) * 4;
    originalRGBA.copy(composite, dstRowOffset, rowOffsetLeft, rowOffsetLeft + width * 4);
    quantizedRGBA.copy(composite, dstRowOffset + width * 4, rowOffsetRight, rowOffsetRight + width * 4);
  }
  await sharp(composite, { raw: { width: width * 2, height, channels: 4 } })
    .png()
    .toFile(outPath);
}

module.exports = { loadImageToRGBA, saveOutput, saveRGBAtoPNG, saveSideBySidePNG };

