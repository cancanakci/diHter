// Master color map keyed by your integer IDs (matching the "color-<id>" values)
// Transparent (0) is listed for completeness but excluded from defaults.
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

// Default main 27 IDs (non-premium), curated to span the spectrum.
// Adjust if your definition of "main" differs.
const MAIN_COLOR_IDS = [
  1, 2, 3, 32, 4, 5, // grays
  6, 7, 8, 9, 10, 11, // reds/orange/yellow
  12, 13, 14, 15, 16, 17, // greens/teals
  18, 19, 20, // blues/cyan
  21, 22, // indigos
  23, 24, // purples
  26, 27, // pinks
];

// Premium IDs are the rest (excluding transparent 0)
const PREMIUM_COLOR_IDS = Object.keys(ALL_COLORS_BY_ID)
  .map((k) => parseInt(k, 10))
  .filter((id) => id !== 0 && !MAIN_COLOR_IDS.includes(id));

module.exports = { ALL_COLORS_BY_ID, MAIN_COLOR_IDS, PREMIUM_COLOR_IDS };

