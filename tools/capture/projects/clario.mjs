// Clario — Crita's business-intelligence platform. The live workspace reads a
// seeded test Zoho Books organisation, so screens are presented as a sample
// company ("Meridian Supplies") and captioned as sample data in the portfolio.

const W = '/w/crita-creative-llp-dev';
const F = `${W}/zoho-books/finance`;

// Opens an existing conversation from History. Scoped to the history list so it
// can never hit a suggestion chip (which would send a new question) or a row's
// "Delete" button.
const HISTORY = 'button:has-text("History"), button[aria-label*="istory" i]';
const openConversation = (title) => [
  { click: HISTORY },
  { wait: 1500 },
  { click: `nav[aria-label="Your conversations"] li button:not([aria-label^="Delete"]):has-text("${title}")` },
  { wait: 4000 },
];

export default {
  base: 'https://clariocrita.vercel.app',
  login: { path: '/login?next=%2F', user: 'input[name=email]', pass: 'input[name=password]', submit: 'button[type=submit]' },
  settle: 4500,

  mask: {
    sub: {
      'Crita Creative LLP Dev': 'Meridian Supplies',
      'Crita Creative LLP': 'Meridian Supplies',
      'TEST Customer Alpha': 'Arcadia Retail',
      'TEST Customer Beta': 'Bluestone Foods',
      'TEST Customer Gamma': 'Greenleaf Pharma',
      'TEST Bank Current': 'Current Account',
      'prince@crita.in': 'priya@meridiansupplies.in',
      Prince: 'Priya',
    },
  },

  shots: [
    // ── Owner · desktop ──────────────────────────────────────────────
    { id: 'workspace', role: 'owner', device: 'desktop', path: W, title: 'Workspace and connected systems' },
    { id: 'overview', role: 'owner', device: 'desktop', path: `${F}/overview`, title: 'Finance overview' },
    { id: 'overview-full', role: 'owner', device: 'desktop', path: `${F}/overview`, full: true, title: 'Finance overview (full page)' },
    { id: 'overview-decisions', role: 'owner', device: 'desktop', path: `${F}/overview`, scroll: 820, title: 'Decision support and scenarios' },
    { id: 'ask', role: 'owner', device: 'desktop', path: `${F}/clario`, title: 'Ask Clario' },
    { id: 'ask-full', role: 'owner', device: 'desktop', path: `${F}/clario`, full: true, title: 'Ask Clario (full page)' },
    { id: 'ask-history', role: 'owner', device: 'desktop', path: `${F}/clario`, steps: [{ click: HISTORY }, { wait: 2000 }], title: 'Conversation history' },
    { id: 'ask-owes', role: 'owner', device: 'desktop', path: `${F}/clario`, steps: openConversation('Who owes us the most?'), title: 'Answer: who owes us the most' },
    { id: 'ask-profit', role: 'owner', device: 'desktop', path: `${F}/clario`, steps: openConversation('What is affecting our profit?'), title: 'Answer: what is affecting profit' },
    { id: 'ask-year', role: 'owner', device: 'desktop', path: `${F}/clario`, steps: openConversation('How are we doing this financial year?'), title: 'Answer: how is the year going' },
    { id: 'trends', role: 'owner', device: 'desktop', path: `${F}/trends`, title: 'Trends and analysis' },
    { id: 'trends-full', role: 'owner', device: 'desktop', path: `${F}/trends`, full: true, title: 'Trends and analysis (full page)' },
    { id: 'receivables', role: 'owner', device: 'desktop', path: `${F}/receivables`, title: 'Receivables' },
    { id: 'receivables-full', role: 'owner', device: 'desktop', path: `${F}/receivables`, full: true, title: 'Receivables (full page)' },
    { id: 'balance-sheet', role: 'owner', device: 'desktop', path: `${F}/balance-sheet`, title: 'Balance sheet' },
    { id: 'payables', role: 'owner', device: 'desktop', path: `${F}/payables`, title: 'Payables' },

    // ── Owner · mobile ───────────────────────────────────────────────
    { id: 'overview', role: 'owner', device: 'mobile', path: `${F}/overview`, title: 'Finance overview' },
    { id: 'overview-performance', role: 'owner', device: 'mobile', path: `${F}/overview`, scroll: 1500, title: 'Business performance' },
    { id: 'ask', role: 'owner', device: 'mobile', path: `${F}/clario`, title: 'Ask Clario' },
    { id: 'ask-owes', role: 'owner', device: 'mobile', path: `${F}/clario`, steps: openConversation('Who owes us the most?'), title: 'Answer on mobile' },
    { id: 'receivables', role: 'owner', device: 'mobile', path: `${F}/receivables`, title: 'Receivables' },
    { id: 'trends', role: 'owner', device: 'mobile', path: `${F}/trends`, title: 'Trends' },
    { id: 'workspace', role: 'owner', device: 'mobile', path: W, title: 'Workspace' },
  ],
};
