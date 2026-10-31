// Veloce Inventory — Yard OS. The live deployment runs on a test yard, so
// masking tidies test labels, hides admin IP addresses and shows the product
// under its portfolio name (the app still calls itself Scrap Flow).

const RANGE_90 = [
  { click: '.aRangeBtn' },
  { wait: 600 },
  { click: '.aRangePanel button:has-text("Last 90 days")' },
  { wait: 4500 },
];
const tab = (name) => [{ click: `button:text-is("${name}")` }, { wait: 3500 }];
const YARD = '/admin/yards/cmsg0jh6h0000i3b8ud1qlm7r';

export default {
  base: 'https://scrap-flow-veloce-crita.vercel.app',
  login: { path: '/login', user: 'input[type=email]', pass: 'input[type=password]', submit: 'button[type=submit]' },
  // Server-sent events keep the network busy, so wait for load + a settle.
  waitUntil: 'load',
  settle: 5000,

  mask: {
    sub: {
      'Testing Yard Owner': 'Yard Owner',
      'Testing Yard Supervisor': 'Yard Supervisor',
      'Testing Yard 1': 'Bengaluru Yard 1',
      'Test Yard (automated)': 'Mysuru Yard',
      TESTYARD1: 'BLRYD01',
      SFTEST01: 'MYSYD01',
      'testingyard1.in': 'veloceyards.in',
      'testyard1.in': 'veloceyards.in',
      'Dispatch Tester': 'Ramesh K',
      'admin@scrapflow.in': 'admin@veloce.in',
      'scrapflow.in': 'veloce.in',
      'Scrap Flow': 'Veloce Inventory',
      'SCRAP FLOW': 'VELOCE INVENTORY',
      ScrapFlow: 'Veloce Inventory',
    },
    // Whole-cell renames for SKUs a tester typed in lower case or named "demo".
    exact: {
      'Alu demo': 'Alu Sheets',
      ALUDEMO: 'ALUSHT',
      'chips-material': 'Plastic Chips',
      CHIPSMATERIA: 'PLCHIPS',
      'non-ferrous': 'Non-ferrous',
      'iron metal': 'Iron Metal',
      'Mixed iron': 'Mixed Iron',
      iron: 'Iron',
    },
    regex: [['\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b', 'g', '•••.•••.•••.•••']],
  },

  shots: [
    // ── Admin · desktop ──────────────────────────────────────────────
    { id: 'overview', role: 'admin', device: 'desktop', path: '/admin', title: 'Platform overview' },
    { id: 'overview-full', role: 'admin', device: 'desktop', path: '/admin', full: true, title: 'Platform overview (full page)' },
    { id: 'analytics', role: 'admin', device: 'desktop', path: '/admin/analytics', steps: RANGE_90, title: 'Analytics · 90 days' },
    { id: 'analytics-full', role: 'admin', device: 'desktop', path: '/admin/analytics', steps: RANGE_90, full: true, title: 'Analytics · 90 days (full page)' },
    { id: 'analytics-inward', role: 'admin', device: 'desktop', path: '/admin/analytics', steps: [...RANGE_90, ...tab('Inward')], title: 'Inward analytics' },
    { id: 'analytics-dispatch', role: 'admin', device: 'desktop', path: '/admin/analytics', steps: [...RANGE_90, ...tab('Dispatch')], title: 'Dispatch analytics' },
    { id: 'analytics-materials', role: 'admin', device: 'desktop', path: '/admin/analytics', steps: [...RANGE_90, ...tab('Materials')], title: 'Material analytics' },
    { id: 'yard', role: 'admin', device: 'desktop', path: YARD, steps: [{ waitFor: 'text=Warehouse 1' }, { wait: 1500 }], title: 'Yard detail' },
    { id: 'yard-full', role: 'admin', device: 'desktop', path: YARD, steps: [{ waitFor: 'text=Warehouse 1' }, { wait: 1500 }], full: true, title: 'Yard detail (full page)' },
    { id: 'yards', role: 'admin', device: 'desktop', path: '/admin/yards', title: 'Yards' },
    { id: 'users', role: 'admin', device: 'desktop', path: '/admin/users', title: 'Users and roles' },
    { id: 'stock', role: 'admin', device: 'desktop', path: '/admin/stock', title: 'Material master' },
    { id: 'vendors', role: 'admin', device: 'desktop', path: '/admin/vendors', title: 'Vendors' },
    { id: 'audit', role: 'admin', device: 'desktop', path: '/admin/audit', title: 'Audit log' },

    // ── Admin · mobile ───────────────────────────────────────────────
    { id: 'overview', role: 'admin', device: 'mobile', path: '/admin', title: 'Platform overview' },
    { id: 'analytics', role: 'admin', device: 'mobile', path: '/admin/analytics', steps: RANGE_90, title: 'Analytics' },

    // ── Owner · mobile (yard app) ────────────────────────────────────
    { id: 'home', role: 'owner', device: 'mobile', path: '/stock', title: 'Yard dashboard' },
    { id: 'inward', role: 'owner', device: 'mobile', path: '/inward', title: 'Inward weight entry' },
    { id: 'sort', role: 'owner', device: 'mobile', path: '/sort', title: 'Segregation run' },
    { id: 'sell', role: 'owner', device: 'mobile', path: '/sell', title: 'Sell and dispatch status' },
    {
      id: 'inward-keypad', role: 'owner', device: 'mobile', path: '/inward', title: 'LED weight keypad',
      steps: [
        { click: 'button.actCell' }, { wait: 900 },
        // The row label only: each row also carries a "Deactivate" ✕ button.
        { click: '.pickList .pickRow .pickLbl >> nth=0' }, { wait: 900 },
        { click: '.actCell.wt' }, { wait: 900 },
        ...['1', '2', '5', '0'].map((k) => ({ click: `.calcSheet button.key:text-is("${k}")`, wait: 250 })),
        { wait: 600 },
      ],
    },
    {
      id: 'sort-selected', role: 'owner', device: 'mobile', path: '/sort', title: 'Segregation run with a load selected',
      steps: [{ click: '.selectCtlVal' }, { wait: 900 }, { click: '.selectMenu .selectOpt >> nth=0' }, { wait: 2000 }],
    },
    { id: 'home', role: 'owner', device: 'desktop', path: '/stock', title: 'Yard app on desktop' },

    // ── Supervisor · mobile (yard app) ───────────────────────────────
    { id: 'home', role: 'supervisor', device: 'mobile', path: '/stock', title: 'Materials on hand' },
    { id: 'inward', role: 'supervisor', device: 'mobile', path: '/inward', title: 'Inward weight entry' },
    { id: 'outward', role: 'supervisor', device: 'mobile', path: '/outward', title: 'Outward dispatch' },
    { id: 'outward-history', role: 'supervisor', device: 'mobile', path: '/outward/history', title: 'Dispatch history' },
    { id: 'outward-active', role: 'supervisor', device: 'mobile', path: '/outward/active', title: 'Active dispatch' },
  ],
};
