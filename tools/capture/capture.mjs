// Screenshot capture for the portfolio's asset library.
//
//   node capture/capture.mjs <project> [--only=id,id] [--role=admin] [--device=mobile]
//
// Reads capture/projects/<project>.mjs and content/demo-access.json, logs in
// once per role and device, walks each shot's read-only steps, masks third-party
// names, and writes PNGs to ../screenshots/<project>/<role>-<device>/<id>.png —
// or, for a spec with `folder`, to ../screenshots/<folder>/<device>/<role>/<id>.png.
//
// Safety: shots only navigate, open tabs/sheets and change filters. They never
// submit forms, toggle tasks, approve, save or delete anything.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
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
const access = JSON.parse(fs.readFileSync(path.resolve(here, '..', '..', 'content', 'demo-access.json'), 'utf8'))[spec.access ?? projectId];
const accounts = Object.fromEntries((access?.accounts ?? []).map((a) => [a.key, a]));
const outRoot = path.resolve(here, '..', '..', 'screenshots', spec.folder ?? projectId);
// Folder layout: legacy "<role>-<device>", or "<device>/<role>" for specs with a `folder`.
const shotDir = (role, device) => (spec.folder ? (spec.roleFolders === false ? device : `${device}/${role}`) : `${role}-${device}`);

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
  // Public pages, a public role, or a spec that signs in through `setup`.
  if (spec.login === null || spec.publicRoles?.includes(role)) return;
  const acct = accounts[role];
  if (!acct && !spec.login.run) throw new Error(`No account for role "${role}" in content/demo-access.json`);
  if (spec.login.run) {
    await spec.login.run(page, acct, { base: spec.base, goto, sleep, tap: tapLabel });
  } else {
    await goto(page, spec.base + spec.login.path);
    await sleep(1200);
    if (spec.login.open) await page.locator(spec.login.open).first().click();
    await page.fill(spec.login.user, acct.user);
    await page.fill(spec.login.pass, acct.pass);
    await page.click(spec.login.submit);
  }
  const done = spec.login.done ?? ((u) => !u.pathname.startsWith('/login'));
  await page.waitForURL(done, { timeout: spec.login.timeout ?? 60000 });
  await page.waitForLoadState(waitUntil, { timeout: 20000 }).catch(() => {});
  await sleep(spec.login.settle ?? 1500);
}

// Flutter web draws on a canvas: its semantics tree gives each control a
// labelled DOM node, which is how `tap` finds things by their visible label.
async function tapLabel(page, label, prefix = false) {
  await page.evaluate(async () => {
    const ph = document.querySelector('flt-semantics-placeholder');
    if (ph && !document.querySelector('flt-semantics')) {
      ph.click();
      await new Promise((r) => setTimeout(r, 1200));
    }
  });
  const box = await page.evaluate(({ label, prefix }) => {
    const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');
    const match = (s) => (prefix ? norm(s).startsWith(label) : norm(s) === label);
    const nodes = [...document.querySelectorAll('flt-semantics input, flt-semantics textarea, flt-semantics[role="button"], flt-semantics')];
    const hit = nodes.find((n) => {
      const r = n.getBoundingClientRect();
      return r.width > 0 && (match(n.getAttribute('aria-label')) || match(n.getAttribute('placeholder')) || match(n.textContent));
    });
    if (!hit) return null;
    const r = hit.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, { label, prefix });
  if (!box) throw new Error(`No element labelled "${label}"`);
  await page.mouse.click(box.x, box.y);
}

async function runStep(page, step) {
  if (step.click) await page.locator(step.click).first().click({ timeout: 15000 });
  if (step.clickAll) for (let i = 0; i < step.clickAll[1]; i++) {
    await page.locator(step.clickAll[0]).first().click({ timeout: 15000 });
    await sleep(step.clickAll[2] ?? 700);
  }
  if (step.tap) await tapLabel(page, step.tap, step.prefix);
  // A real mouse click on the element showing this text (React Native Web buttons).
  if (step.tapText) {
    const box = await page.evaluate((t) => {
      const el = [...document.querySelectorAll('body *')].find((e) => {
        const r = e.getBoundingClientRect();
        return r.width && r.height && r.top >= 0 && r.top < innerHeight && [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim() === t);
      });
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, step.tapText);
    if (!box) throw new Error(`No visible "${step.tapText}"`);
    await page.mouse.click(box.x, box.y);
  }
  // Scrolls the first scrolling container (apps whose window itself never scrolls).
  if (step.scrollInner !== undefined) {
    await page.evaluate((y) => {
      const el = [...document.querySelectorAll('div')].find((d) => d.scrollHeight > d.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(d).overflowY));
      el?.scrollTo(0, y);
    }, step.scrollInner);
  }
  if (step.mouse) await page.mouse.click(step.mouse[0], step.mouse[1]);
  if (step.type !== undefined) await page.keyboard.type(step.type, { delay: 30 });
  if (step.select) await page.locator(step.select[0]).first().selectOption(step.select[1]);
  if (step.fill) await page.locator(step.fill[0]).first().fill(step.fill[1]);
  if (step.press) await page.keyboard.press(step.press);
  if (step.waitFor) await page.locator(step.waitFor).first().waitFor({ timeout: 30000 });
  if (step.scroll !== undefined) await page.evaluate((y) => window.scrollTo(0, y), step.scroll);
  if (step.scrollTo) await page.locator(step.scrollTo).first().scrollIntoViewIfNeeded();
  // Scroll inside a container (apps whose page itself never scrolls).
  if (step.scrollEl) await page.locator(step.scrollEl[0]).first().evaluate((el, y) => el.scrollTo(0, y), step.scrollEl[1]);
  // Mouse-wheel scroll at a point, for canvas apps.
  if (step.wheel) {
    await page.mouse.move(step.wheel[0], step.wheel[1]);
    await page.mouse.wheel(0, step.wheel[2]);
  }
  if (step.eval) await page.evaluate(step.eval);
  if (step.wait) await sleep(step.wait);
}

// Paints over boxes ([x, y, w, h, colour] in CSS pixels) in a saved capture —
// for canvas-rendered apps whose text the DOM mask cannot reach.
async function redact(file, boxes, scale) {
  if (!boxes?.length) return;
  const overlays = boxes.map(([x, y, w, h, color]) => ({
    input: { create: { width: Math.round(w * scale), height: Math.round(h * scale), channels: 4, background: color } },
    left: Math.round(x * scale),
    top: Math.round(y * scale),
  }));
  const buf = await sharp(file).composite(overlays).png().toBuffer();
  fs.writeFileSync(file, buf);
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
    const ctx = await browser.newContext({ ...DEVICES[device], locale: 'en-IN', timezoneId: 'Asia/Kolkata', ...(spec.context ?? {}) });
    const page = await ctx.newPage();
    try {
      if (spec.setup) await spec.setup({ ctx, page, role, device, accounts, browser, sleep });
      await login(page, role);
    } catch (e) {
      console.log(`  ✗ sign-in failed, group skipped: ${e.message.split('\n')[0]}`);
      await ctx.close();
      continue;
    }

    for (const shot of list) {
      const t0 = Date.now();
      try {
        if (shot.height) await page.setViewportSize({ width: DEVICES[device].viewport.width, height: shot.height });
        // `path: null` stays put: apps whose deep links only work through in-app navigation.
        if (shot.path !== null) await goto(page, spec.base + shot.path);
        await sleep(shot.settle ?? spec.settle ?? 2500);
        for (const step of shot.steps ?? []) await runStep(page, step);
        await page.evaluate(installMask, { ...mask, hide: [...(mask.hide ?? []), ...(shot.hide ?? [])] });
        if (spec.afterMask) await page.evaluate(spec.afterMask);
        await sleep(600);
        if (shot.scroll !== undefined) {
          await page.evaluate((y) => window.scrollTo(0, y), shot.scroll);
          await sleep(500);
        }

        const dir = path.join(outRoot, shotDir(role, device));
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `${shot.id}.png`);
        await page.screenshot({ path: file, fullPage: !!shot.full, clip: shot.clip, animations: 'disabled' });
        await redact(file, [...(spec.redact?.[device] ?? []), ...(shot.redact ?? [])], DEVICES[device].deviceScaleFactor);
        const size = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
        manifest[`${shotDir(role, device)}/${shot.id}`] = {
          title: shot.title,
          role,
          device,
          url: shot.path === null ? page.url() : spec.base + shot.path,
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
