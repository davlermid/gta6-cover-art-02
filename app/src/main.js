// Neon Shore Cover Studio — editor UI wiring, interactions, shot scenes.

import { renderCover, fontReady, FONTS } from './render.js';
import { createImages, createHistory, defaultState, randomizeState, reflowSlots, SIZES, SAMPLES } from './state.js';
import { exportPNG } from './export.js';
import { LAYOUTS } from './layouts.js';
import { GRADES } from './grades.js';

const state = defaultState();
const images = createImages();
const history = createHistory(state);
let selected = 0;

const $ = (sel) => document.querySelector(sel);
const canvas = $('#cover');

// ---------------------------------------------------------------------------
// Rendering the live canvas + panel overlay
// ---------------------------------------------------------------------------

const PREVIEW_SIZES = { square: [1080, 1080], portrait: [1080, 1350], wide: [1920, 1080], story: [1080, 1920] };
let previewSize = 'square';

function layoutDef() {
  return LAYOUTS.find((l) => l.key === state.layout);
}

function draw() {
  const [w, h] = PREVIEW_SIZES[previewSize];
  canvas.width = w;
  canvas.height = h;
  canvas.dataset.size = previewSize;
  renderCover(canvas, { ...state, layoutDef: layoutDef() }, images);
  updateOverlay();
}

// The overlay maps panel rects to screen coords so clicks/drags hit panels.
function panelRects() {
  const [w, h] = PREVIEW_SIZES[previewSize];
  return layoutDef().panels(w, h).panels;
}

function screenRect(r) {
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  const scaleX = cw / canvas.width, scaleY = ch / canvas.height;
  return {
    x: (r.x / canvas.width) * cw,
    y: (r.y / canvas.height) * ch,
    w: (r.w / canvas.width) * cw,
    h: (r.h / canvas.height) * ch,
    scaleX, scaleY,
    rot: r.rot || 0,
  };
}

function updateOverlay() {
  const overlay = $('#panels');
  const rects = panelRects();
  overlay.innerHTML = '';
  rects.forEach((r, i) => {
    const s = screenRect(r);
    const d = document.createElement('div');
    d.className = 'panel-hit' + (i === selected && rects.length > 1 ? ' selected' : '');
    d.style.left = s.x + 'px';
    d.style.top = s.y + 'px';
    d.style.width = s.w + 'px';
    d.style.height = s.h + 'px';
    d.dataset.i = i;
    if (r.rot) d.style.transform = `rotate(${r.rot}rad)`;
    overlay.appendChild(d);
  });
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function buildControls() {
  const layoutSel = $('#layout');
  LAYOUTS.forEach((l) => {
    const o = document.createElement('option');
    o.value = l.key;
    o.textContent = l.label;
    layoutSel.appendChild(o);
  });
  const gradeSel = $('#grade');
  GRADES.forEach((gr) => {
    const o = document.createElement('option');
    o.value = gr.key;
    o.textContent = gr.label;
    gradeSel.appendChild(o);
  });
  const panelGradeSel = $('#panelGrade');
  GRADES.forEach((gr) => {
    const o = document.createElement('option');
    o.value = gr.key;
    o.textContent = gr.label;
    panelGradeSel.appendChild(o);
  });
  const sizeSel = $('#size');
  SIZES.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.key;
    o.textContent = s.label;
    sizeSel.appendChild(o);
  });
}

function syncControls() {
  $('#layout').value = state.layout;
  $('#grade').value = state.grade;
  $('#size').value = previewSize;
  $('#title').value = state.title;
  $('#subtitle').value = state.subtitle;
  $('#ribbonText').value = state.ribbonText;
  $('#titleSize').value = state.titleSize;
  $('#titlePos').value = state.titlePos;
  $('#gap').value = state.gap;
  $('#titleFill').value = state.titleFill;
  $('#border').value = state.border;
  $('#stars').value = state.stars;
  for (const [id, key] of [['toggleRibbon', 'ribbon'], ['toggleGrain', 'grain'], ['toggleVignette', 'vignette'], ['toggleHalftone', 'halftone']])
    $('#' + id).checked = state[key];
  $('#selectedLabel').textContent = `Panel ${selected + 1}`;
  const slot = state.slots[selected] || {};
  $('#panelGrade').value = slot.grade || '';
  $('#panelZoom').value = slot.zoom || 1;
  $('#photoName').textContent = slot.photo ? images.label(slot.photo) : 'empty';
}

function commitAndDraw() {
  history.commit(state);
  draw();
  syncControls();
}

function wireControls() {
  $('#layout').addEventListener('change', (e) => {
    state.layout = e.target.value;
    reflowSlots(state);
    selected = Math.min(selected, LAYOUTS.find((l) => l.key === state.layout).slots - 1);
    commitAndDraw();
  });
  $('#grade').addEventListener('change', (e) => {
    state.grade = e.target.value;
    commitAndDraw();
  });
  $('#size').addEventListener('change', (e) => {
    previewSize = e.target.value;
    draw();
  });
  $('#title').addEventListener('input', (e) => {
    state.title = e.target.value;
    draw();
  });
  $('#title').addEventListener('change', commitAndDraw);
  $('#subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    draw();
  });
  $('#subtitle').addEventListener('change', commitAndDraw);
  $('#ribbonText').addEventListener('input', (e) => {
    state.ribbonText = e.target.value;
    draw();
  });
  $('#ribbonText').addEventListener('change', commitAndDraw);
  $('#titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    draw();
  });
  $('#titleSize').addEventListener('change', commitAndDraw);
  $('#titlePos').addEventListener('input', (e) => {
    state.titlePos = Number(e.target.value);
    draw();
  });
  $('#titlePos').addEventListener('change', commitAndDraw);
  $('#gap').addEventListener('input', (e) => {
    state.gap = Number(e.target.value);
    draw();
  });
  $('#gap').addEventListener('change', commitAndDraw);
  $('#titleFill').addEventListener('change', (e) => {
    state.titleFill = e.target.value;
    commitAndDraw();
  });
  $('#border').addEventListener('change', (e) => {
    state.border = e.target.value;
    commitAndDraw();
  });
  $('#panelGrade').addEventListener('change', (e) => {
    const slot = state.slots[selected];
    if (slot) slot.grade = e.target.value || null;
    commitAndDraw();
  });
  $('#panelZoom').addEventListener('input', (e) => {
    const slot = state.slots[selected];
    if (slot) slot.zoom = Number(e.target.value);
    draw();
  });
  $('#panelZoom').addEventListener('change', commitAndDraw);
  $('#stars').addEventListener('input', (e) => {
    state.stars = Number(e.target.value);
    draw();
  });
  $('#stars').addEventListener('change', commitAndDraw);
  // Clickable star meter.
  $('#starMeter').innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'star-btn';
    b.textContent = '★';
    b.title = `${i} star${i > 1 ? 's' : ''}`;
    b.addEventListener('click', () => {
      state.stars = i;
      commitAndDraw();
    });
    $('#starMeter').appendChild(b);
  }
  for (const [id, key] of [['toggleRibbon', 'ribbon'], ['toggleGrain', 'grain'], ['toggleVignette', 'vignette'], ['toggleHalftone', 'halftone']])
    $('#' + id).addEventListener('change', (e) => {
      state[key] = e.target.checked;
      commitAndDraw();
    });

  // Undo / redo / randomize / reset.
  $('#undo').addEventListener('click', () => {
    if (history.undo(state)) draw();
    syncControls();
  });
  $('#redo').addEventListener('click', () => {
    if (history.redo(state)) draw();
    syncControls();
  });
  $('#randomize').addEventListener('click', () => {
    randomizeState(state, images);
    commitAndDraw();
  });
  $('#reset').addEventListener('click', () => {
    Object.assign(state, defaultState());
    commitAndDraw();
  });

  // Export buttons.
  for (const size of SIZES) {
    const b = $('#export-' + size.key);
    if (b) b.addEventListener('click', async () => {
      $('#status').textContent = `Exporting ${size.label}…`;
      await fontReady();
      const name = await exportPNG(state, images, size.key);
      $('#status').textContent = `Saved ${name}`;
    });
  }

  // Upload: file input + drag & drop onto the canvas.
  $('#photoInput').addEventListener('change', async (e) => {
    await addFiles([...e.target.files]);
    e.target.value = '';
  });
  const dropzone = $('#canvasWrap');
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragging');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragging');
    await addFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith('image/')));
  });

  // Photos tray: click a photo to fill the selected panel.
  const tray = $('#tray');
  function renderTray() {
    tray.innerHTML = '';
    images.keys().forEach((key) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'tray-item';
      d.title = images.label(key);
      d.textContent = images.label(key).replace(/\.[a-z]+$/i, '').slice(0, 14);
      d.addEventListener('click', () => {
        const slot = state.slots[selected];
        if (slot) {
          slot.photo = key;
          slot.pan = { x: 0, y: 0 };
          slot.zoom = 1;
          commitAndDraw();
        }
      });
      tray.appendChild(d);
    });
  }
  window.__renderTray = renderTray;
  renderTray();
}

async function addFiles(files) {
  let added = 0;
  for (const f of files) {
    const key = 'up' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    try {
      await images.loadFile(key, f);
      const slot = state.slots[selected + added] || state.slots[selected];
      if (slot) slot.photo = key;
      added++;
    } catch (err) {
      $('#status').textContent = `Could not load ${f.name}`;
    }
  }
  if (added) {
    window.__renderTray();
    $('#status').textContent = `Added ${added} photo${added > 1 ? 's' : ''}`;
    commitAndDraw();
  }
}

// ---------------------------------------------------------------------------
// Panel interactions: click to select, drag to pan, wheel to zoom.
// ---------------------------------------------------------------------------

function wirePanels() {
  const overlay = $('#panels');
  let dragging = false, startX = 0, startY = 0, startPan = null, moved = false;

  overlay.addEventListener('pointerdown', (e) => {
    const hit = e.target.closest('.panel-hit');
    if (!hit) return;
    const idx = Number(hit.dataset.i);
    if (idx !== selected) {
      selected = idx;
      syncControls();
      updateOverlay();
    }
    const slot = state.slots[selected];
    if (!slot) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    startPan = { ...slot.pan };
    overlay.setPointerCapture(e.pointerId);
  });
  overlay.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const slot = state.slots[selected];
    if (!slot) return;
    // Pan in cover-pixel units so it feels identical at any preview scale.
    const s = screenRect(panelRects()[selected] || { x: 0, y: 0, w: 1, h: 1 });
    const dx = ((e.clientX - startX) / s.scaleX) / canvas.width;
    const dy = ((e.clientY - startY) / s.scaleY) / canvas.height;
    if (Math.abs(dx) + Math.abs(dy) > 0.002) moved = true;
    slot.pan = { x: startPan.x + dx, y: startPan.y + dy };
    draw();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    if (moved) commitAndDraw();
  };
  overlay.addEventListener('pointerup', endDrag);
  overlay.addEventListener('pointercancel', endDrag);

  overlay.addEventListener('wheel', (e) => {
    const hit = e.target.closest('.panel-hit');
    if (!hit) return;
    e.preventDefault();
    const i = Number(hit.dataset.i);
    const slot = state.slots[i];
    if (!slot) return;
    slot.zoom = Math.min(4, Math.max(1, (slot.zoom || 1) + (e.deltaY < 0 ? 0.08 : -0.08)));
    $('#panelZoom').value = slot.zoom;
    draw();
  }, { passive: false });
}

// ---------------------------------------------------------------------------
// Boot: samples, query params, shot scenes
// ---------------------------------------------------------------------------

function applyQuery() {
  const q = new URLSearchParams(location.search);
  const photo = q.get('photo');
  const caption = q.get('caption');
  if (photo) {
    const key = SAMPLES.includes(photo) ? photo : SAMPLES[0];
    if (state.slots[0]) state.slots[0].photo = key;
  }
  if (caption) state.title = caption;
  if (q.get('layout')) state.layout = q.get('layout');
  if (q.get('grade')) state.grade = q.get('grade');
  if (q.get('titleFill')) state.titleFill = q.get('titleFill');
  if (q.get('stars')) state.stars = Number(q.get('stars')) || 0;
  reflowSlots(state);
}

async function boot() {
  buildControls();
  wireControls();
  wirePanels();
  await Promise.all([images.loadAllSamples(), document.fonts.ready]);
  applyQuery();
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    document.body.classList.add('shot-' + shot);
    if (shot === 'cover') {
      await shotCover();
    } else {
      draw();
      syncControls();
      markShotsReady();
    }
    return;
  }
  draw();
  syncControls();
  $('#status').textContent = 'Ready — click a panel, drag to move, wheel to zoom.';
}

// Cover scene: a finished cover filling the viewport, no UI chrome.
async function shotCover() {
  document.body.classList.add('shot-cover');
  const vw = window.innerWidth, vh = window.innerHeight;
  const scale = Math.min(1920 / vw, 2);
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  renderCover(canvas, { ...state, layoutDef: layoutDef() }, images);
  markShotsReady();
}

function markShotsReady() {
  document.body.dataset.ready = '1';
  window.__shotReady = true;
}

boot();
