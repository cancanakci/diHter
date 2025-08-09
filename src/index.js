#!/usr/bin/env node
const { program } = require('commander');
const { loadImageToRGBA, saveOutput, saveRGBAtoPNG, saveSideBySidePNG } = require('./io');
const { buildPalette, DEFAULT_PALETTE_DEFS } = require('./palette');
const { ALL_COLORS_BY_ID, MAIN_COLOR_IDS, PREMIUM_COLOR_IDS } = require('./palette-constants');
const { ditherImage } = require('./pipeline');

program
  .name('dihter')
  .description('Dither an image to a fixed palette and output a 2D array of palette indices')
  .argument('<input>', 'Input image path')
  .option('-a, --algorithm <name>', 'Algorithm: none|nearest|floyd|atkinson|jjn|ordered', 'floyd')
  .option('-o, --output <file>', 'Output JSON file for 2D array (default: stdout)')
  .option('--width <n>', 'Resize width before processing')
  .option('--height <n>', 'Resize height before processing')
  .option('--gamma <g>', 'Gamma correction before quantization (e.g., 2.2)', parseFloat)
  .option('--strength <s>', 'Error diffusion strength (0-1)', (v) => parseFloat(v), 1.0)
  .option('--serpentine', 'Use serpentine scanning where applicable', true)
  .option('--no-serpentine', 'Disable serpentine scanning')
  .option('--ordered-size <n>', 'Ordered dithering Bayer matrix size: 2|3|4|8', (v) => parseInt(v, 10), 4)
  .option('--palette <json>', 'JSON array of RGB triplets/objects, overrides defaults')
  .option('--palette-mode <mode>', 'one of: main|premium|all|owned (default: main unless --palette is provided)')
  .option('--owned-ids <csv>', 'CSV list of integer color IDs to use (used when --palette-mode owned)')
  .option('--preview <png>', 'Write a PNG of the dithered image')
  .option('--compare <png>', 'Write a side-by-side PNG: original | dithered')
  .action(async (input, opts) => {
    try {
      const startedAt = Date.now();
      const image = await loadImageToRGBA(input, {
        width: opts.width ? parseInt(opts.width, 10) : undefined,
        height: opts.height ? parseInt(opts.height, 10) : undefined,
      });

      let paletteDefs;
      let modeUsed = 'main';
      let idsUsed = [];
      if (opts.palette) {
        paletteDefs = JSON.parse(opts.palette);
        modeUsed = 'custom';
      } else {
        const mode = String(opts.paletteMode || 'main').toLowerCase();
        let ids;
        if (mode === 'main') ids = MAIN_COLOR_IDS;
        else if (mode === 'premium') ids = PREMIUM_COLOR_IDS;
        else if (mode === 'all') ids = [...new Set([ ...MAIN_COLOR_IDS, ...PREMIUM_COLOR_IDS ])];
        else if (mode === 'owned') {
          const raw = String(opts.ownedIds || '').trim();
          if (!raw) throw new Error('When --palette-mode owned, provide --owned-ids CSV of IDs');
          ids = raw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
        } else {
          ids = MAIN_COLOR_IDS;
        }
        modeUsed = mode;
        paletteDefs = ids.map((id) => ({ id, ...ALL_COLORS_BY_ID[id] })).filter((e) => !!e.r || e.r === 0);
        if (paletteDefs.length === 0) throw new Error('Selected palette is empty');
      }
      const palette = buildPalette(paletteDefs);
      idsUsed = palette.entries.map((e) => e.id);

      const { width, height, data } = image;
      const result = ditherImage({
        width,
        height,
        rgba: data,
        palette,
        algorithm: String(opts.algorithm || 'floyd').toLowerCase(),
        gamma: opts.gamma,
        strength: opts.strength,
        serpentine: opts.serpentine,
        orderedSize: opts.orderedSize,
      });

      await saveOutput(result.indices2D, opts.output);
      if (opts.preview) {
        await saveRGBAtoPNG({ width, height, rgbaBuffer: result.quantizedRGBA, outPath: opts.preview });
      }
      if (opts.compare) {
        await saveSideBySidePNG({ width, height, originalRGBA: data, quantizedRGBA: result.quantizedRGBA, outPath: opts.compare });
      }

      const elapsedMs = Date.now() - startedAt;
      // Pretty, multi-line summary to stderr (stdout reserved for JSON indices)
      const algoUsed = String(opts.algorithm || 'floyd').toLowerCase();
      const serp = opts.serpentine !== false ? 'on' : 'off';
      const gammaStr = opts.gamma == null ? '-' : String(opts.gamma);
      const orderedStr = opts.orderedSize == null ? '-' : String(opts.orderedSize);
      const outJSON = opts.output || 'stdout';
      const previewPNG = opts.preview || '-';
      const comparePNG = opts.compare || '-';
      const lines = [
        '',
        '[dihter] Done',
        '  • Input        : ' + input,
        '  • Size         : ' + `${width}x${height}`,
        '  • Algorithm    : ' + algoUsed,
        '  • Gamma        : ' + gammaStr,
        '  • Strength     : ' + opts.strength,
        '  • Serpentine   : ' + serp,
        '  • Ordered size : ' + orderedStr,
        '  • Palette mode : ' + `${modeUsed} (${idsUsed.length} colors)`,
        '  • Color IDs    : ' + (idsUsed.length ? idsUsed.join(', ') : '-'),
        '  • Output JSON  : ' + outJSON,
        '  • Preview PNG  : ' + previewPNG,
        '  • Compare PNG  : ' + comparePNG,
        '  • Elapsed      : ' + `${elapsedMs} ms`,
        ''
      ];
      console.error(lines.join('\n'));
    } catch (err) {
      console.error('[dihter] Error:', err.message || err);
      process.exitCode = 1;
    }
  });

program.parseAsync();

