// Renders the print route of the built site (web/dist/print) to the PDF portfolio.
//   npm run build:web && npm run build:pdf
// Output: pdf/Crita-Portfolio-2026.pdf (also copied next to the website for download).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import { launch, sleep } from '../tools/lib/browser.mjs';
import { serve } from '../tools/lib/serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'web', 'dist');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content', 'portfolio.json'), 'utf8'));
const name = `Crita-Portfolio-${content.meta.year}.pdf`;
const out = path.join(root, 'pdf', name);

if (!fs.existsSync(path.join(dist, 'print', 'index.html'))) {
  console.error('web/dist/print is missing — run "npm run build:web" first.');
  process.exit(1);
}

const { server, url } = await serve(dist);
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 2 });
  await page.goto(`${url}/print/`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => (img.onload = img.onerror = r)))));
  });
  const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
  if (broken.length) throw new Error('Images failed to load:\n' + broken.join('\n'));
  await sleep(500);
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });

  // Social-share image for the website.
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await og.goto(`${url}/og/`, { waitUntil: 'networkidle' });
  await og.evaluate(() => document.fonts.ready);
  const ogFile = path.join(root, 'web', 'public', 'og.jpg');
  await og.locator('[data-og]').screenshot({ path: ogFile, type: 'jpeg', quality: 86 });
  fs.copyFileSync(ogFile, path.join(dist, 'og.jpg'));
} finally {
  await browser.close();
  server.close();
}

// Document properties.
const doc = await PDFDocument.load(fs.readFileSync(out));
doc.setTitle(content.meta.title);
doc.setAuthor(content.company.name);
doc.setSubject(content.meta.description);
doc.setKeywords(['Crita', 'portfolio', ...content.projects.map((p) => p.name)]);
doc.setCreator(`${content.company.name} portfolio`);
doc.setProducer(`${content.company.name}`);
fs.writeFileSync(out, await doc.save());

for (const dir of [dist, path.join(root, 'web', 'public')]) fs.copyFileSync(out, path.join(dir, name));
console.log(`PDF: ${path.relative(root, out)} — ${doc.getPageCount()} pages, ${(fs.statSync(out).size / 1048576).toFixed(1)} MB`);
