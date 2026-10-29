// Builds the sales deck from content/portfolio.json and the rendered art (ppt/art).
//   npm run build:web && node ppt/build-art.mjs && node ppt/build-deck.mjs [--presenter]
// Output: ppt/Crita-Portfolio-2026.pptx — every text element is native and editable,
// presenter guidance lives in the speaker notes, and the deck is safe to send.
// --presenter writes the same deck to ppt/presenter/ (git-ignored) with the
// presenter-only demo logins from content/demo-access.json added to the notes.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';
import { applyTheme } from './lib/theme.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const content = read('content/portfolio.json');
const PRESENTER = process.argv.includes('--presenter');
const accessFile = path.join(root, 'content', 'demo-access.json');
if (PRESENTER && !fs.existsSync(accessFile)) {
  console.warn('content/demo-access.json not found — presenter copy skipped.');
  process.exit(0);
}
// Presenter-only logins: read for the presenter copy only, so the main deck can never carry them.
const access = PRESENTER ? read('content/demo-access.json') : {};
const media = read('web/src/data/media.json');
const art = read('ppt/art/manifest.json');
const { company, projects } = content;
const year = content.meta.year;
// DECK_FONT lets QA build a copy in a substitute font to prove the layout
// survives on machines without Satoshi; the real deck always uses Satoshi.
const FONT = process.env.DECK_FONT || 'Satoshi';
const FONT_MEDIUM = process.env.DECK_FONT || 'Satoshi Medium';
const OUT = process.env.DECK_OUT || (PRESENTER
  ? path.join(root, 'ppt', 'presenter', `Crita-Portfolio-${year}-Presenter.pptx`)
  : path.join(root, 'ppt', `Crita-Portfolio-${year}.pptx`));
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// ── Palette ──────────────────────────────────────────────────────────
const HEX = {
  ink: '0D1813', ink2: '34433B', ink3: '5C6A62', paper: 'F5F5EF', paper2: 'ECEBE1', white: 'FFFFFF',
  night: '06120D', night2: '0B1D16', forest: '033F2D', moss: '4E6B31', leaf: '7FA53F', lime: 'D6E151', cream: 'ECEBCB',
  onDark: 'EEF0E6', onDark2: 'BFC4BA', onDark3: '8C938B', line: 'D3D5CC', lineDark: '2A3832',
};
const THEME = {
  name: 'Crita Portfolio',
  colors: {
    dk1: HEX.ink, lt1: HEX.white, dk2: HEX.forest, lt2: HEX.paper,
    accent1: HEX.leaf, accent2: HEX.lime, accent3: HEX.moss, accent4: HEX.night, accent5: HEX.cream, accent6: HEX.ink3,
    hlink: HEX.moss, folHlink: HEX.moss,
  },
};
const hex = (c) => c.replace('#', '').toUpperCase();

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 × 7.5 in
pres.title = content.meta.title;
pres.subject = content.meta.description;
pres.author = company.name;
pres.company = company.name;
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
const C = pres.SchemeColor;
const S = pres.ShapeType;

const brand = (f) => path.join(root, 'ppt', 'brand', f);
const W = 13.333;
const M = 0.6; // side margin

// Slide transitions by slide number: chapters fade through black, slides that
// repeat a layout morph, everything else fades (see addMotion at the end).
const motion = {};
const mark = (kind) => (motion[pres.slides.length] = kind);

// ── Layouts ──────────────────────────────────────────────────────────
const footer = (dark) => [
  { text: { text: `${company.name} — Selected work ${year}`, options: { x: M, y: 7.02, w: 6, h: 0.22, fontSize: 8.5, color: dark ? HEX.onDark3 : HEX.ink3, margin: 0 } } },
];
const slideNumber = (dark) => ({ x: W - M - 0.6, y: 7.02, w: 0.6, h: 0.22, fontSize: 8.5, color: dark ? HEX.onDark3 : HEX.ink3, align: 'right' });
const titlePh = (dark, opts = {}) => ({
  placeholder: {
    options: { name: 'title', type: 'title', x: M, y: 0.84, w: 10, h: 0.75, fontSize: 28, bold: true, color: dark ? HEX.onDark : HEX.ink, align: 'left', valign: 'top', margin: 0, charSpacing: -0.6, ...opts },
    text: '',
  },
});

pres.defineSlideMaster({ title: 'Cover', background: { color: HEX.night }, objects: [] });
pres.defineSlideMaster({ title: 'Content Light', background: { color: HEX.paper }, objects: [...footer(false), titlePh(false)], slideNumber: slideNumber(false) });
pres.defineSlideMaster({ title: 'Content Dark', background: { color: HEX.night }, objects: [...footer(true), titlePh(true)], slideNumber: slideNumber(true) });
const introTitle = { y: 0.98, w: 5.25, h: 1.62, fontSize: 40, lineSpacingMultiple: 0.92, charSpacing: -1 };
pres.defineSlideMaster({ title: 'Project Intro Light', background: { color: HEX.paper }, objects: [...footer(false), titlePh(false, introTitle)], slideNumber: slideNumber(false) });
pres.defineSlideMaster({ title: 'Project Intro Dark', background: { color: HEX.night }, objects: [...footer(true), titlePh(true, introTitle)], slideNumber: slideNumber(true) });

// ── Helpers ──────────────────────────────────────────────────────────
const tb = (opts) => ({ margin: 0, valign: 'top', isTextBox: true, ...opts });

function label(s, text, x, y, { dark = false, w = 7 } = {}) {
  s.addImage({ path: brand('c.png'), x, y: y + 0.045, w: 0.2, h: 0.147, altText: '' });
  s.addText(text.toUpperCase(), tb({ x: x + 0.29, y, w, h: 0.24, fontSize: 9, bold: true, charSpacing: 2, color: dark ? HEX.onDark3 : HEX.ink3, valign: 'middle' }));
}

/** An invisible clickable area that jumps to a slide (keeps link text unstyled). */
// `to` is a slide number or a web address.
function linkArea(s, to, x, y, w, h, tooltip) {
  const hyperlink = typeof to === 'number' ? { slide: to, tooltip } : { url: to, tooltip };
  s.addShape(S.rect, { x, y, w, h, fill: { color: HEX.white, transparency: 100 }, line: { type: 'none' }, hyperlink });
}

function rule(s, x, y, w, dark = false) {
  s.addShape(S.line, { x, y, w, h: 0, line: { color: dark ? HEX.lineDark : HEX.line, width: 0.75 } });
}

/** Places a rendered composition so its frames fill `box` (fit, aligned). */
// `reveal` names the picture so the slide's entrance animation can find it (see transitions below).
function placeArt(s, name, box, { align = 'center', valign = 'middle', alt = '', reveal } = {}) {
  const a = art[name];
  if (!a) throw new Error(`missing art "${name}" — run node ppt/build-art.mjs`);
  const cw = a.w - a.pad.l - a.pad.r;
  const ch = a.h - a.pad.t - a.pad.b;
  const k = Math.min(box.w / cw, box.h / ch);
  const fw = cw * k;
  const fh = ch * k;
  const fx = align === 'left' ? box.x : align === 'right' ? box.x + box.w - fw : box.x + (box.w - fw) / 2;
  const fy = valign === 'top' ? box.y : valign === 'bottom' ? box.y + box.h - fh : box.y + (box.h - fh) / 2;
  s.addImage({
    path: path.join(root, 'ppt', 'art', `${name}.jpg`), x: fx - a.pad.l * k, y: fy - a.pad.t * k, w: a.w * k, h: a.h * k, altText: alt,
    ...(reveal ? { objectName: `reveal-${reveal}` } : {}),
  });
  return { x: fx, y: fy, w: fw, h: fh };
}

function chips(s, items, x, y, maxW, { dark = false } = {}) {
  let cx = x;
  let cy = y;
  const h = 0.3;
  for (const t of items) {
    const w = 0.3 + t.length * 0.068;
    if (cx + w > x + maxW) {
      cx = x;
      cy += h + 0.1;
    }
    s.addText(t, tb({
      shape: S.roundRect, rectRadius: 0.15, x: cx, y: cy, w, h, fontSize: 9.5, align: 'center', valign: 'middle',
      color: dark ? HEX.onDark2 : HEX.ink2, line: { color: dark ? HEX.lineDark : 'C3C6BD', width: 0.75 }, fill: { color: dark ? HEX.night2 : HEX.paper },
    }));
    cx += w + 0.09;
  }
  return cy + h;
}

function bullets(s, items, x, y, w, h, { dark = false, size = 10.5, color } = {}) {
  s.addText(
    // "•" stays in the text font; "●" would be routed to a CJK fallback font.
    items.map((t, i) => ({ text: t, options: { bullet: { code: '2022', indent: 13 }, breakLine: i < items.length - 1, paraSpaceAfter: 4 } })),
    tb({ x, y, w, h, fontSize: size, color: color ?? (dark ? HEX.onDark2 : HEX.ink2) })
  );
}

const pad2 = (n) => String(n).padStart(2, '0');
const isMobile = (k) => media[k]?.device === 'mobile';
const dark = (p) => p.theme.stageInk === 'light';
const join = (a) => a.join(', ').replace(/, ([^,]*)$/, ' and $1');
const nameOf = (id) => projects.find((p) => p.id === id).name;
const COUNT = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'][projects.length] ?? String(projects.length);

// Slide numbers are fixed by structure: 4 opening slides, 8 per project, then the close.
const PER_PROJECT = 8;
const introSlide = (i) => 5 + i * PER_PROJECT;

// ── 1. Cover ─────────────────────────────────────────────────────────
pres.addSection({ title: 'Introduction' });
{
  const s = pres.addSlide({ masterName: 'Cover', sectionTitle: 'Introduction' });
  mark('chapter');
  s.addImage({ path: brand('logo.png'), x: M, y: 0.55, w: 1.55, h: 1.55 * (124 / 644), altText: 'Crita' });
  s.addText(`SELECTED WORK ${year}`, tb({ x: W - M - 3.4, y: 0.58, w: 3.4, h: 0.24, fontSize: 9, bold: true, charSpacing: 2, color: HEX.onDark3, align: 'right', valign: 'middle' }));
  label(s, company.positioning, M, 1.72, { dark: true, w: 4.6 });
  s.addText(
    [
      { text: 'Software that brings ', options: { color: HEX.onDark } },
      { text: 'clarity', options: { color: HEX.lime } },
      { text: ' to complex operations.', options: { color: HEX.onDark } },
    ],
    tb({ x: M, y: 2.08, w: 5.7, h: 2.55, fontSize: 44, bold: true, lineSpacingMultiple: 0.9, charSpacing: -1.2 })
  );
  s.addText(company.intro, tb({ x: M, y: 4.72, w: 5.3, h: 1.15, fontSize: 13, color: HEX.onDark2, lineSpacingMultiple: 1.12 }));
  placeArt(s, 'cover', { x: 6.55, y: 1.3, w: 6.2, h: 4.6 }, { alt: 'Screens from SMC Task Management, Clario, Veloce Scrap Flow and City Threads' });
  rule(s, M, 6.12, W - 2 * M, true);
  // Every project, five to a row, each a link to its first slide.
  const colW = (W - 2 * M) / 5;
  projects.forEach((p, i) => {
    const x = M + (i % 5) * colW;
    const y = 6.24 + Math.floor(i / 5) * 0.42;
    s.addText(
      [
        { text: `${p.number}  `, options: { color: HEX.lime, bold: true, fontSize: 9 } },
        { text: p.name, options: { color: HEX.onDark, bold: true, fontSize: 11 } },
      ],
      tb({ x, y, w: colW - 0.12, h: 0.32, valign: 'middle' })
    );
    linkArea(s, introSlide(i), x, y, colW - 0.12, 0.32, `Go to ${p.name}`);
  });
  s.addNotes(
    `OPEN — who we are in one breath.\n` +
      `“Crita is a consulting-led technology partner. We design and build custom business platforms around the way each business actually works.”\n\n` +
      `What follows: ${COUNT.toLowerCase()} platforms we built — ${projects.map((p) => `${p.name} (${p.type.toLowerCase()})`).join('; ')}. ` +
      `Screens are from the products themselves; Veloce Trade’s come from its user guide.\n\n` +
      `Tip: click a project name at the bottom to jump straight to it.`
  );
}

// ── 2. Who we are ────────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: 'Content Light', sectionTitle: 'Introduction' });
  label(s, 'Who we are', M, 0.55);
  s.addText(company.name, { placeholder: 'title' });
  s.addText(company.positioning, tb({ x: M, y: 1.55, w: 7, h: 0.32, fontSize: 14, bold: true, color: HEX.leaf }));
  s.addText(company.about, tb({ x: M, y: 2.05, w: 7.6, h: 1.55, fontSize: 19, fontFace: FONT_MEDIUM, color: HEX.ink, lineSpacingMultiple: 1.12 }));
  s.addText(company.intro, tb({ x: M, y: 3.62, w: 7.3, h: 0.95, fontSize: 12, color: HEX.ink3, lineSpacingMultiple: 1.15 }));
  company.stats.forEach((st, i) => {
    const y = 1.45 + i * 1.5;
    s.addText(st.value, tb({ x: 9.4, y, w: 3.3, h: 0.85, fontSize: 54, bold: true, color: HEX.ink, charSpacing: -2 }));
    s.addText(st.label, tb({ x: 9.4, y: y + 0.86, w: 3.3, h: 0.3, fontSize: 11.5, color: HEX.ink3 }));
  });
  s.addText(`Figures from ${company.statsSource}.`, tb({ x: 9.4, y: 4.3, w: 3.3, h: 0.25, fontSize: 9, color: HEX.ink3 }));
  label(s, `How we work — ${company.approach.title}`, M, 4.95);
  company.approach.steps.forEach((st, i) => {
    const x = M + i * 3.06;
    rule(s, x, 5.35, 2.86);
    s.addText(
      [
        { text: pad2(i + 1), options: { bold: true, color: HEX.leaf, fontSize: 9.5, breakLine: true } },
        { text: st.title, options: { bold: true, color: HEX.ink, fontSize: 15, breakLine: true } },
        { text: st.body, options: { color: HEX.ink3, fontSize: 10.5 } },
      ],
      tb({ x, y: 5.5, w: 2.86, h: 1.4, paraSpaceAfter: 3 })
    );
  });
  s.addNotes(
    `WHO WE ARE\n${company.about}\n\n` +
      `Proof points from crita.in: ${company.stats.map((x) => `${x.value} ${x.label.toLowerCase()}`).join(', ')}.\n\n` +
      `How we work — “Clarity, then code”: Discover, Strategize, Build, Scale. We earn the right to build by understanding the business first.`
  );
}

// ── 3. What we build ─────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: 'Content Light', sectionTitle: 'Introduction' });
  s.background = { color: HEX.paper2 };
  label(s, 'Capabilities', M, 0.55);
  s.addText('What we build for growing businesses.', { placeholder: 'title' });
  s.addText('Every capability is demonstrated in the work that follows.', tb({ x: M, y: 1.55, w: 8, h: 0.35, fontSize: 13, color: HEX.ink3 }));
  company.capabilities.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * 4.09;
    const y = 2.3 + row * 2.3;
    rule(s, x, y, 3.85);
    s.addText(
      [
        { text: pad2(i + 1), options: { bold: true, color: HEX.leaf, fontSize: 9.5, breakLine: true } },
        { text: c.title, options: { bold: true, color: HEX.ink, fontSize: 16, breakLine: true } },
        { text: c.body, options: { color: HEX.ink3, fontSize: 11, breakLine: true } },
        { text: c.proof.map(nameOf).join('  ·  '), options: { color: HEX.moss, fontSize: 9.5, bold: true } },
      ],
      tb({ x, y: y + 0.16, w: 3.75, h: 1.95, paraSpaceAfter: 4 })
    );
  });
  s.addNotes(
    `WHAT WE BUILD — six capabilities, each proven by a project in this deck:\n` +
      company.capabilities.map((c, i) => `${i + 1}. ${c.title} — ${c.body} (see ${c.proof.map(nameOf).join(', ')})`).join('\n') +
      `\n\nAsk the client which of these matters most, then jump to that project.`
  );
}

// ── 4. Selected work ─────────────────────────────────────────────────
{
  const s = pres.addSlide({ masterName: 'Content Light', sectionTitle: 'Introduction' });
  label(s, 'Selected work', M, 0.55);
  s.addText(`${COUNT} platforms, each built around how the business actually works.`, { placeholder: 'title', w: 11 });
  // Five cards a row: the project's stage with its screens, then number, name and sector.
  const gap = 0.24;
  const cw = (W - 2 * M - 4 * gap) / 5;
  projects.forEach((p, i) => {
    const x = M + (i % 5) * (cw + gap);
    const y = 1.85 + Math.floor(i / 5) * 2.55;
    s.addShape(S.roundRect, { x, y, w: cw, h: 1.5, fill: { color: hex(p.theme.stage) }, line: { type: 'none' }, rectRadius: 0.1 });
    placeArt(s, `${p.id}-hero`, { x: x + 0.14, y: y + 0.14, w: cw - 0.28, h: 1.22 }, { alt: `${p.name} screens` });
    s.addText(
      [
        { text: p.number, options: { bold: true, color: HEX.leaf, fontSize: 9, breakLine: true } },
        { text: p.name, options: { bold: true, color: HEX.ink, fontSize: 13, breakLine: true } },
        { text: p.sector, options: { color: HEX.ink3, fontSize: 9, breakLine: true } },
        { text: `Slide ${introSlide(i)} →`, options: { color: HEX.moss, fontSize: 9, bold: true } },
      ],
      tb({ x, y: y + 1.6, w: cw, h: 0.88, paraSpaceAfter: 2 })
    );
    linkArea(s, introSlide(i), x, y, cw, 2.45, `Go to ${p.name}`);
  });
  s.addNotes(
    `SELECTED WORK — ${COUNT.toLowerCase()} platforms. Click any card or name to jump to that project; use the section list (left panel) to hide projects you won't present.\n\n` +
      projects.map((p, i) => `${p.number} ${p.name} (slide ${introSlide(i)}) — ${p.client}, ${p.sector}. ${p.tagline}`).join('\n')
  );
}

// ── Projects ─────────────────────────────────────────────────────────
projects.forEach((p, pi) => {
  const section = `${p.number} · ${p.name}`;
  pres.addSection({ title: section });
  const d = dark(p);
  const stage = hex(p.theme.stage);
  const tint = hex(p.theme.tint);
  const text1 = d ? HEX.onDark : HEX.ink;
  const text2 = d ? HEX.onDark2 : HEX.ink2;
  const text3 = d ? HEX.onDark3 : HEX.ink3;
  const presenter = access[p.id]; // presenter-only logins and demo path (optional file)
  const publicAccounts = p.demo?.public ?? null;

  // 1 · Intro
  {
    const s = pres.addSlide({ masterName: d ? 'Project Intro Dark' : 'Project Intro Light', sectionTitle: section });
    mark('chapter');
    s.background = { color: stage };
    label(s, `${p.number} — ${p.type}`, M, 0.6, { dark: d, w: 5.2 });
    s.addText(p.name, { placeholder: 'title' });
    // Names that set on one line at 40pt close the gap below them. The width is a
    // rough estimate in ems (narrow, wide and capital letters), less the title's
    // -1pt letter-spacing, against the 5.25in box.
    const em = [...p.name].reduce((w, c) => w + (/[iljtfr .,'’]/.test(c) ? 0.3 : /[mwMW]/.test(c) ? 0.85 : /[A-Z]/.test(c) ? 0.68 : 0.56), 0);
    const lift = em * (40 / 72) - p.name.length / 72 <= 5.25 ? 0.62 : 0;
    s.addText(p.tagline, tb({ x: M, y: 2.68 - lift, w: 5.0, h: 0.85, fontSize: 16.5, fontFace: FONT_MEDIUM, color: text1, lineSpacingMultiple: 1.08 }));
    s.addText(p.summary, tb({ x: M, y: 3.58 - lift, w: 5.0, h: 1.45, fontSize: 11, color: text2, lineSpacingMultiple: 1.15 }));
    rule(s, M, 5.2, 5.0, d);
    [['Client', p.client], ['Sector', p.sector], ['Platform', p.platforms], ['Roles', p.roles]].forEach(([k, v], i) => {
      const x = M + (i % 2) * 2.6;
      const y = 5.36 + Math.floor(i / 2) * 0.76;
      s.addText(
        [
          { text: k.toUpperCase(), options: { fontSize: 8, bold: true, charSpacing: 1.6, color: text3, breakLine: true } },
          // PowerPoint never breaks a line at " · ": a zero-width space after the dot lets it.
          { text: v.replace(/ · /g, ' ·​ '), options: { fontSize: 11, bold: true, color: text1 } },
        ],
        tb({ x, y, w: 2.45, h: 0.7, paraSpaceAfter: 2 })
      );
    });
    placeArt(s, `${p.id}-hero`, { x: 6.0, y: 1.05, w: 6.75, h: 5.4 }, { alt: `${p.name} on desktop and mobile`, reveal: 1 });
    s.addNotes(
      `${p.name.toUpperCase()} — ${p.client} (${p.sector}).\n\nOne-liner: “${p.tagline}”\n\n${p.summary}\n\n` +
        (p.live ? `Live: ${p.live.name}` : 'In production — shown in a walkthrough, no public link.') + (p.privacy ? `\nNote: ${p.privacy}` : '')
    );
  }

  // 2 · Challenge → what we built
  {
    const s = pres.addSlide({ masterName: 'Content Light', sectionTitle: section });
    label(s, 'The challenge', M, 0.6, { w: 5 });
    s.addText(p.challenge.headline, tb({ x: M, y: 0.92, w: 5.25, h: 0.95, fontSize: 19, bold: true, color: HEX.ink, lineSpacingMultiple: 1.0, charSpacing: -0.4 }));
    s.addText(p.challenge.body, tb({ x: M, y: 1.92, w: 5.25, h: 1.75, fontSize: 11.5, color: HEX.ink3, lineSpacingMultiple: 1.15 }));
    label(s, 'What we built', M, 3.82, { w: 5 });
    s.addText(p.solution.headline, tb({ x: M, y: 4.14, w: 5.25, h: 0.95, fontSize: 19, bold: true, color: HEX.ink, lineSpacingMultiple: 1.0, charSpacing: -0.4 }));
    s.addText(p.solution.body, tb({ x: M, y: 5.12, w: 5.25, h: 1.75, fontSize: 11.5, color: HEX.ink3, lineSpacingMultiple: 1.15 }));
    s.addShape(S.roundRect, { x: 6.3, y: 0.55, w: 6.43, h: 6.25, fill: { color: tint }, line: { type: 'none' }, rectRadius: 0.16 });
    placeArt(s, `${p.id}-cs`, { x: 6.75, y: 1.0, w: 5.55, h: 5.35 }, { alt: `${p.name} screens` });
    s.addNotes(`THE CHALLENGE\n${p.challenge.body}\n\nWHAT WE BUILT\n${p.solution.body}\n\nAsk: “Does this sound like your operation?” — then show the product.`);
  }

  // 3–4 · Product experience
  [[0, 1], [2, 3]].forEach((pair, part) => {
    const s = pres.addSlide({ masterName: 'Content Light', sectionTitle: section });
    if (part === 1) mark('morph');
    s.background = { color: tint };
    label(s, `Product experience · ${part + 1} of 2`, M, 0.55);
    s.addText(`Inside ${p.name}.`, { placeholder: 'title' });
    pair.forEach((idx, j) => {
      const t = p.tour[idx];
      const x = M + j * 6.17;
      const cap = [
        { text: pad2(idx + 1), options: { bold: true, color: HEX.leaf, fontSize: 9.5, breakLine: true } },
        { text: t.title, options: { bold: true, color: HEX.ink, fontSize: 15, breakLine: true } },
        { text: t.body, options: { color: HEX.ink3, fontSize: 11 } },
      ];
      if (isMobile(t.shot)) {
        placeArt(s, `${p.id}-tour-${idx}`, { x, y: 1.75, w: 2.3, h: 5.05 }, { align: 'left', valign: 'top', alt: t.title, reveal: j + 1 });
        s.addText(cap, tb({ x: x + 2.6, y: 3.2, w: 3.2, h: 2.0, paraSpaceAfter: 4 }));
      } else {
        placeArt(s, `${p.id}-tour-${idx}`, { x, y: 1.75, w: 5.9, h: 3.75 }, { align: 'left', valign: 'top', alt: t.title, reveal: j + 1 });
        s.addText(cap, tb({ x, y: 5.72, w: 5.7, h: 1.15, paraSpaceAfter: 3 }));
      }
    });
    s.addNotes(`PRODUCT EXPERIENCE\n` + pair.map((idx) => `${idx + 1}. ${p.tour[idx].title} — ${p.tour[idx].body}`).join('\n'));
  });

  // 5 · Key capabilities
  {
    const s = pres.addSlide({ masterName: 'Content Light', sectionTitle: section });
    label(s, 'Key capabilities', M, 0.55);
    s.addText(`What ${p.name} does.`, { placeholder: 'title', w: 8.3 });
    p.capabilities.forEach((c, i) => {
      const x = M + (i % 2) * 4.2;
      const y = 1.85 + Math.floor(i / 2) * 1.68;
      rule(s, x, y, 3.95);
      s.addText(
        [
          { text: pad2(i + 1), options: { bold: true, color: HEX.leaf, fontSize: 9.5, breakLine: true } },
          { text: c.title, options: { bold: true, color: HEX.ink, fontSize: 14, breakLine: true } },
          { text: c.body, options: { color: HEX.ink3, fontSize: 10.5 } },
        ],
        tb({ x, y: y + 0.13, w: 3.9, h: 1.45, paraSpaceAfter: 3 })
      );
    });
    s.addShape(S.roundRect, { x: 9.3, y: 0.55, w: 3.43, h: 6.25, fill: { color: stage }, line: { type: 'none' }, rectRadius: 0.16 });
    placeArt(s, `${p.id}-capphone`, { x: 9.55, y: 0.85, w: 2.93, h: 5.65 }, { alt: `${p.name} on a phone` });
    s.addNotes(`KEY CAPABILITIES — pick the two or three that matter to this client:\n` + p.capabilities.map((c, i) => `${i + 1}. ${c.title} — ${c.body}`).join('\n'));
  }

  // 6 · Roles, or architecture for Clario
  if (p.rolesDetail.length) {
    const s = pres.addSlide({ masterName: d ? 'Content Dark' : 'Content Light', sectionTitle: section });
    s.background = { color: stage };
    label(s, 'Role-based experience', M, 0.55, { dark: d });
    s.addText('Built for every role.', { placeholder: 'title' });
    const n = p.rolesDetail.length;
    const gap = 0.35;
    const colW = (W - 2 * M - gap * (n - 1)) / n;
    p.rolesDetail.forEach((r, i) => {
      const x = M + i * (colW + gap);
      placeArt(s, `${p.id}-role-${i}`, { x, y: 1.6, w: colW, h: 2.95 }, { align: 'left', valign: 'bottom', alt: `${r.name} view` });
      rule(s, x, 4.72, colW, d);
      s.addText(
        [
          { text: r.device.toUpperCase(), options: { fontSize: 8, bold: true, charSpacing: 1.6, color: text3, breakLine: true } },
          { text: r.name, options: { fontSize: 17, bold: true, color: text1, breakLine: true } },
          { text: r.lead, options: { fontSize: 11, color: text1 } },
        ],
        tb({ x, y: 4.86, w: colW, h: 0.95, paraSpaceAfter: 2 })
      );
      bullets(s, r.points, x, 5.8, colW, 1.15, { dark: d, size: 10 });
    });
    s.addNotes(`ROLES\n` + p.rolesDetail.map((r) => `${r.name} (${r.device}) — ${r.lead} ${r.points.join('; ')}.`).join('\n'));
  } else if (p.architecture) {
    const a = p.architecture;
    const s = pres.addSlide({ masterName: 'Content Light', sectionTitle: section });
    s.background = { color: stage };
    label(s, 'Platform architecture', M, 0.55);
    s.addText(a.title, { placeholder: 'title' });
    s.addText(a.principle, tb({ x: M, y: 1.6, w: 11, h: 0.4, fontSize: 13, color: HEX.ink2 }));
    a.layers.forEach((layer, i) => {
      const y = 2.3 + i * 0.95;
      s.addShape(S.roundRect, { x: M, y, w: W - 2 * M, h: 0.78, fill: { color: HEX.white, transparency: 25 }, line: { type: 'none' }, rectRadius: 0.12 });
      s.addText(layer.name.toUpperCase(), tb({ x: M + 0.3, y, w: 1.9, h: 0.78, fontSize: 9, bold: true, charSpacing: 1.8, color: HEX.ink3, valign: 'middle' }));
      let x = M + 2.3;
      layer.items.forEach((it) => {
        const live = it.status === 'Live';
        const dev = it.status === 'In development';
        const w = 0.55 + it.label.length * 0.085 + it.status.length * 0.06;
        s.addText(
          [
            { text: it.label, options: { bold: true, color: live ? HEX.onDark : HEX.ink, fontSize: 11 } },
            { text: `   ${it.status.toUpperCase()}`, options: { bold: true, color: live ? HEX.lime : dev ? '7A6512' : HEX.ink3, fontSize: 8, charSpacing: 1 } },
          ],
          tb({ shape: S.roundRect, rectRadius: 0.24, x, y: y + 0.16, w, h: 0.46, align: 'center', valign: 'middle', fill: { color: live ? HEX.forest : HEX.white }, line: live ? { type: 'none' } : { color: 'C3C6BD', width: 0.75 } })
        );
        x += w + 0.14;
      });
    });
    s.addText('“Live” is available in the product today. “In development” and “Planned” describe the platform’s direction.', tb({ x: M, y: 6.25, w: 11, h: 0.3, fontSize: 9.5, color: HEX.ink3 }));
    s.addNotes(
      p.id === 'clario'
        ? `ARCHITECTURE — be precise about what is live.\nLive today: Zoho Books connection, the Finance command centre and Ask Clario, on multi-workspace tenancy.\n` +
            `In development: Tally. Planned: inventory connectors (e.g. Veloce, City Threads) and lead management.\n\n${a.principle}`
        : `ARCHITECTURE — ${a.title}\n` + a.layers.map((l) => `${l.name}: ${l.items.map((it) => `${it.label} (${it.status})`).join(', ')}.`).join('\n') + `\n\n${a.principle}`
    );
  }

  // 7 · Responsive
  {
    const s = pres.addSlide({ masterName: d ? 'Content Dark' : 'Content Light', sectionTitle: section });
    s.background = { color: stage };
    label(s, 'Responsive experience', M, 0.55, { dark: d });
    s.addText(p.mobileTitle, { placeholder: 'title', w: 4.4, h: 1.7, fontSize: 26, lineSpacingMultiple: 0.98 });
    s.addText(p.mobileNote, tb({ x: M, y: 2.75, w: 4.1, h: 1.6, fontSize: 13, color: text2, lineSpacingMultiple: 1.15 }));
    placeArt(s, `${p.id}-mobile`, { x: 5.05, y: 0.75, w: 7.7, h: 5.95 }, { alt: `${p.name} on phones`, reveal: 1 });
    s.addNotes(`RESPONSIVE\n${p.mobileNote}\n\nScreens: ${p.mobile.map((k) => media[k].title).join(' · ')}.`);
  }

  // 8 · Value, delivery and live product
  {
    const s = pres.addSlide({ masterName: 'Content Light', sectionTitle: section });
    label(s, 'Business value', M, 0.55);
    s.addText('What it changes for the business.', { placeholder: 'title', w: 7.6 });
    p.value.forEach((v, i) => {
      const x = M + (i % 2) * 3.82;
      const y = 1.85 + Math.floor(i / 2) * 1.45;
      rule(s, x, y, 3.6);
      s.addText(
        [
          { text: v.title, options: { bold: true, color: HEX.ink, fontSize: 14.5, breakLine: true } },
          { text: v.body, options: { color: HEX.ink3, fontSize: 10.5 } },
        ],
        tb({ x, y: y + 0.14, w: 3.55, h: 1.2, paraSpaceAfter: 3 })
      );
    });
    if (p.quote) {
      s.addShape(S.roundRect, { x: M, y: 4.85, w: 7.42, h: 1.95, fill: { color: HEX.forest }, line: { type: 'none' }, rectRadius: 0.14 });
      s.addText(
        [
          { text: `“${p.quote.text}”`, options: { color: HEX.onDark, fontSize: 12.5, fontFace: FONT_MEDIUM, breakLine: true } },
          { text: `${p.quote.name} · ${p.quote.company}`, options: { color: HEX.onDark2, fontSize: 10, bold: true } },
        ],
        tb({ x: M + 0.35, y: 5.08, w: 6.75, h: 1.6, paraSpaceAfter: 8, lineSpacingMultiple: 1.12 })
      );
    } else {
      label(s, 'Engineering highlights', M, 4.95, { w: 6 });
      bullets(s, p.delivery.highlights, M, 5.35, 7.3, 1.3, { size: 11.5 });
    }

    const sx = 8.55;
    const sw = W - M - sx;
    label(s, 'Technology & delivery', sx, 0.55, { w: sw });
    const after = chips(s, p.delivery.stack, sx, 0.98, sw);
    if (p.quote) bullets(s, p.delivery.highlights, sx, after + 0.22, sw, 1.65, { size: 10 });
    s.addShape(S.roundRect, { x: sx, y: 4.3, w: sw, h: 2.5, fill: { color: HEX.night }, line: { type: 'none' }, rectRadius: 0.14 });
    if (p.live) {
      label(s, 'Live product', sx + 0.3, 4.55, { dark: true, w: sw - 0.6 });
      s.addText(`${p.live.label} →`, tb({ x: sx + 0.3, y: 4.92, w: sw - 0.6, h: 0.4, fontSize: 16, bold: true, color: HEX.lime, hyperlink: { url: p.live.url, tooltip: p.live.name } }));
      s.addText(p.live.name, tb({ x: sx + 0.3, y: 5.33, w: sw - 0.6, h: 0.25, fontSize: 9, color: HEX.onDark3 }));
      linkArea(s, p.live.url, sx + 0.3, 5.33, Math.min(sw - 0.6, 0.15 + p.live.name.length * 0.07), 0.25, p.live.name);
    } else {
      // In production with no public link: the walkthrough is the demo.
      label(s, 'In production', sx + 0.3, 4.55, { dark: true, w: sw - 0.6 });
      s.addText('Walkthrough on request →', tb({ x: sx + 0.3, y: 4.92, w: sw - 0.6, h: 0.4, fontSize: 16, bold: true, color: HEX.lime, hyperlink: { url: `mailto:${company.contact.email}`, tooltip: company.contact.email } }));
    }
    if (!p.live) {
      s.addText(`A live walkthrough of the ${join(p.demo.roles)} views.`, tb({ x: sx + 0.3, y: 5.75, w: sw - 0.6, h: 0.8, fontSize: 10.5, color: HEX.onDark2 }));
    } else if (p.demo?.selfServe) {
      s.addText(p.demo.selfServe, tb({ x: sx + 0.3, y: 5.75, w: sw - 0.6, h: 0.8, fontSize: 10.5, color: HEX.onDark2 }));
    } else if (publicAccounts) {
      s.addText(
        publicAccounts.flatMap((a, i) => [
          { text: `${a.role}`, options: { bold: true, color: HEX.onDark, breakLine: true } },
          { text: `${a.user}  ·  ${a.pass}`, options: { color: HEX.onDark2, breakLine: i < publicAccounts.length - 1 } },
        ]),
        tb({ x: sx + 0.3, y: 5.72, w: sw - 0.6, h: 0.95, fontSize: 9.5, paraSpaceAfter: 2 })
      );
    } else {
      s.addText(`Live demo: ${join(p.demo.roles)} views.`, tb({ x: sx + 0.3, y: 5.75, w: sw - 0.6, h: 0.8, fontSize: 10.5, color: HEX.onDark2 }));
    }
    s.addText(p.privacy, tb({ x: sx, y: 6.86, w: sw, h: 0.3, fontSize: 8, color: HEX.ink3 }));

    const creds = (list) => list.map((a) => `   ${a.role}: ${a.user}  /  ${a.pass}`).join('\n');
    let demoNotes;
    if (!p.live) demoNotes = `No public link: offer a walkthrough of the ${join(p.demo.roles)} views.`;
    else if (p.demo?.selfServe) demoNotes = p.demo.selfServe;
    else if (publicAccounts) demoNotes = `Demo accounts (${p.demo.publicNote ?? 'public'}):\n${creds(publicAccounts)}`;
    else if (presenter?.accounts.length) demoNotes = `PRESENTER ONLY — do not project, screenshot or send these logins (${presenter.why}):\n${creds(presenter.accounts)}`;
    else demoNotes = `Logins for the live demo are in the presenter copy of this deck.`;
    s.addNotes(
      `BUSINESS VALUE\n` + p.value.map((v) => `• ${v.title} — ${v.body}`).join('\n') +
        (p.quote ? `\n\nClient quote (${p.quote.name}, ${p.quote.company}): “${p.quote.text}”` : '') +
        `\n\nDELIVERY: ${p.delivery.stack.join(', ')}.\n` + p.delivery.highlights.map((h) => `• ${h}`).join('\n') +
        `\n\nLIVE DEMO — ${p.live ? p.live.name : `${p.name} (walkthrough only)`}\n${demoNotes}` +
        (presenter?.path ? `\nSuggested path:\n` + presenter.path.map((x) => `   • ${x}`).join('\n') : '') +
        (pi < projects.length - 1 ? `\n\nNext: ${projects[pi + 1].name}.` : '')
    );
  }
});

// ── Closing ──────────────────────────────────────────────────────────
pres.addSection({ title: 'Closing' });
{
  const s = pres.addSlide({ masterName: 'Cover', sectionTitle: 'Closing' });
  mark('chapter');
  s.addImage({ path: brand('pattern-c.png'), x: 8.6, y: -0.3, w: 5.4, h: 5.4 * (1600 / 1200), transparency: 90, altText: '' });
  label(s, company.closing.eyebrow, M, 1.65, { dark: true });
  s.addText(company.closing.headline, tb({ x: M, y: 2.0, w: 8.2, h: 2.4, fontSize: 46, bold: true, color: HEX.onDark, lineSpacingMultiple: 0.92, charSpacing: -1.2 }));
  s.addText(company.closing.body, tb({ x: M, y: 4.05, w: 7.0, h: 0.8, fontSize: 15, color: HEX.onDark2, lineSpacingMultiple: 1.15 }));
  s.addText(
    [
      { text: company.contact.email, options: { hyperlink: { url: `mailto:${company.contact.email}` }, breakLine: true } },
      { text: company.contact.websiteLabel, options: { hyperlink: { url: company.contact.website } } },
    ],
    tb({ x: M, y: 4.95, w: 6, h: 0.9, fontSize: 17, bold: true, color: HEX.lime, paraSpaceAfter: 4 })
  );
  s.addImage({ path: brand('logo.png'), x: M, y: 6.75, w: 1.3, h: 1.3 * (124 / 644), altText: 'Crita' });
  s.addText(`© ${year} ${company.name}`, tb({ x: W - M - 4, y: 6.82, w: 4, h: 0.22, fontSize: 8.5, color: HEX.onDark3, align: 'right' }));
  s.addNotes(
    `CLOSE — ask for the next step.\n“Tell us where you’re stuck. We’ll come back within one business day with a clear point of view.”\n\n` +
      `Suggested next step: a short discovery conversation about their operation.\nContact: ${company.contact.email} · ${company.contact.websiteLabel}`
  );
}

// ── Motion ───────────────────────────────────────────────────────────
// pptxgenjs writes no transitions or animations, so they are added to the slide
// XML here: a fade on every slide (through black for chapters, a morph with a
// fade fallback where a layout repeats), and the pictures named "reveal-N" fade
// in one after another as the slide opens — no extra clicks for the presenter.
const MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';
const P159 = 'http://schemas.microsoft.com/office/powerpoint/2015/09/main';
const transitionXml = (kind) =>
  kind === 'chapter'
    ? '<p:transition spd="slow"><p:fade thruBlk="1"/></p:transition>'
    : kind === 'morph'
      ? `<mc:AlternateContent xmlns:mc="${MC}"><mc:Choice xmlns:p159="${P159}" Requires="p159"><p:transition spd="slow"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>`
      : '<p:transition spd="med"><p:fade/></p:transition>';

function timingXml(spids) {
  let id = 3;
  let at = 0;
  const effects = spids.map((spid) => {
    const outer = ++id;
    const effect = ++id;
    const set = ++id;
    const fade = ++id;
    const delay = at === 0 ? 150 : 0;
    const xml =
      `<p:par><p:cTn id="${outer}" fill="hold"><p:stCondLst><p:cond delay="${at}"/></p:stCondLst><p:childTnLst>` +
      `<p:par><p:cTn id="${effect}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" nodeType="afterEffect"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst>` +
      `<p:set><p:cBhvr><p:cTn id="${set}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>` +
      `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${fade}" dur="600"/><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr></p:animEffect>` +
      `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`;
    at += delay + 600;
    return xml;
  });
  return (
    `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>` +
    `<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>` +
    effects.join('') +
    `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` +
    `</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`
  );
}

async function addMotion(file) {
  const require = createRequire(import.meta.url);
  const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  for (let n = 1; n <= pres.slides.length; n++) {
    const part = `ppt/slides/slide${n}.xml`;
    let xml = await zip.file(part).async('string');
    // A morph animates the change itself; fading the pictures in as well would compete with it.
    const reveals = motion[n] === 'morph' ? [] : [...xml.matchAll(/<p:cNvPr id="(\d+)" name="reveal-(\d+)"/g)].sort((a, b) => a[2] - b[2]).map((m) => m[1]);
    const motionXml = transitionXml(motion[n] ?? 'fade') + (reveals.length ? timingXml(reveals) : '');
    if (!xml.includes('</p:clrMapOvr>')) throw new Error(`${part}: no clrMapOvr to anchor the transition`);
    xml = xml.replace('</p:clrMapOvr>', `</p:clrMapOvr>${motionXml}`);
    zip.file(part, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

await pres.writeFile({ fileName: OUT });
await applyTheme(OUT, { ...THEME, font: FONT });
await addMotion(OUT);
console.log(`PPTX: ${path.relative(root, OUT)} — ${pres.slides.length} slides, ${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB`);
