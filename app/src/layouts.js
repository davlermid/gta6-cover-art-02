// Neon Shore Cover Studio — panel layout definitions.
// Every layout is a pure function of the cover aspect (w, h) returning a list
// of panel rectangles plus a title-block rectangle (may be null). Rectangles
// are normalized {x, y, w, h} in cover pixels, computed fresh on every render
// so any export size works.

const GAP = 0.006; // fraction of min side; the real gap comes from the slider

function g(w, h) {
  return GAP * Math.min(w, h);
}

function row(w, x, y, hh, rects, gx) {
  const n = rects.length;
  const each = (w - gx * (n - 1)) / n;
  return rects.map((r, i) => ({ x: x + i * (each + gx), y, w: each, h: hh, flex: r }));
}

export const LAYOUTS = [
  {
    key: 'grid9',
    label: '9-Panel Grid',
    slots: 9,
    panels(w, h) {
      const gx = g(w, h) * 1.6;
      const mw = Math.min(w, h * 1.35);
      const px = (w - mw) / 2;
      const blockH = h * 0.26;
      const top = h * 0.04;
      const py = top + blockH + gx;
      const gridH = h - top - blockH - gx - h * 0.04;
      const cw = (mw - gx * 2) / 3;
      const ch = (gridH - gx * 2) / 3;
      const panels = [];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          panels.push({ x: px + c * (cw + gx), y: py + r * (ch + gx), w: cw, h: ch });
      const title = { x: px, y: top, w: mw, h: blockH, halftone: true };
      return { panels, title };
    },
  },
  {
    key: 'grid4',
    label: '4-Panel Grid',
    slots: 4,
    panels(w, h) {
      const gx = g(w, h) * 1.6;
      const titleH = h * 0.24;
      const top = h * 0.05;
      const py = top + titleH + gx;
      const gridH = h - py - h * 0.05;
      const cw = (w * 0.92 - gx) / 2;
      const ch = (gridH - gx) / 2;
      const px = (w - cw * 2 - gx) / 2;
      const panels = [];
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 2; c++)
          panels.push({ x: px + c * (cw + gx), y: py + r * (ch + gx), w: cw, h: ch });
      return { panels, title: { x: px, y: top, w: cw * 2 + gx, h: titleH, halftone: true } };
    },
  },
  {
    key: 'hero-three',
    label: 'Hero + Three',
    slots: 4,
    panels(w, h) {
      const gx = g(w, h) * 1.6;
      const hero = { x: w * 0.05, y: h * 0.05, w: w * 0.62 - gx / 2, h: h * 0.9 };
      const sideW = w * 0.31 - gx / 2;
      const sideH = (h * 0.9 - gx * 2) / 3;
      const sideX = hero.x + hero.w + gx;
      const panels = [hero];
      for (let i = 0; i < 3; i++)
        panels.push({ x: sideX, y: h * 0.05 + i * (sideH + gx), w: sideW, h: sideH });
      const title = { x: sideX - gx * 0.2, y: h * 0.05 + 3 * (sideH + gx) - gx + h * 0.02, w: sideW, h: 0 };
      title.h = h * 0.9 - 3 * sideH - 2 * gx;
      return { panels, title };
    },
  },
  {
    key: 'full-bleed',
    label: 'Full Bleed',
    slots: 1,
    panels(w, h) {
      return { panels: [{ x: 0, y: 0, w, h }], title: null };
    },
  },
  {
    key: 'tilted',
    label: 'Snapshot Collage',
    slots: 4,
    tilted: true,
    panels(w, h) {
      // Tilted polaroid-ish snapshots; rotation is applied by the renderer.
      const cx = w / 2, cy = h * 0.52;
      const s = Math.min(w, h) * 0.42;
      const mk = (dx, dy, rot, sc) => ({
        x: cx + dx * s - (s * sc) / 2,
        y: cy + dy * s - (s * sc * 1.05) / 2,
        w: s * sc,
        h: s * sc * 1.05,
        rot,
        frame: 'white',
      });
      const panels = [
        mk(-0.55, -0.62, -0.10, 0.85),
        mk(0.62, -0.52, 0.13, 0.8),
        mk(-0.66, 0.55, 0.08, 0.8),
        mk(0.6, 0.6, -0.14, 0.85),
        mk(0.02, 0.05, 0.02, 1.0),
      ];
      return { panels, title: { x: w * 0.08, y: h * 0.06, w: w * 0.84, h: h * 0.24, halftone: true } };
    },
  },
  {
    key: 'duo',
    label: 'Split Duo',
    slots: 2,
    panels(w, h) {
      const gap = g(w, h) * 2;
      const split = w * 0.55;
      const pad = h * 0.06;
      return {
        panels: [
          { x: 0, y: 0, w: split - gap / 2, h },
          { x: split + gap / 2, y: 0, w: w - split - gap / 2, h },
        ],
        title: { x: pad, y: h - pad - h * 0.26, w: w - pad * 2, h: h * 0.26, bottom: true },
      };
    },
  },
];

export const LAYOUT_KEYS = LAYOUTS.map((l) => l.key);

export function layoutByKey(key) {
  return LAYOUTS.find((l) => l.key === key) || LAYOUTS[0];
}
