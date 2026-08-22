# Binary assets not included in this zip

Source code has no image/audio binaries attached — these need to be dropped
in before a production build. Everything below has a working code path that
degrades gracefully without it (see PetWidget.tsx's CSS fallback face, for
instance), so the app runs today with zero of these present.

| Path | What | Where to get it |
|---|---|---|
| `assets/pets/fumii-default/spritesheet.webp` | 8×9 grid, 192×208 frames, amber-hooded character | Recolor Penzilla's "Hooded Protagonist" (itch.io) to #F5A623 in Aseprite, export per FUMII_DESIGN.md → "Sprite Asset Recommendations" |
| `assets/tray-icon.png` | 16×16 tray icon | Simple amber fumii mark |
| `assets/icon.ico` / `icon.icns` / `icon.png` | App icons for electron-builder | 256×256 min |
| `assets/fonts/SpaceGrotesk-Variable.woff2` | UI font | Google Fonts (open license) |
| `assets/fonts/DepartureMono-Regular.woff2` | Mono/data font | departuremono.com (free) |
| `assets/sounds/wake.mp3` / `message.mp3` | Short chime + notification ping | Any CC0 UI sound pack |

None of these block `npm run dev` — the dashboard and chat run entirely on
CSS/React fallbacks until real art lands.
