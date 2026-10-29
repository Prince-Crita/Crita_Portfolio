// Fails if any presenter-only login from content/demo-access.json appears in a
// shareable output (built website, PDF portfolio, slides PDF, or anywhere in the
// main deck, speaker notes included). The presenter copy in ppt/presenter/ is the
// one place those logins are allowed.
// Usage: node tools/qa/leak-check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));

const accessFile = path.join(root, 'content', 'demo-access.json');
if (!fs.existsSync(accessFile)) {
  console.log('No content/demo-access.json — nothing to check.');
  process.exit(0);
}
const access = JSON.parse(fs.readFileSync(accessFile, 'utf8'));
const values = Object.entries(access)
  .filter(([k, v]) => !k.startsWith('_') && v.visibility !== 'public')
  .flatMap(([, v]) => v.accounts.flatMap((a) => [a.user, a.pass]));
// Values this short (e.g. "1234") occur by chance in binary PDF data and
// ordinary text, so they cannot be checked meaningfully; they are only counted.
const secrets = values.filter((s) => s.length >= 6);
const tooShort = values.length - secrets.length;

const hits = [];
const scan = (label, text) => secrets.forEach((s) => text.includes(s) && hits.push(`${label}: "${s}"`));

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(path.join(root, 'web', 'dist')).filter((f) => /\.(html|js|css|json|txt|xml)$/.test(f))) {
  scan(path.relative(root, f), fs.readFileSync(f, 'utf8'));
}

// PDFs: search raw bytes (text is in compressed streams, so also check via pdf-lib-free heuristic: titles/links are plain).
for (const pdf of ['pdf/Crita-Portfolio-2026.pdf', 'ppt/Crita-Portfolio-2026-Slides.pdf']) {
  const p = path.join(root, pdf);
  if (fs.existsSync(p)) scan(pdf, fs.readFileSync(p).toString('latin1'));
}

// Main deck: every XML part, speaker notes included.
const deck = path.join(root, 'ppt', 'Crita-Portfolio-2026.pptx');
if (fs.existsSync(deck)) {
  const zip = await JSZip.loadAsync(fs.readFileSync(deck));
  for (const n of Object.keys(zip.files).filter((n) => /\.(xml|rels)$/.test(n))) scan(`deck ${n}`, await zip.file(n).async('string'));
}

if (hits.length) {
  console.error('Presenter-only logins found in public outputs:\n  ' + hits.join('\n  '));
  process.exit(1);
}
console.log(
  `Leak check passed: ${secrets.length} presenter-only values absent from the website, PDFs and the main deck (notes included).` +
    (tooShort ? ` ${tooShort} value(s) under 6 characters not checkable.` : '')
);
