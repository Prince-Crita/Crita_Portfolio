// Screenshot capture for the portfolio's asset library.
//
//   node capture/capture.mjs <project> [--only=id,id] [--role=admin] [--device=mobile]
//
// Reads capture/projects/<project>.mjs and content/demo-access.json, logs in
// once per role and device, walks each shot's read-only steps, masks third-party
// names, and writes PNGs to ../screenshots/<project>/<role>-<device>/<id>.png.
//
// Safety: shots only navigate, open tabs/sheets and change filters. They never
// submit forms, toggle tasks, approve, save or delete anything.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launch, sleep } from '../lib/browser.mjs';
import { installMask } from './mask.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(3).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const projectId = process.argv[2];
if (!projectId) {
  console.error('usage: node capture/capture.mjs <project> [--only=a,b] [--role=r] [--device=d]');
  process.exit(1);
}

const spec = (await import(pathToFileURL(path.join(here, 'projects', `${projectId}.mjs`)))).default;
const access = JSON.parse(fs.readFileSync(path.resolve(here, '..', '..', 'content', 'demo-access.json'), 'utf8'))[projectId];
const accounts = Object.fromEntries(access.accounts.map((a) => [a.key, a]));
const outRoot = path.resolve(here, '..', '..', 'screenshots', projectId);

export const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  },
};

const only = args.only ? String(args.only).split(',') : null;
const shots = spec.shots.filter(
  (s) =>
    (!only || only.includes(s.id)) &&
    (!args.role || s.role === args.role) &&
    (!args.device || s.device === args.device)
);

const groups = new Map();
for (const s of shots) {
  const key = `${s.role}|${s.device}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(s);
}

const waitUntil = spec.waitUntil ?? 'networkidle';

async function goto(page, url) {
  try {
    await page.goto(url, { waitUntil, timeout: 60000 });
  } catch {
    console.log('  (load timeout, continuing)', url);
  }
}

async function login(page, role) {
  const acct = accounts[role];
  if (!acct) throw new Error(`No account for role "${role}" in accounts.local.json`);
  await goto(page, spec.base + spec.login.path);
  await sleep(1200);
  await page.fill(spec.login.user, acct.user);
  await page.fill(spec.login.pass, acct.pass);
  await page.click(spec.login.submit);
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 });
  await page.waitForLoadState(waitUntil, { timeout: 20000 }).catch(() => {});
  await sleep(1500);
}

async function runStep(page, step) {
  if (step.click) await page.locator(step.click).first().click({ timeout: 15000 });
  if (step.clickAll) for (let i = 0; i < step.clickAll[1]; i++) {
    await page.locator(step.clickAll[0]).first().click({ timeout: 15000 });
    await sleep(step.clickAll[2] ?? 700);
  }
  if (step.fill) await page.locator(step.fill[0]).first().fill(step.fill[1]);
  if (step.press) await page.keyboard.press(step.press);
  if (step.waitFor) await page.locator(step.waitFor).first().waitFor({ timeout: 30000 });
  if (step.scroll !== undefined) await page.evaluate((y) => window.scrollTo(0, y), step.scroll);
  if (step.scrollTo) await page.locator(step.scrollTo).first().scrollIntoViewIfNeeded();
  if (step.eval) await page.evaluate(step.eval);
  if (step.wait) await sleep(step.wait);
}

const browser = await launch();

// Lets a spec build its mask from read-only API calls made as a given role.
async function withRole(role, fn) {
  const ctx = await browser.newContext({ ...DEVICES.desktop, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await login(page, role);
    return await fn(page);
  } finally {
    await ctx.close();
  }
}
const getJSON = (page, url) =>
  page.evaluate(async (u) => (await fetch(u, { credentials: 'include' })).json(), url);

let mask = spec.buildMask ? await spec.buildMask({ withRole, getJSON }) : spec.mask ?? {};
const manifestPath = path.join(outRoot, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

try {
  for (const [key, list] of groups) {
    const [role, device] = key.split('|');
    console.log(`\n== ${projectId} · ${role} · ${device} (${list.length} shots)`);
    const ctx = await browser.newContext({ ...DEVICES[device], locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx.newPage();
    await login(page, role);

    for (const shot of list) {
      const t0 = Date.now();
      try {
        if (shot.height) await page.setViewportSize({ width: DEVICES[device].viewport.width, height: shot.height });
        await goto(page, spec.base + shot.path);
        await sleep(shot.settle ?? spec.settle ?? 2500);
        for (const step of shot.steps ?? []) await runStep(page, step);
        await page.evaluate(installMask, { ...mask, hide: [...(mask.hide ?? []), ...(shot.hide ?? [])] });
        if (spec.afterMask) await page.evaluate(spec.afterMask);
        await sleep(600);
        if (shot.scroll !== undefined) {
          await page.evaluate((y) => window.scrollTo(0, y), shot.scroll);
          await sleep(500);
        }

        const dir = path.join(outRoot, `${role}-${device}`);
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `${shot.id}.png`);
        await page.screenshot({ path: file, fullPage: !!shot.full, clip: shot.clip, animations: 'disabled' });
        const size = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
        manifest[`${role}-${device}/${shot.id}`] = {
          title: shot.title,
          role,
          device,
          url: spec.base + shot.path,
          full: !!shot.full,
          capturedAt: new Date().toISOString(),
        };
        console.log(`  ✓ ${shot.id}  (${((Date.now() - t0) / 1000).toFixed(1)}s, page ${size.join('×')})`);
      } catch (e) {
        console.log(`  ✗ ${shot.id}: ${e.message.split('\n')[0]}`);
      } finally {
        if (shot.height) await page.setViewportSize(DEVICES[device].viewport);
      }
    }
    await ctx.close();
  }
} finally {
  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  await browser.close();
}
