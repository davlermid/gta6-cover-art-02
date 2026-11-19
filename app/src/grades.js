// Neon Shore Cover Studio — color grades.
// Each grade is a canvas recipe: a CSS filter applied when the photo is drawn,
// a gradient overlay composited on top of the photo, and an optional glow
// pass. Everything is pure Canvas 2D so the preview and the exported PNG are
// pixel-identical.

export const GRADES = [
  {
    key: 'vice-sunset',
    label: 'Vice Sunset',
    filter: 'saturate(1.25) contrast(1.06) brightness(1.02)',
    stops: ['#ff9a5c', '#ff5e8a', '#5b2a86'],
    mode: 'overlay',
    alpha: 0.55,
    glow: { stops: ['#ff6a3d', '#ff3d8e'], alpha: 0.30 },
  },
  {
    key: 'neon-night',
    label: 'Neon Night',
    filter: 'saturate(1.4) contrast(1.1) brightness(0.88)',
    stops: ['#101a3c', '#2b1a5e', '#ff41b9'],
    mode: 'overlay',
    alpha: 0.6,
    glow: { stops: ['#ff41b9', '#41d9ff'], alpha: 0.26 },
  },
  {
    key: 'golden-hour',
    label: 'Golden Hour',
    filter: 'saturate(1.15) contrast(1.03) brightness(1.06)',
    stops: ['#ffe08a', '#ffab52', '#c45a2a'],
    mode: 'soft-light',
    alpha: 0.75,
    glow: { stops: ['#ffcf6a', '#ff8a3d'], alpha: 0.22 },
  },
  {
    key: 'teal-pink',
    label: 'Teal & Pink',
    filter: 'saturate(1.2) contrast(1.05)',
    stops: ['#18c8c8', '#7a5bd6', '#ff5e9e'],
    mode: 'overlay',
    alpha: 0.5,
    glow: { stops: ['#18e0d0', '#ff5e9e'], alpha: 0.2 },
  },
  {
    key: 'mono-ink',
    label: 'Mono Ink',
    filter: 'grayscale(1) contrast(1.2) brightness(1.02)',
    stops: ['#f4f4f4', '#8a8a96', '#16161e'],
    mode: 'color',
    alpha: 0.18,
    glow: null,
  },
  {
    key: 'candy-pop',
    label: 'Candy Pop',
    filter: 'saturate(1.65) contrast(1.1) brightness(1.05)',
    stops: ['#ff8bd0', '#ffd36a', '#7de2ff'],
    mode: 'overlay',
    alpha: 0.45,
    glow: { stops: ['#ff8bd0', '#7de2ff'], alpha: 0.24 },
  },
];

export const GRADE_KEYS = GRADES.map((g) => g.key);

export function gradeByKey(key) {
  return GRADES.find((g) => g.key === key) || GRADES[0];
}

const MODES = { 'overlay': 'overlay', 'soft-light': 'soft-light', 'color': 'color' };

// Draw the grade for a photo that has just been painted inside `rect`.
// ctx state is saved/restored here; gradient direction follows the rect so
// panels of any shape grade consistently.
export function applyGrade(ctx, rect, gradeKey, overrides) {
  const g = gradeByKey(gradeKey);
  const { x, y, w, h } = rect;
  ctx.save();
  if (overrides && overrides.filter) ctx.filter = overrides.filter;
  else if (g.filter) ctx.filter = g.filter;
  const grad = ctx.createLinearGradient(x, y, x + w * 0.35, y + h);
  const stops = (overrides && overrides.stops) || g.stops;
  stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
  ctx.globalCompositeOperation = MODES[g.mode] || 'overlay';
  ctx.globalAlpha = g.alpha;
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  if (g.glow) {
    // A sunset glow hugging the lower edge of the panel.
    const glow = ctx.createLinearGradient(x, y + h, x, y + h - h * 0.6);
    glow.addColorStop(0, hexA(g.glow.stops[0], g.glow.alpha));
    glow.addColorStop(0.5, hexA(g.glow.stops[1], g.glow.alpha * 0.45));
    glow.addColorStop(1, hexA(g.glow.stops[1], 0));
    ctx.fillStyle = glow;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, gr = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${gr},${b},${a})`;
}
