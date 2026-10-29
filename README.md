# Crita Portfolio 2026

One content file, three outputs: a website, a PowerPoint deck and a PDF portfolio.

## Outputs

| Output | File |
| --- | --- |
| PDF portfolio (A4 landscape, 32 pages) | `pdf/Crita-Portfolio-2026.pdf` (the website serves the same file at `/Crita-Portfolio-2026.pdf`) |
| PowerPoint deck (37 slides, speaker notes), safe to send | `ppt/Crita-Portfolio-2026.pptx` |
| Presenter copy: same slides, demo logins in the notes. Never send it. | `ppt/presenter/Crita-Portfolio-2026-Presenter.pptx` |
| Deck as PDF, a backup for presenting | `ppt/Crita-Portfolio-2026-Slides.pdf` |
| Website build | `web/dist/` |

## Run the website

Requires Node 22.

```bash
npm install
npm run dev        # http://localhost:4321
```

## Build and deploy the website

```bash
npm run build:web  # static site in web/dist
npm run preview    # check the build locally
```

Any static host works. Point it at this folder: if the repository starts one level up, set the host's root (base) directory to `portfolio`.

- Vercel and Netlify: settings come from `vercel.json` / `netlify.toml`.
- Cloudflare Pages: build command `npm run build:web`, output directory `web/dist`, environment variable `NODE_VERSION=22`.
- Optional: set `SITE_URL` to the site's address (for example `https://work.crita.in`) to add canonical and social-share links.

The PDF is already in `web/public`, so the host does not need Chrome.

## Rebuild the PDF and deck

Uses the installed Google Chrome. If Chrome is not in its default Windows location, set `CHROME_PATH`.

```bash
npm run build             # website, PDF, deck, then the demo-login leak check
npm run build:slides-pdf  # deck as PDF (Windows with PowerPoint only)
```

The deck uses the Satoshi font. Install it from `assets/fonts/Satoshi/ttf` on the presenting computer, or present from the slides PDF.

## Where things are

- `content/portfolio.json`: all copy for every output. Edit it, then rebuild.
- `screenshots/<project>/<role>-<device>/`: original screen captures (PNG, client data anonymised). `screenshots/<project>/manifest.json` lists each screen's title and source page.
- `assets/media/`: the same screens as high-quality JPEGs.
- `assets/brand/`: logo, C mark and pattern. `assets/brand/patterns/` holds the brand patterns.
- `assets/fonts/Satoshi/`: font files and licence.

## Demo logins and screenshots

`content/demo-access.json` holds the demo logins. It is private and git-ignored (template: `demo-access.example.json`), and so is `ppt/presenter/`. Only the screenshot tool and the presenter copy of the deck use it. City Threads is the only project whose demo logins are public, in `portfolio.json` under `demo.public`. `npm run check` fails if a private login appears in the website, the PDFs or the main deck.

To recapture screens (read-only: the tool only opens pages, tabs and filters):

```bash
npm run capture -- veloce                          # smc | veloce | clario | city-threads
npm run capture -- smc --role=admin --device=mobile --only=dashboard
npm run build
```
