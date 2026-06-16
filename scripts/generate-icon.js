#!/usr/bin/env node
/**
 * generate-icon.js
 *
 * Converts fumii.svg → build/icon.ico (multi-resolution Windows icon)
 * and build/icon.png (512px, used by Linux/macOS and electron-builder fallback).
 *
 * Sizes packed into the ICO: 16, 32, 48, 64, 128, 256 px.
 * Requires: sharp (already a devDependency)
 *
 * ICO format spec:
 *   Offset  Size  Description
 *   0       2     Reserved (0)
 *   2       2     Type (1 = ICO)
 *   4       2     Image count
 *   [for each image, 16-byte directory entry]
 *   [then raw PNG data for each image]
 */

const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const SVG_SRC   = path.join(__dirname, '..', 'fumii.svg')
const PNG_SRC   = path.join(__dirname, '..', 'src', 'assets', 'sprites', 'fumii_icon.png')
const BUILD_DIR = path.join(__dirname, '..', 'build')
const ICO_OUT   = path.join(BUILD_DIR, 'icon.ico')
const PNG_OUT   = path.join(BUILD_DIR, 'icon.png')

const ICO_SIZES = [16, 32, 48, 64, 128, 256]

async function run() {
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true })
  }

  // Pick best source: prefer SVG (crisp at all sizes), fall back to PNG
  const src = fs.existsSync(SVG_SRC) ? SVG_SRC : PNG_SRC

  if (!fs.existsSync(src)) {
    console.error(`[generate-icon] No source found at ${SVG_SRC} or ${PNG_SRC}`)
    process.exit(1)
  }

  console.log(`[generate-icon] Source: ${src}`)

  // Generate 512px PNG for Linux/macOS
  await sharp(src)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(PNG_OUT)
  console.log(`[generate-icon] Created: build/icon.png`)

  // Generate PNG buffers for each ICO size
  const pngBuffers = await Promise.all(
    ICO_SIZES.map(size =>
      sharp(src)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  )

  // Assemble ICO binary
  const icoBuffer = buildIco(pngBuffers, ICO_SIZES)
  fs.writeFileSync(ICO_OUT, icoBuffer)
  console.log(`[generate-icon] Created: build/icon.ico (${ICO_SIZES.join(', ')}px)`)
}

/**
 * Pack PNG buffers into a valid .ico binary.
 * We embed PNG data directly (Windows Vista+ supports PNG-in-ICO).
 */
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length

  // Header: 6 bytes
  const headerSize = 6
  // Directory: 16 bytes per image
  const dirSize = 16 * count
  // Data starts after header + directory
  let dataOffset = headerSize + dirSize

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)     // reserved
  header.writeUInt16LE(1, 2)     // type = ICO
  header.writeUInt16LE(count, 4) // number of images

  const dirEntries = []
  for (let i = 0; i < count; i++) {
    const size = sizes[i]
    const data = pngBuffers[i]
    const entry = Buffer.alloc(16)
    // Width/height: 0 means 256 (ICO spec quirk for 256px)
    entry.writeUInt8(size === 256 ? 0 : size, 0)  // width
    entry.writeUInt8(size === 256 ? 0 : size, 1)  // height
    entry.writeUInt8(0, 2)                         // color count (0 = no palette)
    entry.writeUInt8(0, 3)                         // reserved
    entry.writeUInt16LE(1, 4)                      // color planes
    entry.writeUInt16LE(32, 6)                     // bits per pixel
    entry.writeUInt32LE(data.length, 8)            // data size
    entry.writeUInt32LE(dataOffset, 12)            // data offset
    dirEntries.push(entry)
    dataOffset += data.length
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers])
}

run().catch(err => {
  console.error('[generate-icon] Fatal error:', err.message)
  process.exit(1)
})
