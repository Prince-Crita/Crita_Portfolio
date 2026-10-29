// Turns the screenshot library into delivery formats, incrementally:
//   web/public/media/<key>-<w>.webp   responsive variants for the site and PDF
//   assets/media/<key>.jpg            high-quality JPEGs for the PowerPoint deck
//   web/src/data/media.json           manifest: dimensions + variant URLs per key
// A key is the screenshot path without extension, e.g. "smc/admin-desktop/dashboard";
// folders named after a project ("Tribal Brew Coffee/desktop/admin/pos") become
// lower-case and hyphenated ("tribal-brew-coffee/desktop/admin/pos").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(root, 'screenshots');
const WEB = path.join(root, 'web', 'public', 'media');
const DECK = path.join(root, 'assets', 'media');
const MANIFEST = path.join(root, 'web', 'src', 'data', 'media.json');

const WIDTHS = { desktop: [800, 1400, 2200], mobile: [390, 780, 1170] };
// JPEG variants for the PDF: Chrome embeds JPEG data as-is, but re-encodes
// WebP losslessly, which would multiply the PDF's size.
const PRINT_WIDTHS = { desktop: [1400, 2200], mobile: [780] };
const DECK_WIDTH = { desktop: 2400, mobile: 1170 };

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : d.name.endsWith('.png') ? [p] : [];
  });

const fresh = (out, srcStat) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= srcStat.mtimeMs;
const slug = (p) => p.toLowerCase().replace(/\s+/g, '-');

// Capture titles (written by tools/capture) become alt text.
const titles = {};
for (const project of fs.readdirSync(SRC)) {
  const m = path.join(SRC, project, 'manifest.json');
  if (!fs.existsSync(m)) continue;
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(m, 'utf8')))) titles[slug(`${project}/${k}`)] = v.title;
}

const manifest = {};
let made = 0;
const files = walk(SRC);
for (const file of files) {
  const key = slug(path.relative(SRC, file).replace(/\\/g, '/').replace(/\.png$/, ''));
  const device = /(^|\/)mobile\/|-mobile\//.test(key) ? 'mobile' : 'desktop';
  const stat = fs.statSync(file);
  const { width, height } = await sharp(file).metadata();
  const entry = { w: width, h: height, device, title: titles[key] ?? '', variants: [] };

  // Phone frames draw a status bar in the app's own top colour.
  if (device === 'mobile') {
    // Top-left corner only (below any thin loading bar), so header icons and
    // progress indicators don't skew the background colour.
    // stats() ignores the pipeline, so materialise the crop first.
    // 40px down clears decorative top strips (Veloce's hazard stripe).
    const corner = await sharp(file).extract({ left: 0, top: 40, width: Math.round(width * 0.05), height: 4 }).toBuffer();
    const { channels } = await sharp(corner).stats();
    const [r, g, b] = channels.map((c) => Math.round(c.mean));
    entry.top = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    entry.topDark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
  }

  for (const w of WIDTHS[device].filter((x) => x <= width)) {
    const out = path.join(WEB, `${key}-${w}.webp`);
    if (!fresh(out, stat)) {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await sharp(file).resize({ width: w }).webp({ quality: 82, effort: 5 }).toFile(out);
      made++;
    }
    entry.variants.push({ w, src: `/media/${key}-${w}.webp` });
  }

  entry.print = [];
  for (const w of PRINT_WIDTHS[device].filter((x) => x <= width)) {
    const out = path.join(WEB, `${key}-${w}.jpg`);
    if (!fresh(out, stat)) {
      await sharp(file).resize({ width: w }).flatten({ background: '#ffffff' }).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
      made++;
    }
    entry.print.push({ w, src: `/media/${key}-${w}.jpg` });
  }

  const jpg = path.join(DECK, `${key}.jpg`);
  if (!fresh(jpg, stat)) {
    fs.mkdirSync(path.dirname(jpg), { recursive: true });
    await sharp(file)
      .resize({ width: Math.min(DECK_WIDTH[device], width) })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(jpg);
    made++;
  }
  entry.deck = path.relative(root, jpg).replace(/\\/g, '/');
  manifest[key] = entry;
}

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));

// Every screenshot the content refers to must exist.
const content = JSON.parse(fs.readFileSync(path.join(root, 'content', 'portfolio.json'), 'utf8'));
const refs = new Set();
const collect = (v) => {
  if (typeof v === 'string' && /^[a-z0-9-]+\/([a-z]+-)?(desktop|mobile)\//.test(v)) refs.add(v);
  else if (Array.isArray(v)) v.forEach(collect);
  else if (v && typeof v === 'object') Object.values(v).forEach(collect);
};
collect(content);
const missing = [...refs].filter((k) => !manifest[k]);
console.log(`media: ${files.length} screenshots, ${made} files written, ${refs.size} referenced by content`);
if (missing.length) {
  console.error('Missing screenshots referenced by content:\n  ' + missing.join('\n  '));
  process.exit(1);
}
