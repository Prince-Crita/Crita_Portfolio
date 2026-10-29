// AI Sales CRM — Crita's sales CRM with a Gemini co-pilot, on its public one-click
// demo account. Lead and pipeline data are never edited; generating an AI lead
// summary does refresh that demo lead's "updated" time on the server.
// Deep links 404 on this host, so every screen is reached from the root.

const nav = (href) => [{ click: `a[href="${href}"]:visible`, wait: 5000 }];
const mobileNav = (href) => [{ click: 'button[aria-label="Open menu"]', wait: 1000 }, { click: `a[href="${href}"]:visible`, wait: 5000 }];
const ANALYZE_PIPELINE = [{ click: 'button:has-text("Analyze pipeline")', wait: 22000 }];
const LEAD_AI = (name) => [{ click: `text=${name} >> nth=0`, wait: 3000 }, { click: 'button:has-text("Analyze"):visible', wait: 20000 }];

export default {
  base: 'https://crita-crm.vercel.app',
  folder: 'AI Sales CRM',
  roleFolders: false,
  login: {
    async run(page, _acct, { base, goto, sleep }) {
      await goto(page, base + '/');
      await sleep(4000);
      await page.locator('button:has-text("Try Demo Account")').click();
      await sleep(800);
      await page.locator('button:has-text("Sign in")').click();
    },
    done: (u) => u.pathname === '/',
    timeout: 120000, // the API host sleeps when idle
    settle: 6000,
  },
  waitUntil: 'load',
  settle: 7000,

  mask: {
    sub: { 'Crtia CRM': 'Crita CRM', Karthikeya: 'Arjun' },
    exact: { Suhas: 'Rahul Mehta', Vijay: 'Vivek Rao', Abhirup: 'Ananya Ghosh', Veloce: 'Kestrel Metals', Crita: 'Brightline Co' },
  },

  shots: [
    // ── Desktop ──────────────────────────────────────────────────────
    { id: 'dashboard', role: 'sales', device: 'desktop', path: '/', title: 'Sales dashboard' },
    { id: 'insights', role: 'sales', device: 'desktop', path: '/', steps: ANALYZE_PIPELINE, scroll: 380, title: 'AI pipeline health and insights' },
    { id: 'pipeline', role: 'sales', device: 'desktop', path: '/', steps: nav('/pipeline'), title: 'Pipeline board' },
    { id: 'leads', role: 'sales', device: 'desktop', path: '/', steps: nav('/leads'), title: 'Leads' },
    { id: 'lead-ai', role: 'sales', device: 'desktop', path: '/', steps: [...nav('/leads'), ...LEAD_AI('Nadia Kowalski')], title: 'AI lead summary with next best action' },
    {
      id: 'lead-email', role: 'sales', device: 'desktop', path: '/',
      steps: [...nav('/leads'), { click: 'text=Nadia Kowalski >> nth=0', wait: 3000 }, { click: 'button:has-text("Generate AI email")', wait: 2000 }, { click: 'button:has-text("Generate email")', wait: 20000 }],
      title: 'AI email draft',
    },
    { id: 'follow-ups', role: 'sales', device: 'desktop', path: '/', steps: nav('/tasks'), title: 'Follow-ups' },

    // ── Mobile ───────────────────────────────────────────────────────
    { id: 'dashboard', role: 'sales', device: 'mobile', path: '/', title: 'Dashboard' },
    { id: 'pipeline', role: 'sales', device: 'mobile', path: '/', steps: mobileNav('/pipeline'), title: 'Pipeline' },
    { id: 'leads', role: 'sales', device: 'mobile', path: '/', steps: mobileNav('/leads'), title: 'Leads' },
    {
      id: 'lead-ai', role: 'sales', device: 'mobile', path: '/',
      steps: [
        ...mobileNav('/leads'), ...LEAD_AI('Nadia Kowalski'),
        // The summary opens below the fold of the lead drawer.
        { eval: () => [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')].find((e) => e.children.length === 0 && e.textContent.trim() === 'AI Lead Summary')?.scrollIntoView({ block: 'start' }), wait: 1200 },
      ],
      title: 'AI lead summary',
    },
  ],
};
