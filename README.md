## diHter — palette dithering CLI

diHter is a CLI tool specifically built for planning out artworks on collaborative pixel art websites such as wplace.live. Loads an image, dithers with an algorithm of choice to a selectable palette and outputs a 2D array of palette indices. Preview and comparison functionality is included.

### Install

```bash
npm install
npm link # optional to use dither globally
```

### Usage

```bash
node src/index.js <input> [options]
# or if linked
dihter <input> [options]
```

### Options

- `-a, --algorithm` none|nearest|floyd|atkinson|jjn|ordered (default: floyd)
- `-o, --output` path to write JSON array (default: stdout)
- `--width`, `--height` resize before processing
- `--gamma <g>` gamma correction (e.g., 2.2)
- `--strength <s>` error diffusion strength 0..1
- `--serpentine/--no-serpentine` toggle serpentine scan
- `--ordered-size <n>` Bayer matrix size 2|3|4|8
- `--palette <json>` palette array; each entry `[r,g,b]` or `{r,g,b}`; `id` defaults to index
- `--palette-preset <name>` quick presets: `greyscale|redscale|greenscale|bluescale`
- `--preset-levels <n>` number of levels for presets (2-256, default: 8)
- `--palette-mode <mode>` `main|premium|all|owned` (default: `main` unless `--palette` given)
- `--owned-ids <csv>` when `--palette-mode owned`, comma-separated list of integer color IDs to include
 - `--preview <png>` write a PNG of the dithered image
 - `--compare <png>` write a side-by-side PNG: original | dithered

### Palette

Edit `src/palette-constants.js` to adjust the full color map (`ALL_COLORS_BY_ID`), the default main set (`MAIN_COLOR_IDS`), and derived premium set. These are used when `--palette` is not provided.

Example custom palette via flag:

```bash
dihter input.png -a floyd --palette '[{"r":0,"g":0,"b":0}, {"r":255,"g":255,"b":255}, ...]'

# Use default main colors (no flag needed)
dihter input.png -a floyd

# Use a greyscale preset with 16 levels
dihter input.png --palette-preset greyscale --preset-levels 16

# Use a redscale preset (defaults to 8 levels)
dihter input.png --palette-preset redscale

# Use only premium colors
dihter input.png --palette-mode premium

# Use all known colors (main + premium)
dihter input.png --palette-mode all

# Use only a custom owned subset by ID
dihter input.png --palette-mode owned --owned-ids 1,2,7,8,9,10,11
```

### Output

The program outputs a JSON 2D array of integers (palette indices), shape `[height][width]`. The integer IDs correspond to those in `src/palette-constants.js` (or your custom `--palette` if provided).

### Visual previews

```bash
# Dither and produce JSON + a preview image
dihter samples/tro.jpg -a floyd -o out.json --preview preview.png

# Dither and produce a side-by-side comparison PNG
dihter samples/tro.jpg -a floyd --compare compare.png
```

### Samples

Original and dithered examples from `samples/`:

- Original `tro.jpg`:

  <img src="samples/tro.jpg" alt="tro.jpg" width="75%" style="image-rendering: pixelated; image-rendering: crisp-edges; image-rendering: -moz-crisp-edges;" />

- Base colors dither (main palette):

  <img src="samples/tro-output-basecolors.jpg" alt="tro-output-basecolors.jpg" width="75%" style="image-rendering: pixelated; image-rendering: crisp-edges; image-rendering: -moz-crisp-edges;" />

- All colors dither (main + premium):

  <img src="samples/tro-output-allcolors.jpg" alt="tro-output-allcolors.jpg" width="75%" style="image-rendering: pixelated; image-rendering: crisp-edges; image-rendering: -moz-crisp-edges;" />

