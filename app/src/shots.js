// Neon Shore Cover Studio — shot scenes (deterministic screenshots).
// ?shot=cover&photo=<sample>&caption=<text>&layout=<key>&grade=<key>
//   renders ONLY the finished cover, filling the viewport, no UI chrome.
// ?shot=editor&... renders the full editor with that photo and caption loaded.
// window.__shotReady is set once painted so a screenshot tool can wait.

import { renderCover } from './render.js';
import { defaultState, createImages, SAMPLES, reflowSlots } from './state.js';
import { LAYOUTS } from './layouts.js';

export async function runShot(query) {
  const state = defaultState();
  const images = createImages();
  await Promise.all([images.loadAllSamples(), document.fonts.ready]);

  const photo = query.get('photo');
  const caption = query.get('caption');
  if (photo && SAMPLES.includes(photo) && state.slots[0]) state.slots[0].photo = photo;
  if (caption) state.title = caption;
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('titleFill')) state.titleFill = query.get('titleFill');
  if (query.get('stars')) state.stars = Number(query.get('stars')) || 0;
  reflowSlots(state);

  const canvas = document.getElementById('cover');
  const layoutDef = LAYOUTS.find((l) => l.key === state.layout);
  const vw = window.innerWidth, vh = window.innerHeight;
  const scale = Math.min(1920 / vw, 2);
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  renderCover(canvas, { ...state, layoutDef }, images);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
