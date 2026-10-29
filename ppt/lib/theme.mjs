// Writes the deck's own colour scheme and theme name into ppt/theme/theme1.xml.
// pptxgenjs sets the theme fonts but always writes Office's default palette.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));
const SLOTS = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];

export async function applyTheme(deckPath, theme) {
  const zip = await JSZip.loadAsync(fs.readFileSync(deckPath));
  const part = 'ppt/theme/theme1.xml';
  for (const k of SLOTS) {
    if (!/^[0-9A-F]{6}$/i.test(theme.colors[k] ?? '')) throw new Error(`theme colour ${k} must be six hex digits`);
  }
  const name = theme.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const scheme = `<a:clrScheme name="${name}">${SLOTS.map((k) => `<a:${k}><a:srgbClr val="${theme.colors[k].toUpperCase()}"/></a:${k}>`).join('')}</a:clrScheme>`;
  let xml = (await zip.file(part).async('string'))
    .replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme)
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, head) => `${head}${name}"`);
  // PowerPoint routes some punctuation (— “ ”) through the East Asian slot; an
  // empty slot falls back to a system font, so point it at the theme font too.
  if (theme.font) xml = xml.replace(/<a:ea typeface=""\/>/g, `<a:ea typeface="${theme.font}"/>`);
  zip.file(part, xml);

  // A scheme colour given to a hex-only option is written as an invalid srgbClr.
  for (const n of Object.keys(zip.files)) {
    if (!n.endsWith('.xml')) continue;
    const bad = (await zip.file(n).async('string')).match(/<a:srgbClr val="((?![0-9A-Fa-f]{6}")[^"]*)"/);
    if (bad) throw new Error(`${n}: <a:srgbClr val="${bad[1]}"> is not a hex colour`);
  }
  fs.writeFileSync(deckPath, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}
