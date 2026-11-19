// Neon Shore Cover Studio — export helpers.
// Renders the cover at full resolution on an offscreen canvas and downloads
// the PNG named after the title. No dependencies; Canvas 2D only.

import { renderCover } from './render.js';
import { SIZES } from './state.js';

export function sizeByKey(key) {
  return SIZES.find((s) => s.key === key) || SIZES[0];
}

function safeName(title) {
  const base = (title || 'neon-shore').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'neon-shore';
  return base;
}

export async function exportPNG(state, images, sizeKey) {
  const size = sizeByKey(sizeKey);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  await document.fonts.ready;
  renderCover(off, state, images);
  const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName(state.title)}-${size.w}x${size.h}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return a.download;
}

// Used by the deterministic screenshot scenes: render a cover at an exact
// size and return the canvas (no download).
export function coverCanvas(state, images, sizeKey) {
  const size = sizeByKey(sizeKey);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, state, images);
  return off;
}
