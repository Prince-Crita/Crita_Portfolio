// Visual QA of scroll-driven sections: viewport screenshots taken while
// scrolling through a selector, exactly as a visitor would see them.
// Usage: node tools/qa/shoot-scroll.mjs <url> <outDir> <selector> [frames=5] [width=1440]
import fs from 'node:fs';
import path from 'node:path';
import { launch, sleep } from '../lib/browser.mjs';

const [url, out, selector, frames = '5', width = '1440'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
const page = await (await browser.newContext({ viewport: { width: +width, height: 900 }, deviceScaleFactor: 1 })).newPage();
await page.goto(url, { waitUntil: 'networkidle' });
const box = await page.evaluate((s) => {
  const r = document.querySelector(s).getBoundingClientRect();
  return { top: r.top + scrollY, height: r.height };
}, selector);
for (let i = 0; i < +frames; i++) {
  const y = box.top + (box.height - 900) * (i / (+frames - 1));
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await sleep(1300);
  await page.screenshot({ path: path.join(out, `frame-${i}.png`) });
}
console.log('frames written to', out);
await browser.close();
