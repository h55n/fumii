# fumii Assets

This directory contains all static assets. Files here are in **placeholder/stub** state.
Replace them with real art before shipping.

---

## sprites/

| File | Purpose | Spec |
|------|---------|------|
| `fumii_sheet.png` | Main animated sprite sheet | 8 cols × 9 rows, 48×48px per frame, RGBA PNG |
| `fumii_tray_16.png` | System tray icon | 16×16px, RGBA PNG |

### Sprite sheet layout

Each row = one animation state. Frames read left-to-right.

```
Row 0 → idle       (7 frames at 4fps)
Row 1 → listening  (4 frames at 6fps)
Row 2 → thinking   (5 frames at 7fps)
Row 3 → speaking   (5 frames at 9fps)
Row 4 → happy      (6 frames at 11fps)
Row 5 → concerned  (4 frames at 3fps)
Row 6 → sleepy     (4 frames at 2fps)
Row 7 → excited    (6 frames at 12fps)
Row 8 → waving     (7 frames at 8fps)
```

**Recommended source:** [Hooded Protagonist by Penzilla](https://penzilla.itch.io/hooded-protagonist)  
Free on itch.io. Swap palette to amber `#F5A623` using Aseprite.

---

## scenes/

| File | Purpose | Spec |
|------|---------|------|
| `desk_night.png` | Background behind fumii sprite | 280×220px, RGBA PNG |

The scene is overlaid with CSS animations (rain, lamp glow, stars) from `SceneBackground.tsx`.
The PNG provides the base — a dark night desk with a window.

---

## fonts/

| File | Purpose |
|------|---------|
| `SpaceGrotesk-Variable.woff2` | Primary UI font — [download](https://fonts.google.com/specimen/Space+Grotesk) |
| `DepartureMono-Regular.woff2` | Monospaced tag/metadata font — [download](https://departuremono.com) |

Both fonts fall back to system fonts if missing. Add the real files for polished output.

---

## sounds/

| File | Purpose | Notes |
|------|---------|-------|
| `wake.mp3` | Soft chime when chat opens | Optional — 0.5–1s, subtle |
| `message.mp3` | Subtle notification ping | Optional — short, non-intrusive |

Sounds are not played in Phase 1 by default. Integrate them via `Audio()` in `SpriteWindow.tsx`.

---

## Adding real assets

1. Create or source your pixel art
2. Name files exactly as listed above
3. Place in this directory
4. Restart `npm run dev` — assets load at runtime, no rebuild needed
