/**
 * generate-icons.js
 * Converts fumii.svg → assets/tray-icon.png (32x32) using only Node built-ins.
 * Renders a solid blue circle with a white "f" — matches the brand color from
 * the SVG (#0B59BE) without requiring canvas or sharp (no native deps).
 *
 * Output: assets/tray-icon.png  (32×32 RGBA PNG)
 *         assets/icon.png       (512×512 RGBA PNG, for Linux/Windows build)
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = (() => {
  try { return require('canvas'); } catch { return null; }
})() ?? {};

const assetsDir = path.join(__dirname, '..', 'assets');

// ── Minimal pure-JS PNG encoder ────────────────────────────────────────────
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function uint32BE(n) {
  return Buffer.from([(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF]);
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crc = crc32(Buffer.concat([t, d]));
  return Buffer.concat([uint32BE(d.length), t, d, uint32BE(crc)]);
}

// Tiny DEFLATE "store" block (uncompressed) — sufficient for small icons.
function deflateStore(data) {
  const blocks = [];
  let offset = 0;
  while (offset < data.length) {
    const end = Math.min(offset + 65535, data.length);
    const slice = data.slice(offset, end);
    const last = end >= data.length ? 1 : 0;
    blocks.push(Buffer.from([last, slice.length & 0xFF, (slice.length >> 8) & 0xFF,
      (~slice.length) & 0xFF, (~slice.length >> 8) & 0xFF]), slice);
    offset = end;
  }
  // zlib wrapper: CMF=0x78 FLG=0x01 (deflate, no dict, check bits)
  const payload = Buffer.concat(blocks);
  let adler = 1, s1 = 1, s2 = 0;
  for (const b of payload) { s1 = (s1 + b) % 65521; s2 = (s2 + s1) % 65521; }
  adler = (s2 << 16) | s1;
  return Buffer.concat([Buffer.from([0x78, 0x01]), payload, uint32BE(adler)]);
}

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array of width*height*4 RGBA values, top-to-bottom
  const ihdr = Buffer.concat([
    uint32BE(width), uint32BE(height),
    Buffer.from([8, 2, 0, 0, 0]) // 8-bit RGB (we'll convert RGBA → RGB+A via RGBA type 6)
  ]);
  // Actually use color type 6 (RGBA)
  ihdr[9] = 6; // color type

  // Build filtered scanlines (filter byte 0 = None per row)
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  const rawBuf = Buffer.from(raw);

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateStore(rawBuf)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// ── Draw a circle icon (brand color #0B59BE, white letter) ─────────────────
function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2, r = size / 2 - 1;
  const pad = size * 0.1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= r) {
        // Circle fill — fumii brand blue #0B59BE
        pixels[i]   = 0x0B;
        pixels[i+1] = 0x59;
        pixels[i+2] = 0xBE;
        pixels[i+3] = 255;

        // Simple "f" letterform in white — bold vertical bar + crossbar
        const fx = x / size, fy = y / size;
        // Vertical stem: x ∈ [0.36, 0.50], y ∈ [0.22, 0.82]
        const stem = fx >= 0.36 && fx <= 0.50 && fy >= 0.22 && fy <= 0.82;
        // Top crossbar: x ∈ [0.36, 0.72], y ∈ [0.22, 0.36]
        const topBar = fx >= 0.36 && fx <= 0.72 && fy >= 0.22 && fy <= 0.36;
        // Mid crossbar: x ∈ [0.36, 0.64], y ∈ [0.46, 0.57]
        const midBar = fx >= 0.36 && fx <= 0.64 && fy >= 0.46 && fy <= 0.57;

        if (stem || topBar || midBar) {
          pixels[i]   = 255;
          pixels[i+1] = 255;
          pixels[i+2] = 255;
          pixels[i+3] = 255;
        }
      } else if (dist <= r + 1) {
        // Anti-aliased edge
        const alpha = Math.round((r + 1 - dist) * 255);
        pixels[i]   = 0x0B;
        pixels[i+1] = 0x59;
        pixels[i+2] = 0xBE;
        pixels[i+3] = alpha;
      } else {
        // Transparent outside
        pixels[i] = pixels[i+1] = pixels[i+2] = pixels[i+3] = 0;
      }
    }
  }
  return pixels;
}

// Generate icons
const sizes = [
  { name: 'tray-icon.png', size: 32 },
  { name: 'icon.png',      size: 512 }
];

for (const { name, size } of sizes) {
  const pixels = drawIcon(size);
  const png = encodePNG(size, size, pixels);
  const outPath = path.join(assetsDir, name);
  fs.writeFileSync(outPath, png);
  console.log(`✓ wrote ${outPath}  (${png.length} bytes)`);
}
