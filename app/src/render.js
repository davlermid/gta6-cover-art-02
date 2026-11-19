// Neon Shore Cover Studio — the cover renderer.
// One pure function draws the whole cover onto any canvas at any size, so the
// on-screen preview and the exported PNG are identical by construction.

import { applyGrade } from './grades.js';
import { layoutByKey } from './layouts.js';

// ---------------------------------------------------------------------------
// Fonts (loaded via @font-face in style.css, local TTFs only)
// ---------------------------------------------------------------------------

export const FONTS = {
  title: '"Archivo Black", "Arial Black", sans-serif',
  script: '"Pacifico", cursive',
  badge: '"Bebas Neue", "Arial Narrow", sans-serif',
};

const TITLE_FILL_STYLES = {
  white: 'solid',
  sunset: 'gradient',
};

export function fontReady() {
  return document.fonts.ready;
}

// ---------------------------------------------------------------------------
// Text rendering helpers
// ---------------------------------------------------------------------------

function fitFont(ctx, text, family, boxW, boxH, maxSize, { tracking = 0, upper = true, weight = 'normal' } = {}) {
  const t = upper ? text.toUpperCase() : text;
  let size = maxSize;
  const measure = (s) => {
    ctx.font = `${weight} ${s}px ${family}`;
    const chars = [...t];
    let wid = 0;
    for (const ch of chars) wid += ctx.measureText(ch).width + (tracking * s) / 100;
    wid -= chars.length ? (tracking * s) / 100 : 0;
    return { wid, hei: s * 1.08 };
  };
  let m = measure(size);
  while ((m.wid > boxW * 0.96 || m.hei > boxH) && size > 8) {
    size *= 0.94;
    m = measure(size);
  }
  return { size, text: t, wid: m.wid };
}

// The classic GTA-poster lettering: heavy fill with a thick dark outline.
function drawLettering(ctx, text, cx, cy, size, family, opts) {
  const fill = opts.fill || '#ffffff';
  const outline = opts.outline || 'rgba(10,8,14,0.95)';
  const outlineW = opts.outlineW != null ? opts.outlineW : size * 0.12;
  const tracking = opts.tracking != null ? opts.tracking : 2;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px ${family}`;
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width + (tracking * size) / 100);
  const total = widths.reduce((a, b) => a + b, 0) - (chars.length ? (tracking * size) / 100 : 0);
  let x = cx - total / 2;
  let grad = null;
  if (TITLE_FILL_STYLES[opts.titleFill] === 'gradient' || opts.fill === 'gradient') {
    grad = ctx.createLinearGradient(cx - total / 2, cy - size * 0.7, cx + total / 2, cy + size * 0.7);
    grad.addColorStop(0, '#ffe29a');
    grad.addColorStop(0.42, '#ff9a5c');
    grad.addColorStop(0.72, '#ff5e8a');
    grad.addColorStop(1, '#b03bff');
  }
  // Two outline strokes for a chunkier edge.
  for (const pass of [outlineW * 1.35, outlineW]) {
    ctx.strokeStyle = outline;
    ctx.lineWidth = pass;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    let px = x;
    for (let i = 0; i < chars.length; i++) {
      ctx.strokeText(chars[i], px, cy);
      px += widths[i];
    }
  }
  let px = x;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillStyle = grad || fill;
    ctx.fillText(chars[i], px, cy);
    px += widths[i];
  }
  ctx.restore();
}

function drawScript(ctx, text, cx, cy, size, opts) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px ${FONTS.script}`;
  // Shrink to fit the available width when a long subtitle is used.
  const maxW = (opts.maxW || Infinity);
  let s = size;
  while (ctx.measureText(text).width > maxW && s > 8) {
    s *= 0.94;
    ctx.font = `${s}px ${FONTS.script}`;
  }
  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = s * 0.4;
  }
  ctx.fillStyle = opts.fill || '#ff9ad5';
  for (let i = 0; i < 2; i++) ctx.fillText(text, cx, cy);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Photo drawing with cover-crop + pan/zoom per panel
// ---------------------------------------------------------------------------

function drawPhotoInPanel(ctx, img, rect, pan, zoom, gradeKey, perPanel, border) {
  const { x, y, w, h } = rect;
  ctx.save();
  if (rect.rot) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rect.rot);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const z = Math.max(1, zoom || 1);
    const scale = Math.max(w / img.width, h / img.height) * z;
    const dw = img.width * scale, dh = img.height * scale;
    const px = (pan && pan.x) || 0, py = (pan && pan.y) || 0;
    let dx = x + (w - dw) / 2 + px * w;
    let dy = y + (h - dh) / 2 + py * h;
    // Keep the photo covering the panel.
    dx = Math.min(Math.max(dx, x + w - dw), x);
    dy = Math.min(Math.max(dy, y + h - dh), y);
    ctx.drawImage(img, dx, dy, dw, dh);
    applyGrade(ctx, { x, y, w, h }, gradeKey, perPanel);
  } else {
    ctx.fillStyle = '#1a1626';
    ctx.fillRect(x, y, w, h);
    applyGrade(ctx, { x, y, w, h }, gradeKey, null);
  }
  ctx.restore();
  if (border && border !== 'none') drawPanelBorder(ctx, rect, border);
}

function drawPanelBorder(ctx, rect, style) {
  const { x, y, w, h } = rect;
  ctx.save();
  if (style === 'white') {
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.012);
    ctx.strokeRect(x, y, w, h);
  } else if (style === 'ink') {
    ctx.strokeStyle = 'rgba(8,6,12,0.9)';
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.02);
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.006);
    ctx.strokeRect(x + ctx.lineWidth, y + ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

function drawHalftone(ctx, rect) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ff5e8a';
  const step = Math.max(4, Math.min(w, h) * 0.02);
  for (let yy = y + step / 2, r = 0; yy < y + h; yy += step, r++)
    for (let xx = x + step / 2 + ((r % 2) * step) / 2; xx < x + w; xx += step) {
      ctx.beginPath();
      ctx.arc(xx, yy, step * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  ctx.restore();
}

// Deterministic PRNG so renders (and screenshots) are reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGrain(ctx, w, h, amount) {
  ctx.save();
  ctx.globalAlpha = amount;
  const rand = mulberry32(0x5eed + w * 7 + h);
  const cell = Math.max(1, Math.round(Math.min(w, h) / 360));
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      if (rand() < 0.14) {
        const v = rand();
        ctx.fillStyle = v > 0.5 ? '#ffffff' : '#000000';
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }
  ctx.restore();
}

function drawVignette(ctx, w, h, strength) {
  ctx.save();
  const rad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  rad.addColorStop(0, 'rgba(0,0,0,0)');
  rad.addColorStop(1, `rgba(6,2,12,${strength})`);
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawStars(ctx, w, h, opts) {
  const n = 5;
  const size = Math.min(w, h) * 0.028 * opts.size;
  const gapx = size * 1.7;
  const totalW = n * gapx;
  const x0 = opts.align === 'right' ? opts.x + opts.boxW - totalW : opts.x;
  const y = opts.y;
  ctx.save();
  ctx.translate(x0, y);
  for (let i = 0; i < n; i++) {
    const filled = i < opts.count;
    star(ctx, gapx * i + size, size * 0.9, size * 0.85, filled);
  }
  ctx.restore();
}

function star(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.lineWidth = r * 0.22;
  ctx.strokeStyle = 'rgba(10,8,14,0.9)';
  ctx.fillStyle = filled ? '#ffd23d' : 'rgba(255,255,255,0.35)';
  ctx.stroke();
  ctx.fill();
}

function drawRibbon(ctx, rect, text, opts) {
  const { x, y, w, h } = rect;
  const hh = h * 0.085;
  const rw = w * 0.42;
  const rx = x + w - rw - w * 0.03;
  const ry = y + h - hh - h * 0.03; // bottom-right: keeps clear of the title block
  ctx.save();
  ctx.translate(rx + rw / 2, ry + hh / 2);
  ctx.rotate(-0.035);
  const grad = ctx.createLinearGradient(-rw / 2, 0, rw / 2, 0);
  grad.addColorStop(0, '#ff3d8e');
  grad.addColorStop(1, '#ff8a3d');
  ctx.fillStyle = grad;
  ctx.beginPath();
  const bx = -rw / 2, by = -hh / 2, notch = hh * 0.28;
  ctx.moveTo(bx, by);
  ctx.lineTo(rw / 2, by);
  ctx.lineTo(rw / 2, hh / 2);
  ctx.lineTo(bx, hh / 2);
  ctx.lineTo(bx + notch, 0);
  ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = hh * 0.3;
  ctx.fill();
  ctx.shadowBlur = 0;
  const size = hh * 0.72;
  ctx.font = `${size}px ${FONTS.badge}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(text.toUpperCase(), rw * 0.06, hh * 0.04);
  ctx.restore();
}

function drawTitleBlock(ctx, rect, state, w, h) {
  const { x, y, w: bw, h: bh } = rect;
  ctx.save();
  if (rect.halftone && state.halftone) drawHalftone(ctx, rect);
  const scriptSize = bh * 0.26 * state.titleSize;
  const titleSize = bh * 0.48 * state.titleSize;
  const cy = y + bh * (0.52 - state.titlePos * 0.4);
  drawScript(ctx, state.subtitle, x + bw * 0.5, cy - bh * 0.3 * state.titleSize, scriptSize, {
    glow: '#ff41b9',
    maxW: bw * 0.66,
  });
  const fitted = fitFont(ctx, state.title, FONTS.title, bw * 0.9, bh * 0.5, titleSize, { tracking: 1 });
  drawLettering(ctx, fitted.text, x + bw * 0.5, cy + bh * 0.14, fitted.size, FONTS.title, {
    fill: TITLE_FILL_STYLES[state.titleFill] === 'gradient' ? 'gradient' : '#ffffff',
    titleFill: state.titleFill,
    outlineW: fitted.size * 0.11,
  });
  if (state.stars > 0) {
    drawStars(ctx, w, h, {
      count: state.stars,
      x: x + bw * 0.05,
      y: y + bh * 0.86,
      boxW: bw * 0.3,
      align: 'left',
      size: 0.75,
    });
  }
  ctx.restore();
}

function drawTitleBlockBottom(ctx, rect, state) {
  const { x, y, w: bw, h: bh } = rect;
  ctx.save();
  const grad = ctx.createLinearGradient(x, y + bh, x, y - bh * 0.4);
  grad.addColorStop(0, 'rgba(8,4,14,0.72)');
  grad.addColorStop(1, 'rgba(8,4,14,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y - bh * 0.4, bw, bh * 1.5);
  const scriptSize = bh * 0.28 * state.titleSize;
  const titleSize = bh * 0.5 * state.titleSize;
  const cy = y + bh * (0.52 - state.titlePos * 0.4);
  drawScript(ctx, state.subtitle, x + bw / 2, cy - bh * 0.3 * state.titleSize, scriptSize, { glow: '#ff41b9', maxW: bw * 0.7 });
  const fitted = fitFont(ctx, state.title, FONTS.title, bw * 0.9, bh * 0.5, titleSize, { tracking: 1 });
  drawLettering(ctx, fitted.text, x + bw / 2, cy + bh * 0.14, fitted.size, FONTS.title, {
    titleFill: state.titleFill,
    outlineW: fitted.size * 0.11,
  });
  if (state.stars > 0) {
    drawStars(ctx, bw, bh, {
      count: state.stars,
      x: x + bw * 0.04,
      y: y + bh * 0.84,
      boxW: bw * 0.3,
      align: 'left',
      size: 0.6,
    });
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main entry: render the entire cover
// ---------------------------------------------------------------------------

export function renderCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0c0a14';
  ctx.fillRect(0, 0, w, h);

  const gap = state.gap / 100; // slider 0..3
  const layout = state.layoutDef || layoutByKey(state.layout);
  const geo = layout.panels(w, h);
  const baseGap = Math.min(w, h) * 0.006 * 1.6;
  const border = state.border;

  geo.panels.forEach((rect, i) => {
    let r = rect;
    if (layout.key === 'grid9' || layout.key === 'grid4') {
      // Recompute with the slider gap: simplest robust approach is drawing at
      // native geometry and insetting panels when gap > default.
      if (gap !== 0.0096) {
        r = insetPanel(rect, gap * Math.min(w, h) - baseGap * 0.6);
      }
    }
    const slot = state.slots[i] || {};
    drawPhotoInPanel(ctx, images.get(slot.photo), r, slot.pan, slot.zoom, state.grade, slot.grade ? { filter: null, stops: null, filterKey: slot.grade } : null, slot.border || border);
    if (slot.grade) applyGrade(ctx, r, slot.grade, {});
  });

  if (geo.title) {
    if (geo.title.bottom) drawTitleBlockBottom(ctx, geo.title, state);
    else drawTitleBlock(ctx, geo.title, state, w, h);
  }
  // Skip the ribbon when the title block occupies the lower part of the cover
  // (it would collide with the lettering there).
  const titleLow = geo.title && geo.title.y + geo.title.h / 2 > h * 0.55;
  if (state.ribbon && !titleLow) {
    drawRibbon(ctx, { x: 0, y: 0, w, h }, state.ribbonText, {});
  }
  if (state.vignette) drawVignette(ctx, w, h, 0.5);
  if (state.grain) drawGrain(ctx, w, h, 0.10);
}

function insetPanel(rect, d) {
  if (!d || d <= 0) return rect;
  return { x: rect.x + d, y: rect.y + d, w: Math.max(8, rect.w - 2 * d), h: Math.max(8, rect.h - 2 * d), rot: rect.rot, frame: rect.frame };
}
