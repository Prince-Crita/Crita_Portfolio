// Build-time access to the shared portfolio content and the media manifest.
// The website deliberately never reads content/demo-access.json (presenter-only
// logins); public demo accounts live in portfolio.json under each project's `demo`.
import content from '../../../content/portfolio.json';
import media from '../data/media.json';

export type Project = (typeof content.projects)[number];
export type MediaEntry = {
  w: number;
  h: number;
  device: 'desktop' | 'mobile';
  title: string;
  variants: { w: number; src: string }[];
  print?: { w: number; src: string }[];
};

export const site = content;
export const company = content.company;
export const projects = content.projects;

export const projectById = (id: string) => projects.find((p) => p.id === id)!;

export function neighbours(id: string) {
  const i = projects.findIndex((p) => p.id === id);
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  };
}

export function shot(key: string): MediaEntry {
  const m = (media as Record<string, MediaEntry>)[key];
  if (!m) throw new Error(`Unknown screenshot "${key}" — run "npm run media"`);
  return m;
}

type Demo = { roles: string[]; public?: { role: string; user: string; pass: string }[]; publicNote?: string };
const demoOf = (id: string) => (projectById(id) as Project & { demo?: Demo }).demo;

/** Demo accounts that may be shown publicly (website and PDF), or null. */
export const publicDemo = (id: string) => demoOf(id)?.public ?? null;

/** Role names offered in a guided demo, without credentials. */
export const demoRoles = (id: string) => demoOf(id)?.roles ?? [];

export const mailto = (subject: string) =>
  `mailto:${company.contact.email}?subject=${encodeURIComponent(subject)}`;
