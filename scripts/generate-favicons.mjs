#!/usr/bin/env node
// Regenerates the favicon set in public/ from the brand mark
// (src/assets/logo/rml-mark.svg — DESIGN.md §Logo names it the small-size
// source). Run after any change to the mark:  node scripts/generate-favicons.mjs
//
// Outputs: favicon.svg, favicon.ico (32+16), apple-touch-icon.png (180),
// icon-192.png, icon-512.png, icon-512-maskable.png.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const out = (name) => fileURLToPath(new URL(`public/${name}`, root));

// The mark's authored viewBox is letterboxed around the wordmark lockup's
// proportions. Icons must be square, so reframe on the mark's own bounding
// box (grid 0..438 plus the arrow's overshoot) and centre it.
const SQUARE_VIEWBOX = '-31 -30 490 490';

const source = await readFile(fileURLToPath(new URL('src/assets/logo/rml-mark.svg', root)), 'utf8');
const squareSvg = source.replace(
  /viewBox="[^"]*"\s*width="[^"]*"\s*height="[^"]*"/,
  `viewBox="${SQUARE_VIEWBOX}" width="512" height="512"`
);
const svgBuffer = Buffer.from(squareSvg);

const png = (size, padding = 0) => {
  const inner = size - padding * 2;
  return sharp(svgBuffer, { density: 384 })
    .resize(inner, inner)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
};

// Packs PNG payloads into an ICO container. Windows and legacy browsers
// accept PNG-compressed entries; no BMP encoding needed.
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const directory = entries.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...directory, ...entries.map((e) => e.data)]);
}

// Inline SVG favicon: modern browsers prefer it and it stays crisp at any size.
await writeFile(out('favicon.svg'), squareSvg);

const [ico32, ico16] = await Promise.all([png(32), png(16)]);
await writeFile(
  out('favicon.ico'),
  buildIco([
    { size: 32, data: ico32 },
    { size: 16, data: ico16 },
  ])
);

// Apple touch icons are composited on an opaque tile by iOS, and the OS
// applies its own corner radius — so pad rather than bleed to the edge.
await sharp(await png(180, 16))
  .flatten({ background: '#ffffff' })
  .png()
  .toFile(out('apple-touch-icon.png'));

await writeFile(out('icon-192.png'), await png(192));
await writeFile(out('icon-512.png'), await png(512));
// Maskable icons are cropped to a safe zone of the inner 80%; pad to survive it.
await sharp(await png(512, 64)).flatten({ background: '#ffffff' }).png().toFile(out('icon-512-maskable.png'));

console.log('Favicons written to public/');
