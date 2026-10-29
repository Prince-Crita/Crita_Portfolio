// Renders the device-framed compositions on web/dist/art to JPEGs for the deck.
// Output: ppt/art/<name>.jpg + ppt/art/manifest.json (pixel size and frame padding).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { launch } from '../tools/lib/browser.mjs';
import { serve } from '../tools/lib/serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'web', 'dist');
const outDir = path.join(root, 'ppt', 'art');
const SCALE = 1.5;

if (!fs.existsSync(path.join(dist, 'art', 'index.html'))) {
  console.error('web/dist/art is missing — run "npm run build:web" first.');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const { server, url } = await serve(dist);
const browser = await launch();
const manifest = {};
try {
  const page = await browser.newPage({ viewport: { width: 2100, height: 1200 }, deviceScaleFactor: SCALE });
  await page.goto(`${url}/art/`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => (img.onload = img.onerror = r)))));
  });
  const names = await page.$$eval('[data-art]', (els) => els.map((e) => e.dataset.art));
  for (const name of names) {
    const el = page.locator(`[data-art="${name}"]`);
    const pad = await el.evaluate((e) => {
      const s = getComputedStyle(e);
      return { l: parseFloat(s.paddingLeft), t: parseFloat(s.paddingTop), r: parseFloat(s.paddingRight), b: parseFloat(s.paddingBottom) };
    });
    const png = await el.screenshot({ animations: 'disabled' });
    // Element screenshots can catch a sliver of the page's grey around the
    // piece; trim exactly that colour from the edges.
    // Then shave 2px all round: a fractional edge can leave one blended row.
    const trimmed = await sharp(png).trim({ background: '#888888', threshold: 6 }).toBuffer();
    const meta = await sharp(trimmed).metadata();
    const SHAVE = 2;
    const file = path.join(outDir, `${name}.jpg`);
    const info = await sharp(trimmed)
      .extract({ left: SHAVE, top: SHAVE, width: meta.width - 2 * SHAVE, height: meta.height - 2 * SHAVE })
      .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toFile(file);
    manifest[name] = { w: info.width, h: info.height, pad: Object.fromEntries(Object.entries(pad).map(([k, v]) => [k, v * SCALE - SHAVE])) };
  }
} finally {
  await browser.close();
  server.close();
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1));
const total = fs.readdirSync(outDir).filter((f) => f.endsWith('.jpg')).reduce((s, f) => s + fs.statSync(path.join(outDir, f)).size, 0);
console.log(`art: ${Object.keys(manifest).length} images, ${(total / 1048576).toFixed(1)} MB`);
