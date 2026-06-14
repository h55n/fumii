#!/usr/bin/env node
/**
 * Generates minimal placeholder PNG assets so fumii can run in dev without real sprite art.
 *
 * Creates:
 *   src/assets/sprites/fumii_sheet.png   (384x432 transparent PNG — 8col x 9row x 48px)
 *   src/assets/sprites/fumii_tray_16.png (16x16 amber circle)
 *   src/assets/scenes/desk_night.png     (280x220 dark scene placeholder)
 *
 * This is NOT meant to be the final art — just enough to prevent load errors.
 * Replace with real pixel art before shipping.
 */

const fs   = require('fs')
const path = require('path')

// Minimal valid 1x1 transparent PNG (base64)
// Used when we can't run canvas in a plain Node script
const TRANSPARENT_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
)

const dirs = [
  'src/assets/sprites',
  'src/assets/scenes',
  'src/assets/sounds',
  'src/assets/fonts'
]

const root = path.join(__dirname, '..')

// Ensure dirs exist
for (const dir of dirs) {
  fs.mkdirSync(path.join(root, dir), { recursive: true })
}

// Write placeholder files only if they don't already exist
const placeholders = [
  ['src/assets/sprites/fumii_sheet.png',   TRANSPARENT_1X1],
  ['src/assets/sprites/fumii_tray_16.png', TRANSPARENT_1X1],
  ['src/assets/scenes/desk_night.png',     TRANSPARENT_1X1]
]

for (const [relPath, data] of placeholders) {
  const fullPath = path.join(root, relPath)
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, data)
    console.log(`  created placeholder: ${relPath}`)
  } else {
    console.log(`  exists (skipped):    ${relPath}`)
  }
}

// Create placeholder font files (empty — Space Grotesk falls back to system sans-serif)
for (const font of ['SpaceGrotesk-Variable.woff2', 'DepartureMono-Regular.woff2']) {
  const p = path.join(root, 'src/assets/fonts', font)
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, Buffer.alloc(0))
    console.log(`  created placeholder: src/assets/fonts/${font}`)
  }
}

// Create silent audio placeholders (0-byte mp3s — no sound is fine for dev)
for (const sound of ['wake.mp3', 'message.mp3', 'complete.mp3']) {
  const p = path.join(root, 'src/assets/sounds', sound)
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, Buffer.alloc(0))
    console.log(`  created placeholder: src/assets/sounds/${sound}`)
  }
}

console.log('\nPlaceholder assets ready. Replace with real art before shipping.')
