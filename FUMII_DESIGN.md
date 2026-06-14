# fumii — Design System
*you're never really alone*

---

## Design Philosophy

fumii's visual identity lives at the intersection of **pixel warmth** and **soft modernism**. She is not corporate. She is not minimal-for-minimal's-sake. She is the UI equivalent of a friend's bedroom at 11pm — warm light, familiar clutter, things that have meaning.

Every design decision asks one question: *does this feel like something a person made, for a person they care about?*

---

## CSS Custom Properties — The Complete Token Set

All color values in components and CSS **must** use these variables. No hardcoded hex anywhere in component code. The root declaration belongs in a `:root` block in your global CSS file, loaded before any component renders.

```css
:root {
  /* Backgrounds */
  --color-bg:              #0F0F14;   /* Deep Desk — primary bg, near-black with blue-purple */
  --color-surface:         #1A1A24;   /* Ink Panel — cards, panels, chat window bg */
  --color-surface-raised:  #22223A;   /* Lifted — hover states, elevated cards */

  /* Brand */
  --color-amber:           #F5A623;   /* Amber Hoodie — fumii's signature color */
  --color-amber-soft:      rgba(245, 166, 35, 0.13); /* Glow fills, hover backgrounds */

  /* Accent */
  --color-green:           #CAFFA6;   /* Spring Meadow — positive states, memory tags */
  --color-blue:            #A9E0F1;   /* Glacial Sky — links, idle shimmer */
  --color-teal:            #204654;   /* Deep accent for hover on dark surfaces */
  --color-mist:            #F7F9E1;   /* Near-white on dark backgrounds */

  /* Text */
  --color-text-primary:    #EEEAE0;   /* Warm White — all primary text */
  --color-text-secondary:  #9E9A8E;   /* Faded Linen — timestamps, metadata */
  --color-text-fumii:      #F5A623;   /* fumii's words — always amber */

  /* Utility */
  --color-border:          rgba(255, 255, 255, 0.06); /* Ghost Line — dividers */
  --color-danger:          #FF6B6B;   /* Rose — errors, destructive actions */

  /* Glows */
  --glow-amber:    0 0 20px rgba(245, 166, 35, 0.25), 0 0 60px rgba(245, 166, 35, 0.08);
  --glow-blue:     0 0 20px rgba(169, 224, 241, 0.19), 0 0 60px rgba(169, 224, 241, 0.06);
  --glow-green:    0 0 12px rgba(202, 255, 166, 0.12);

  /* Spacing */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;
  --space-2xl: 64px;
  --space-3xl: 96px;

  /* Border radius */
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-xl:   32px;
  --radius-full: 9999px;

  /* Typography */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono:    'Departure Mono', 'Courier New', monospace;
}
```

---

## Color Palette Reference

| Token | Name | Hex | Use |
|---|---|---|---|
| `--color-bg` | Deep Desk | `#0F0F14` | Primary background — near-black, blue-purple tint |
| `--color-surface` | Ink Panel | `#1A1A24` | Cards, panels, chat window background |
| `--color-surface-raised` | Lifted | `#22223A` | Hover states, elevated cards |
| `--color-amber` | Amber Hoodie | `#F5A623` | fumii's color — her hoodie, active states |
| `--color-amber-soft` | Amber Glow | `rgba(245,166,35,0.13)` | Glow fills, hover backgrounds |
| `--color-green` | Spring Meadow | `#CAFFA6` | Positive signals, memory tags |
| `--color-blue` | Glacial Sky | `#A9E0F1` | Secondary accent, idle shimmer |
| `--color-teal` | Teal Waters | `#204654` | Deep accent on dark surfaces |
| `--color-mist` | Morning Mist | `#F7F9E1` | Near-white, rare contrast use |
| `--color-text-primary` | Warm White | `#EEEAE0` | All primary text |
| `--color-text-secondary` | Faded Linen | `#9E9A8E` | Timestamps, metadata, captions |
| `--color-text-fumii` | Amber Speak | `#F5A623` | fumii's chat messages |
| `--color-border` | Ghost Line | `rgba(255,255,255,0.06)` | Subtle borders, dividers |
| `--color-danger` | Rose | `#FF6B6B` | Errors, destructive actions |

---

## Typography

### Primary — Space Grotesk
Used for almost everything UI. The rounded terminals keep it warm without being playful. It bridges pixel-art and clean UI perfectly.

```css
font-family: var(--font-display);
```

| Role | Weight | Size | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| Display | 700 | 48–72px | 1.1 | -0.03em | App name, hero moments |
| Heading 1 | 600 | 28–36px | 1.2 | -0.02em | Section titles in dashboard |
| Heading 2 | 500 | 20–24px | 1.3 | -0.01em | Card headers, sidebar labels |
| Body | 400 | 14–16px | 1.6 | 0 | Paragraphs, descriptions |
| Caption | 400 | 11–12px | 1.5 | 0.04em | Timestamps, tags, metadata |
| fumii Voice | 400 | 14px | 1.7 | 0.01em | Chat messages — slightly open |

### Secondary — Departure Mono
Used sparingly — memory tags, technical labels, keyboard shortcut hints. Signals "this is data" without being retro.

```css
font-family: var(--font-mono);
```

Typical usage: 11px, letter-spacing 0.06em. Only for tags and metadata, never for body text or headings.

### Anti-patterns
- No serif fonts anywhere
- No all-caps headings (small labels only, with 0.1em letter-spacing max)
- Never tight line-height on chat messages — fumii's words need breathing room

---

## Spacing & Layout

4px base unit. All spacing is multiples of 4 — use the `--space-*` tokens.

```
xs:  4px    sm:  8px    md: 16px
lg: 24px    xl: 40px   2xl: 64px    3xl: 96px
```

---

## Component Styles

All examples use CSS custom properties only. No hardcoded hex.

### Chat Bubbles

**User message:**
```css
.chat-bubble--user {
  background: var(--color-surface-raised);
  color: var(--color-text-primary);
  border-radius: 16px 16px 4px 16px;
  padding: 10px 14px;
  font-family: var(--font-display);
  font-size: 14px;
  line-height: 1.6;
  max-width: 86%;
  align-self: flex-end;
}
```

**fumii message:**
```css
.chat-bubble--fumii {
  background: transparent;
  color: var(--color-text-fumii);
  border-left: 2px solid var(--color-amber);
  padding: 10px 14px 10px 16px;
  font-family: var(--font-display);
  font-size: 14px;
  line-height: 1.7;  /* fumii speaks in an open, unhurried way */
  max-width: 92%;
  align-self: flex-start;
}
```

No harsh chat bubble backgrounds for fumii. Her words sit open, like she's just speaking.

### Memory Tags
```css
.memory-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--color-green);
  background: rgba(202, 255, 166, 0.06);
  border: 1px solid rgba(202, 255, 166, 0.19);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  display: inline-block;
}
```

### Mood Signal Pills

```css
.mood-pill { border-radius: var(--radius-full); padding: 4px 12px; font-size: 12px; font-family: var(--font-display); }

.mood-pill--happy    { background: rgba(202, 255, 166, 0.12); color: var(--color-green); }
.mood-pill--stressed { background: rgba(255, 107, 107, 0.12); color: var(--color-danger); }
.mood-pill--tired    { background: rgba(169, 224, 241, 0.12); color: var(--color-blue); }
.mood-pill--neutral  { background: rgba(158, 154, 142, 0.12); color: var(--color-text-secondary); }
.mood-pill--excited  { background: rgba(245, 166, 35, 0.12);  color: var(--color-amber); }
```

### Buttons

**Primary (action):**
```css
.btn-primary {
  background: var(--color-amber);
  color: var(--color-bg);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: filter 80ms ease, box-shadow 80ms ease;
}
.btn-primary:hover {
  filter: brightness(1.1);
  box-shadow: var(--glow-amber);
}
```

**Ghost (secondary):**
```css
.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-family: var(--font-display);
  font-size: 14px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 80ms ease;
}
.btn-ghost:hover { background: var(--color-surface-raised); }
```

**Destructive:**
```css
.btn-destructive {
  background: transparent;
  border: 1px solid rgba(255, 107, 107, 0.25);
  color: var(--color-danger);
  font-family: var(--font-display);
  font-size: 14px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 80ms ease;
}
.btn-destructive:hover { background: rgba(255, 107, 107, 0.09); }
```

---

## The Sprite Window

### Critical rendering notes for Electron transparent windows

Transparent Electron windows on Windows have specific constraints:
- `app.disableHardwareAcceleration()` must be called before `app.whenReady()` — without it, transparency flickers
- `app.commandLine.appendSwitch('disable-gpu')` is required as a belt-and-suspenders for stability
- The window background must be `transparent` (BrowserWindow option), not a color
- The HTML `<body>` and `#root` element must have `background: transparent` in CSS
- Do **not** set a `backgroundColor` on the sprite BrowserWindow — it overrides transparency

```css
/* sprite.html global styles */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root {
  background: transparent;
  overflow: hidden;
  width: 280px;
  /* height adjusts as window resizes */
}
```

### Visual layout

```
280px wide sprite window (at rest: 220px tall)
┌─────────────────────────────┐
│   SceneBackground (CSS)     │  ← rain, lamp glow, stars
│   ┌─────────────────────┐   │
│   │   FumiiSprite       │   │  ← Canvas 2D, 120×120px, centered
│   │   (canvas)          │   │
│   └─────────────────────┘   │
└─────────────────────────────┘

When chat opens (window expands to 700px tall):
┌─────────────────────────────┐
│   ChatOverlay               │  ← 480px — slides down from top
│   (frosted glass panel)     │
├─────────────────────────────┤
│   SceneBackground + Sprite  │  ← 220px — unchanged
└─────────────────────────────┘
```

### Sprite scene design

```
Scene background:    #0A0A12  (slightly deeper than bg — she's in a room)
Desk lamp light:     radial-gradient from upper-left, color amber, ~12% opacity
Rain on window:      CSS striped animation, color --color-blue, 8% opacity
fumii's glow:        very faint --glow-amber beneath the sprite canvas
Stars (window):      small --color-mist dots at 60% opacity, slow CSS drift
```

No sharp edges anywhere — the scene fades to transparent at all borders using a `mask-image` radial gradient:

```css
.scene-container {
  mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 60%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 60%, transparent 100%);
}
```

**Hover interaction:** a faint amber ring (1px border, 30% opacity) appears around the sprite canvas when hovered. Cursor becomes `pointer`.

```css
canvas:hover {
  filter: drop-shadow(0 0 8px rgba(245, 166, 35, 0.3));
}
```

---

## The Chat Overlay

Slides up from within the sprite window (the window itself expands upward via `setBounds()`).

```css
.chat-overlay {
  position: absolute;
  bottom: 220px;       /* sits directly above the sprite scene */
  left: 0;
  right: 0;
  height: 480px;
  background: rgba(26, 26, 36, 0.88);  /* --color-surface at 88% opacity */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl) var(--radius-xl) var(--radius-md) var(--radius-md);
  box-shadow: 0 -4px 40px rgba(0,0,0,0.38), var(--glow-amber);
  display: flex;
  flex-direction: column;
}
```

> **Note:** `backdrop-filter` requires the window to NOT be fully transparent in that region. Since we use an rgba background (not transparent), this works correctly.

**Header area:** fumii's name (`--color-text-fumii`, Space Grotesk 13px SemiBold) with a 6px status dot that pulses:

```css
.status-dot {
  width: 6px; height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-green);
}
.status-dot--listening { background: var(--color-green); animation: pulse 1.2s ease-in-out infinite; }
.status-dot--thinking  { background: var(--color-amber); animation: pulse 0.8s ease-in-out infinite; }
.status-dot--idle      { background: var(--color-text-secondary); animation: none; }

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.85); }
}
```

**Message list:** No visible scrollbar. Masked with a gradient fade at top (newest message at bottom):
```css
.chat-history {
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%);
}
```

**Input bar:**
```css
.chat-input {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  color: var(--color-text-primary);
  font-family: var(--font-display);
  font-size: 14px;
  transition: border-color 120ms ease;
  outline: none;
}
.chat-input:focus {
  border-color: rgba(245, 166, 35, 0.6);
}
```

**Voice button:** 36×36px circle. Idle: `--color-surface-raised`. Active: pulsing amber.

```css
.voice-btn         { width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--color-surface-raised); border: 1px solid var(--color-border); cursor: pointer; }
.voice-btn--active { background: var(--color-amber-soft); border-color: var(--color-amber); animation: pulse 0.8s ease-in-out infinite; }
```

### Typing Indicator

Three amber dots, staggered scale pulse:

```css
.typing-indicator { display: flex; gap: 5px; padding: 12px 16px; }
.typing-dot {
  width: 6px; height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-amber);
  animation: typing-bounce 1.4s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40%           { transform: scale(1.0); opacity: 1.0; }
}
```

---

## The Dashboard App

### Window configuration notes

The dashboard BrowserWindow uses `backgroundColor: '#0F0F14'` (matching `--color-bg`). This is intentional — unlike the sprite window, the dashboard is not transparent. Setting a background color prevents the white flash on window creation before React mounts.

The dashboard uses `frame: false` with a custom React `TitleBar` component that handles minimize, maximize/restore, and close (which hides the window rather than destroying it).

### Layout Structure

```
┌────────────────────────────────────────────────────────┐
│  TitleBar: "fumii" wordmark + window controls  ← 40px │
├──────────────┬─────────────────────────────────────────┤
│              │  Page content area                       │
│  Sidebar     │                                          │
│  220px       │  padding: 32px                           │
│              │  background: var(--color-bg)             │
│  bg:         │                                          │
│  --color-    │                                          │
│  surface     │                                          │
│              │                                          │
└──────────────┴─────────────────────────────────────────┘
```

```css
.dashboard-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-display);
  overflow: hidden;
  user-select: none; /* Electron desktop app — disable text selection globally */
}

.dashboard-body    { display: flex; flex: 1; overflow: hidden; }
.sidebar           { width: 220px; background: var(--color-surface); flex-shrink: 0; overflow-y: auto; }
.main-content      { flex: 1; overflow-y: auto; padding: var(--space-xl); }
```

### Sidebar navigation

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px var(--space-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: color 80ms ease, border-color 80ms ease, background 80ms ease;
}
.nav-item:hover         { background: var(--color-surface-raised); color: var(--color-text-primary); }
.nav-item.active        { border-left-color: var(--color-amber); color: var(--color-amber); }
```

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
}
```

### Dashboard Sections

**Home / Today**
- fumii's mood read for you (last 24h pattern) — single large mood pill
- Quick message bar to start a conversation directly (sends to sprite window via IPC)
- Today's episode summary if a conversation happened
- Streak: days fumii has been running

**Memory**
- Grid of episodic memory cards, newest first
- Each card: summary text (2–3 lines), mood pill, tag chips (Departure Mono 11px), relative date
- Search bar at top — keyword filter mirroring what fumii does internally
- Hover to expand full summary

**Mood Timeline**
- 7-day bar at top: one mood pill per day
- Below: simple area chart of mood signals as numeric values (neutral=0, happy=2, stressed=-1, tired=-1, excited=3)
- Label style: Departure Mono, 11px, `--color-text-secondary`

**Conversations**
- List of past sessions: date + turn count + dominant mood + first user message as preview
- Click: read-only transcript view — user messages in `--color-text-primary`, fumii in `--color-text-fumii`

**Settings**
- Clean form layout
- Sections: Your Profile, fumii's Voice, LLM Provider, Appearance, Privacy
- API key field shows "●●●●●●●● (saved)" if key exists — never shows the actual key value
- Danger zone: "Clear all memory" — destructive ghost button with confirmation dialog in main process

---

## Motion & Animation

One rule: **never interrupt, always suggest.**

| Interaction | Animation |
|---|---|
| Chat overlay opens | Translate-Y up 16px + fade in — 220ms ease-out |
| Chat overlay closes | Fade out + drop 8px — 160ms ease-in |
| Message appears | Fade in + 4px translate-Y up — 180ms ease-out |
| fumii thinking | 3-dot staggered bounce, amber, 1.4s loop |
| Sprite state change | Cross-dissolve between frame sequences — no snap (achieved by resetting frameIdx gracefully) |
| Mood pill hover | Scale 1.04 — 100ms ease |
| Button hover | 80ms ease, no layout shift |
| Dashboard card hover | -2px Y-lift + shadow deepens — 120ms ease |

```css
/* Shared easing tokens */
--ease-out-smooth: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-smooth:  cubic-bezier(0.7, 0, 0.84, 0);
```

**Reduced motion:** All non-sprite animations collapse to instant opacity transitions.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

The sprite still animates at reduced motion — it's the core feature — but at half FPS (halve all `fps` values in `ANIMATION_STATES`).

---

## Signature Element: The Amber Desk Lamp

fumii's one unmistakable design signature is the **amber desk lamp light.**

In the sprite scene, a soft radial gradient in amber bleeds from the upper portion downward — like a real lamp casting warmth. This same logic echoes throughout:

- Card hover states emit a faint amber warmth
- The chat window casts a faint `--glow-amber` outward
- The active nav item in the sidebar is amber

This one element makes fumii feel like she's *in a room*, not floating on a screen.

```css
/* Desk lamp glow — overlaid on scene background */
.lamp-glow {
  position: absolute;
  top: 0; left: 20px;
  width: 140px; height: 100px;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(245, 166, 35, 0.10) 0%,
    transparent 70%
  );
  pointer-events: none;
  animation: lamp-pulse 3s ease-in-out infinite;
}
```

---

## Sprite Asset Recommendations

For Phase 1 development, use one of these as the base for fumii's character:

**Primary recommendation:**
- **Penzilla Hooded Protagonist** — `https://penzilla.itch.io/hooded-protagonist`
  Hooded character that matches fumii's amber hoodie aesthetic closely. Free on itch.io. Swap palette to `#F5A623` amber using Aseprite (free/open source).

**Alternatives:**
- **LPC Character Sprites** (OpenGameArt.org — CC-BY 3.0) — small, expressive, 48×48px base
- **Kenney Pixel Platformer Pack** — clean, MIT-equivalent license, easily poseable

When creating the sprite sheet, follow this layout:
- Frame size: 48×48px
- Sheet: 8 columns × 9 rows (72 frames total)
- Row order matches the ANIMATION_STATES table in FUMII_PHASE1.md
- Export as single PNG with transparency

---

## Asset Checklist

```
assets/
├── sprites/
│   ├── fumii_sheet.png          # Full sprite sheet — 8 cols × 9 rows, 48×48 frames
│   └── fumii_icon_16.png        # Tray icon — 16×16px, transparent bg
├── scenes/
│   └── desk_night.png           # Background scene — 280×220px
├── fonts/
│   ├── SpaceGrotesk-Variable.woff2
│   └── DepartureMono-Regular.woff2
├── sounds/
│   ├── wake.mp3                 # Soft chime when fumii wakes
│   └── message.mp3              # Subtle notification sound
└── icon.ico                     # App icon for installer — 256×256 minimum
```

---

## Do's and Don'ts

**Do:**
- Keep fumii's words always in `--color-text-fumii` (amber) — it's her color
- Use Departure Mono only for data, tags, metadata — it's a signal, not a style
- Let silence and space exist — fumii doesn't crowd the screen
- Make the amber glow the emotional reward for interaction
- Write "fumii" in all lowercase — everywhere, always

**Don't:**
- Use bright white or light backgrounds anywhere in the app
- Hardcode any hex color in component files — use CSS variables only
- Use system-default blue for links or active states — everything amber or green
- Use emoji in the UI (fumii uses words, not emoji)
- Add loading spinners — use fumii's thinking animation instead
- Write "Fumii" or "FUMII" in the UI ever, for any reason
- Use `backdrop-filter` on truly transparent regions — it has no effect and wastes GPU
- Set `nodeIntegration: true` for "easier development" — it's a permanent security hole
