// Neon Shore Cover Studio — application state, history (undo/redo), samples
// and photo loading. The state object is plain data so history is snapshots.

import { LAYOUTS, LAYOUT_KEYS, layoutByKey } from './layouts.js';
import { GRADES, GRADE_KEYS, gradeByKey } from './grades.js';

export const SAMPLES = ['pier', 'boulevard', 'friends-neon', 'man-pier', 'man-rooftop', 'woman-car'];
export const SIZES = [
  { key: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { key: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { key: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
  { key: 'story', label: '1080 × 1920', w: 1080, h: 1920 },
];

// 9-slot default: every sample used, repeats get different crops so the grid
// reads as a set of character vignettes rather than copy-paste tiles.
const DEFAULT_ASSIGNMENT = [
  ['pier', 1, 0, 0],
  ['woman-car', 1.18, 0.04, -0.03],
  ['friends-neon', 1.08, 0, 0.05],
  ['man-rooftop', 1.12, -0.05, 0],
  ['boulevard', 1, 0, 0],
  ['man-pier', 1.22, 0.05, 0.04],
  ['friends-neon', 1.35, -0.06, -0.05],
  ['man-pier', 1.06, 0, -0.06],
  ['woman-car', 1.28, -0.04, 0.05],
];

const DEFAULT_STATE = () => ({
  layout: 'grid9',
  grade: 'vice-sunset',
  title: 'Neon Shore',
  subtitle: 'welcome to the coast',
  titleFill: 'white',
  titleSize: 1,
  titlePos: 0.5,
  stars: 3,
  ribbon: true,
  ribbonText: 'Fresh Drop',
  grain: true,
  vignette: true,
  halftone: true,
  border: 'white',
  gap: 1,
  slots: DEFAULT_ASSIGNMENT.map(([photo, zoom, px, py]) => ({
    photo, zoom, pan: { x: px, y: py }, grade: null, border: null,
  })),
});

export function defaultState() {
  return DEFAULT_STATE();
}

export function maxSlots(state) {
  return layoutByKey(state.layout).slots;
}

// ---------------------------------------------------------------------------
// Image registry: sample photos + user uploads, all as Image objects
// ---------------------------------------------------------------------------

export function createImages() {
  const map = new Map(); // key -> {img, name}
  function set(key, img, name) {
    map.set(key, { img, name: name || key });
  }
  async function loadSample(key) {
    const img = new Image();
    img.src = `./samples/${key}.jpg`;
    await img.decode();
    set(key, img, key);
    return img;
  }
  async function loadFile(key, file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    set(key, img, file.name);
    return img;
  }
  function get(key) {
    const e = map.get(key);
    return e ? e.img : null;
  }
  function label(key) {
    const e = map.get(key);
    return e ? e.name : key;
  }
  async function loadAllSamples() {
    await Promise.all(SAMPLES.map(loadSample));
  }
  return { set, loadSample, loadFile, get, label, loadAllSamples, map, keys: () => [...map.keys()] };
}

// ---------------------------------------------------------------------------
// History: snapshot stack with undo/redo. slot mutations go through commit().
// ---------------------------------------------------------------------------

export function createHistory(state) {
  let stack = [snap(state)];
  let index = 0;
  function snap(s) {
    return JSON.stringify({ ...s, slots: s.slots.map((x) => ({ ...x, pan: { ...x.pan } })) });
  }
  function commit(s) {
    stack = stack.slice(0, index + 1);
    stack.push(snap(s));
    if (stack.length > 60) stack.shift();
    index = stack.length - 1;
  }
  function restore(s, json) {
    const obj = JSON.parse(json);
    Object.keys(obj).forEach((k) => (s[k] = obj[k]));
  }
  function undo(s) {
    if (index > 0) {
      index--;
      restore(s, stack[index]);
      return true;
    }
    return false;
  }
  function redo(s) {
    if (index < stack.length - 1) {
      index++;
      restore(s, stack[index]);
      return true;
    }
    return false;
  }
  return { commit, undo, redo, canUndo: () => index > 0, canRedo: () => index < stack.length - 1 };
}

// ---------------------------------------------------------------------------
// Randomize / reset / reflow on layout switch
// ---------------------------------------------------------------------------

export function randomizeState(state, images) {
  state.layout = LAYOUT_KEYS[(Math.random() * LAYOUT_KEYS.length) | 0];
  state.grade = GRADE_KEYS[(Math.random() * GRADE_KEYS.length) | 0];
  state.titleFill = Math.random() < 0.4 ? 'sunset' : 'white';
  state.stars = 1 + ((Math.random() * 5) | 0);
  state.grain = Math.random() < 0.7;
  state.vignette = Math.random() < 0.8;
  const keys = images.keys().filter((k) => !SAMPLES.includes(k) || true);
  const pool = images.keys();
  const n = layoutByKey(state.layout).slots;
  state.slots = Array.from({ length: Math.max(n, 9) }, (_, i) => ({
    photo: pool[(Math.random() * pool.length) | 0] || SAMPLES[i % SAMPLES.length],
    zoom: 1 + Math.random() * 0.5,
    pan: { x: (Math.random() - 0.5) * 0.15, y: (Math.random() - 0.5) * 0.15 },
    grade: Math.random() < 0.25 ? GRADE_KEYS[(Math.random() * GRADE_KEYS.length) | 0] : null,
    border: null,
  }));
}

// When the layout changes, keep every photo assigned to a slot (wrap around).
export function reflowSlots(state) {
  const n = layoutByKey(state.layout).slots;
  if (state.slots.length < Math.max(n, 9)) {
    while (state.slots.length < Math.max(n, 9)) {
      state.slots.push({ photo: SAMPLES[state.slots.length % SAMPLES.length], zoom: 1, pan: { x: 0, y: 0 }, grade: null, border: null });
    }
  }
}
