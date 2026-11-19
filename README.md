# Neon Shore Cover Studio

Neon Shore Cover Studio is an offline web app that turns your photos and a caption into GTA-6-style poster cover art: multi-panel photo grids with per-panel pan and zoom, six color grades (Vice Sunset, Neon Night, Golden Hour, Teal & Pink, Mono Ink, Candy Pop), bold Archivo Black title lettering with the classic thick black outline or a sunset-gradient fill, a neon-glow Pacifico subtitle, a Bebas Neue badge ribbon, a star heat meter, film grain, vignette and halftone effects — exported as crisp PNGs at 1080×1080, 1080×1350, 1920×1080 and 1080×1920. Everything renders on a Canvas 2D pipeline that is shared between the live preview and the export, so what you see is exactly what you download.

## Run

```bash
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies, no network requests — vanilla ES modules, Canvas 2D and the local fonts in `app/fonts/`.

## Features

- **6 layouts**: 9-panel grid (3×3) with title block, 4-panel grid, hero + three, full-bleed single photo, tilted snapshot collage, split duo. Switching keeps all photos and the caption.
- **Any photo, any panel**: multi-file upload and drag-and-drop, click a panel to select it, drag inside to reposition, slider or mouse wheel to zoom; six sample photos are preloaded so the first screen is already a finished cover.
- **6 color grades** applied as canvas filter + gradient recipes, one for the whole cover with optional per-panel overrides.
- **Poster lettering**: editable main title (white with thick black outline, or sunset gradient), editable neon subtitle, badge ribbon text; title size and vertical position sliders; all text is drawn on canvas so the exported PNG matches the preview.
- **Extras**: clickable 0–5 star heat meter, badge ribbon toggle, film grain, vignette, halftone title block, panel border styles (white frame / inked edges / none), panel gap slider.
- **Export**: one-click PNG at 1080×1080, 1080×1350, 1920×1080 and 1080×1920 (story), rendered full-resolution on an offscreen canvas, filename from the title.
- **Undo / redo**, **randomize** (random layout, grade and photo assignment), **reset**.
- **Deterministic screenshot scenes** via query params:
  - `?shot=cover&photo=<sample>&caption=<text>&layout=<name>&grade=<name>` — the finished cover only, filling the viewport, no UI.
  - `?shot=editor&photo=...&caption=...` — the full editor with that photo and caption loaded.

Sample photos in `app/samples/` were made for make.fun and are free to use; fonts are OFL-licensed. All code is original work written for this bounty. No Rockstar Games assets, logos or names are used — all titles are invented.

[![make.fun](https://make.fun/badge.svg)](https://make.fun/bounty/gta6-cover-art-02)
