// Screens from a published Canva guide, for apps that cannot be opened for capture.
//
//   node tools/capture/canva.mjs <project>
//
// Reads capture/projects/<project>.mjs ({ source, folder, screens }), opens the
// public view link at high pixel density so Canva serves its largest image
// renditions, keeps the listed phone mockups, cuts the app screen out of each
// mockup and writes ../screenshots/<folder>/mobile/<role>/<id>.png + manifest.
//
// Each mockup is a 897 × 1800 phone frame with the screen at x 56–841, y 56–1747.
// The crop starts below the frame's notch and the device status bar (y 123, or a
// screen's own `top`), since the portfolio's phone frame draws its own; the app's
// "Testing" build badge, with the role chip it overlaps, is painted out in the
// header colour.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { launch, sleep } from '../lib/browser.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectId = process.argv[2];
if (!projectId) {
  console.error('usage: node tools/capture/canva.mjs <project>');
  process.exit(1);
}
const spec = (await import(pathToFileURL(path.join(here, 'projects', `${projectId}.mjs`)))).default;
const outRoot = path.resolve(here, '..', '..', 'screenshots', spec.folder);
const wanted = new Map(spec.screens.map((s) => [s.asset, s]));

// 1 · Collect the largest rendition of each wanted image while scrolling the guide.
const FULL = 1600; // renditions smaller than this are thumbnails
const images = new Map();
const complete = () => [...wanted.keys()].every((id) => (images.get(id)?.h ?? 0) >= FULL);
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 3 });
  page.on('response', async (r) => {
    const u = r.url();
    if (!u.includes('image-resize') || r.status() !== 200) return;
    const id = decodeURIComponent(u).match(/ifs:\/\/M\/([0-9a-f-]{36})/)?.[1];
    const h = Number(u.match(/height:(\d+)/)?.[1] || 0);
    if (!wanted.has(id) || (images.get(id)?.h ?? 0) >= h) return;
    try { images.set(id, { h, buf: await r.body() }); } catch {}
  });
  await page.goto(spec.source, { waitUntil: 'load', timeout: 90000 });
  await sleep(9000);
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Control+Equal'); await sleep(600); }
  for (let step = 0; step < 260 && !complete(); step++) {
    await page.mouse.move(800, 500);
    await page.mouse.wheel(0, 450);
    await sleep(700);
  }
  await sleep(2000);
} finally {
  await browser.close();
}

// 2 · Cut the screen out of each mockup.
const FRAME = { left: 56, right: 841, bottom: 1747 };
const BELOW_NOTCH = 123;
const manifestPath = path.join(outRoot, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

for (const s of spec.screens) {
  const img = images.get(s.asset);
  if (!img || img.h < FULL) {
    console.log(`  ✗ ${s.role}/${s.id}: Canva served no full-size rendition`);
    continue;
  }
  // Every mockup is measured in the 897 × 1800 frame, whatever rendition came back.
  const meta = await sharp(img.buf).metadata();
  const sized = meta.width === 897 && meta.height === 1800 ? img.buf : await sharp(img.buf).resize(897, 1800, { fit: 'fill' }).png().toBuffer();
  if (sized !== img.buf) console.log(`    (${s.id}: rendition ${meta.width}×${meta.height}, scaled to the frame)`);
  const flat = sharp(sized).flatten({ background: '#ffffff' });
  const { data, info } = await flat.clone().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const dark = ([r, g, b]) => r + g + b < 200;
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

  const top = s.top ?? BELOW_NOTCH;
  const paints = [];
  // The blue "Testing" badge at the header's right, with any role chip under it.
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 100; y < top + 240; y++) {
    for (let x = 560; x < FRAME.right; x++) {
      const [r, g, b] = at(x, y);
      if (b > 190 && r < 90 && g > 100 && g < 170) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
  }
  if (x1 > 0 && y1 > top) {
    let bottom = y1 + 6;
    // A role chip (outlined circle) tucked under the badge goes with it.
    let chip = 0;
    for (let y = y1 + 1; y < y1 + 60; y++) for (let x = x0; x <= x1; x++) chip += dark(at(x, y)) || at(x, y)[1] - at(x, y)[0] > 40 ? 1 : 0;
    if (chip > 80) bottom = y1 + 66;
    const yy = Math.max(top, y0 - 8);
    paints.push({ x: x0 - 14, y: yy, w: Math.min(FRAME.right, x1 + 14) - (x0 - 14), h: bottom - yy, color: hex(at(x0 - 30, Math.max(top + 4, y0 + 8))) });
  }

  const dir = path.join(outRoot, 'mobile', s.role);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${s.id}.png`);
  await flat
    .composite(paints.map((p) => ({ input: { create: { width: p.w, height: p.h, channels: 3, background: p.color } }, left: p.x, top: p.y })))
    .toBuffer()
    .then((buf) => sharp(buf).extract({ left: FRAME.left, top, width: FRAME.right - FRAME.left, height: FRAME.bottom - top }).png().toFile(file));
  manifest[`mobile/${s.role}/${s.id}`] = { title: s.title, role: s.role, device: 'mobile', url: spec.source, source: `Canva image ${s.asset}`, capturedAt: new Date().toISOString() };
  console.log(`  ✓ ${s.role}/${s.id}  (from y ${top}, ${paints.length ? 'badge removed' : 'no badge'})`);
}
fs.mkdirSync(outRoot, { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
