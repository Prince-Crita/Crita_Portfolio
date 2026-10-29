import { defineConfig } from 'astro/config';

// Static site. Content and screenshots live one level up (../content, ../screenshots),
// so Vite is allowed to read the whole portfolio folder.
// Set SITE_URL (e.g. https://work.crita.in) at build time to emit canonical and
// social-share URLs; without it they are simply left out.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // The project list is the home page's "Selected work" section; /work/ itself has no page.
  redirects: { '/work': '/#work' },
  vite: {
    server: { fs: { allow: ['..'] } },
  },
});
