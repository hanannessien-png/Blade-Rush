---
name: Skia on web and browser smoke testing
description: How the Twirlblade web preview loads Skia, and how to drive it in a real browser when the Screenshot tool shows a blank canvas.
---

**Rule:** On web, Skia binds `global.CanvasKit` at import time, so CanvasKit must be loaded before the router entry is imported (`index.web.js` loads it, then dynamically imports the qualified entry). A gate component inside the tree is too late.
**Why:** A SkiaGate component approach failed; module-level `Skia` captured an undefined CanvasKit.
**How to apply:** Keep `package.json` "main" as `index` with separate `index.js` / `index.web.js`; never call Skia at module top level.

**Rule:** The Screenshot tool often captures the game route before the Skia canvas draws (blank background). Verify gameplay with local `chromium --headless=new --remote-debugging-port` driven over CDP (Node 24 has a global WebSocket), using `Emulation.setDeviceMetricsOverride` for a 400 px phone width.
**Why:** `--window-size` below ~500 px is clamped in headless Chrome, which made the layout look mis-scaled.
**How to apply:** Click by `aria-label` (DisplayText duplicates text for its outline, so innerText matching is noisy). Use `/game/<mode>?stage=N` (dev only) to jump to bosses and worlds.
