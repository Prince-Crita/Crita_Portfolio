// Generates the brand's scattered "C" pattern (from the logo's own C path) on a
// transparent background: rotated, scaled symbols as in the brand guidelines.
// Writes assets/brand/pattern-c.svg, web/public/brand/pattern-c.svg, ppt/brand/pattern-c.png.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const logo = fs.readFileSync(path.join(root, 'assets', 'brand', 'crita-logo.svg'), 'utf8');
const C = logo.match(/class="st4" d="([^"]+)"/)[1]; // the C, 169 × 124 units

// Deterministic pseudo-random so the pattern never changes between builds.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const W = 1200;
const H = 1600;
const marks = [];
const placed = [];
for (let tries = 0; marks.length < 34 && tries < 4000; tries++) {
  const s = 0.35 + rnd() * 1.25; // scale
  const w = 169 * s;
  const x = rnd() * (W + 120) - 60;
  const y = rnd() * (H + 120) - 60;
  if (placed.some((p) => Math.hypot(p.x - x, p.y - y) < (p.w + w) * 0.62)) continue;
  placed.push({ x, y, w });
  const rot = [0, 90, 180, 270][Math.floor(rnd() * 4)] + (rnd() * 24 - 12);
  const o = (0.55 + rnd() * 0.45).toFixed(2);
  marks.push(`<path d="${C}" fill="url(#g)" opacity="${o}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(3)}) translate(-84.5 -62)"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="169" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4f6b31"/><stop offset="1" stop-color="#a8cf39"/></linearGradient></defs>
${marks.join('\n')}
</svg>`;

fs.writeFileSync(path.join(root, 'assets', 'brand', 'pattern-c.svg'), svg);
fs.writeFileSync(path.join(root, 'web', 'public', 'brand', 'pattern-c.svg'), svg);
await sharp(Buffer.from(svg), { density: 96 }).png({ compressionLevel: 9 }).toFile(path.join(root, 'ppt', 'brand', 'pattern-c.png'));
console.log(`pattern: ${marks.length} marks`);
