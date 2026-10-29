// Visual QA: full-page screenshots of the built site at several widths.
// Usage: node tools/qa/shoot-site.mjs <baseUrl> <outDir> [paths...] [--w=1440,390]
import fs from 'node:fs';
import path from 'node:path';
import { launch, sleep } from '../lib/browser.mjs';

const args = process.argv.slice(2);
const base = args[0];
const out = args[1];
const widths = (args.find((a) => a.startsWith('--w=')) ?? '--w=1440,390').slice(4).split(',').map(Number);
const paths = args.slice(2).filter((a) => !a.startsWith('--'));
const list = paths.length ? paths : ['/', '/work/smc/', '/work/veloce/', '/work/clario/', '/work/city-threads/'];
fs.mkdirSync(out, { recursive: true });

const browser = await launch();
for (const w of widths) {
  const mobile = w < 600;
  const ctx = await browser.newContext({
    viewport: { width: w, height: mobile ? 844 : 900 },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await ctx.newPage();
  for (const p of list) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    // Scroll through so lazy images load, then show every reveal for a static check.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await sleep(120);
    }
    await page.evaluate(() => {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      window.scrollTo(0, 0);
    });
    await sleep(900);
    const name = `${(p.replace(/\//g, '_').replace(/^_|_$/g, '') || 'home')}-${w}.png`;
    await page.screenshot({ path: path.join(out, name), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${name}  height=${h}  horizontalOverflow=${overflow}`);
  }
  await ctx.close();
}
await browser.close();
