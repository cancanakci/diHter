## diHter — palette dithering CLI

CLI that loads an image, dithers with a selectable algorithm to a selectable palette, and outputs a 2D array of palette indices.

### Install

```bash
npm install
npm link # optional to use `dihter` globally
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

