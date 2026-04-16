#!/usr/bin/env node
// Generates PWA icons (192, 512) without native deps.
// Run: `node scripts/generate-pwa-icons.mjs`
// Output: public/pwa-192x192.png, public/pwa-512x512.png, public/apple-touch-icon.png

import { deflateSync, crc32 } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')

// ── Colors (RGBA) ──────────────────────────────────────────────
const BG = [7, 16, 28, 255]           // #07101c — navy
const ORANGE = [240, 122, 74, 255]    // #f07a4a — accent
const ORANGE_DARK = [184, 81, 36, 255]
const WHITE = [248, 250, 252, 255]    // surface-50

// ── Pixel helpers ──────────────────────────────────────────────
function makeBuffer(w, h, rgba) {
  const buf = Buffer.alloc(w * h * 4)
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = rgba[0]; buf[i + 1] = rgba[1]; buf[i + 2] = rgba[2]; buf[i + 3] = rgba[3]
  }
  return buf
}
function setPixel(buf, w, x, y, rgba, alpha = 1) {
  if (x < 0 || y < 0 || x >= w) return
  const idx = (y * w + x) * 4
  if (idx < 0 || idx + 3 >= buf.length) return
  const a = alpha
  buf[idx]     = Math.round(buf[idx]     * (1 - a) + rgba[0] * a)
  buf[idx + 1] = Math.round(buf[idx + 1] * (1 - a) + rgba[1] * a)
  buf[idx + 2] = Math.round(buf[idx + 2] * (1 - a) + rgba[2] * a)
  buf[idx + 3] = 255
}
function fillRoundedRect(buf, w, h, x0, y0, x1, y1, r, rgba) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const dxL = x - (x0 + r), dxR = x - (x1 - 1 - r)
      const dyT = y - (y0 + r), dyB = y - (y1 - 1 - r)
      let inside = true, d2 = 0, rr = r * r
      if (x < x0 + r && y < y0 + r) { d2 = dxL * dxL + dyT * dyT; inside = d2 <= rr }
      else if (x > x1 - 1 - r && y < y0 + r) { d2 = dxR * dxR + dyT * dyT; inside = d2 <= rr }
      else if (x < x0 + r && y > y1 - 1 - r) { d2 = dxL * dxL + dyB * dyB; inside = d2 <= rr }
      else if (x > x1 - 1 - r && y > y1 - 1 - r) { d2 = dxR * dxR + dyB * dyB; inside = d2 <= rr }
      if (!inside) continue
      // Soft AA at radius edge
      let a = 1
      if (d2 > 0) {
        const dist = Math.sqrt(d2)
        const t = r - dist
        if (t < 1) a = Math.max(0, t)
      }
      setPixel(buf, w, x, y, rgba, a)
    }
  }
}
function fillRect(buf, w, _h, x0, y0, x1, y1, rgba) {
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++)
      setPixel(buf, w, x, y, rgba, 1)
}
function fillCircle(buf, w, cx, cy, r, rgba) {
  const r2 = r * r
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy
      const d2 = dx * dx + dy * dy
      if (d2 > r2) continue
      let a = 1
      const dist = Math.sqrt(d2)
      const t = r - dist
      if (t < 1) a = Math.max(0, t)
      setPixel(buf, w, x, y, rgba, a)
    }
  }
}

// ── Icon composition: dumbbell on rounded orange tile ───────────
function drawIcon(size, { maskable = false } = {}) {
  const buf = makeBuffer(size, size, BG)

  // Rounded tile. For maskable we keep content in central 80%.
  const pad = maskable ? Math.round(size * 0.10) : Math.round(size * 0.06)
  const tileRadius = Math.round(size * 0.22)
  fillRoundedRect(buf, size, size, pad, pad, size - pad, size - pad, tileRadius, ORANGE)

  // Dumbbell: horizontal bar + two plates, centered.
  const cx = size / 2, cy = size / 2
  const barW = Math.round(size * 0.46)
  const barH = Math.round(size * 0.08)
  const plateW = Math.round(size * 0.10)
  const plateH = Math.round(size * 0.30)
  const plateInnerH = Math.round(size * 0.22)
  const plateInnerW = Math.round(size * 0.06)

  // Bar
  fillRect(buf, size, size,
    Math.round(cx - barW / 2), Math.round(cy - barH / 2),
    Math.round(cx + barW / 2), Math.round(cy + barH / 2),
    WHITE,
  )
  // Left plate
  const leftX = Math.round(cx - barW / 2 - plateW)
  fillRect(buf, size, size, leftX, Math.round(cy - plateH / 2), leftX + plateW, Math.round(cy + plateH / 2), WHITE)
  // Right plate
  const rightX = Math.round(cx + barW / 2)
  fillRect(buf, size, size, rightX, Math.round(cy - plateH / 2), rightX + plateW, Math.round(cy + plateH / 2), WHITE)
  // Inner plate details (smaller tone)
  fillRect(buf, size, size, leftX + Math.round(plateW * 0.25), Math.round(cy - plateInnerH / 2),
    leftX + Math.round(plateW * 0.25) + plateInnerW, Math.round(cy + plateInnerH / 2), ORANGE_DARK)
  fillRect(buf, size, size, rightX + plateW - plateInnerW - Math.round(plateW * 0.25), Math.round(cy - plateInnerH / 2),
    rightX + plateW - Math.round(plateW * 0.25), Math.round(cy + plateInnerH / 2), ORANGE_DARK)

  // End caps — small circles on plate outer sides
  const capR = Math.round(size * 0.018)
  fillCircle(buf, size, leftX - capR, Math.round(cy), capR, WHITE)
  fillCircle(buf, size, rightX + plateW + capR, Math.round(cy), capR, WHITE)

  return buf
}

// ── PNG encoder (RGBA, 8-bit, no interlace) ──────────────────────
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0); return b }
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = crc32(body)
  return Buffer.concat([u32(data.length), body, u32(crc)])
}
function encodePng(width, height, rgbaBuf) {
  // Prepend filter byte (0) per scanline
  const stride = width * 4
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgbaBuf.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8      // bit depth
  ihdr[9] = 6      // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ── Generate and save ───────────────────────────────────────────
const sizes = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
]

for (const { file, size, maskable } of sizes) {
  const pixels = drawIcon(size, { maskable })
  const png = encodePng(size, size, pixels)
  const out = resolve(publicDir, file)
  writeFileSync(out, png)
  console.log(`Wrote ${out} (${png.length} bytes)`)
}
