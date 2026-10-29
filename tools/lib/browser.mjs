// Shared Playwright helpers for research + screenshot capture.
import { chromium } from 'playwright-core';

// Installed Google Chrome. Elsewhere set CHROME_PATH, e.g. on macOS
// "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome".
export const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

export async function launch(opts = {}) {
  return chromium.launch({ executablePath: CHROME, headless: true, ...opts });
}

export const DESKTOP = {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
};

export const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Scrolls the page in steps so lazy/scroll-triggered content renders.
export async function autoScroll(page, step = 600, pause = 250) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(pause);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(pause);
}

// Visible text of the page, de-duplicated line by line.
export async function visibleText(page) {
  return page.evaluate(() => {
    const lines = document.body.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.filter((l, i) => l !== lines[i - 1]).join('\n');
  });
}
