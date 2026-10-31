// Expense Log — multi-company expense, approval and budget platform (shared
// demo backend with test data). People, emails and junk test values are masked.

// The phone layout opens with the sidebar covering the page; its own toggle hides it.
// Clicked in the page: on Home a loading layer can sit over it for a while.
const CLOSE_SIDEBAR = { eval: () => document.querySelector('button.sidebar-toggle-btn')?.click(), wait: 1500 };
// Home's summary loads from a server that sleeps when idle.
const SUMMARY_READY = { waitFor: 'text=Expense Trend', wait: 1500 };

// The app's own phone layout squeezes desktop components (a wrapping clock, a
// 1,300px table, cards running off the screen). For the portfolio, its own
// components are laid out for a phone in the browser — display only, nothing
// is sent to the app: one-line greeting, two-column figures, expense rows as
// cards with the same fields, the two main filters, stacked report cards.
function TIDY_PHONE() {
  const css = `
    .center-header-widget .header-divider, .center-header-widget .header-clock { display: none !important; }
    .center-header-widget { flex: 1 1 auto !important; min-width: 0 !important; display: flex !important; align-items: center !important; }
    .greeting-text { white-space: nowrap !important; font-size: 17px !important; }
    .dashboard-body-content { box-sizing: border-box !important; max-width: 100% !important; }
    .expenses-page-wrapper { padding: 16px !important; box-sizing: border-box !important; }
    .bento-grid { width: 100% !important; gap: 14px !important; }
    .bento-tile.dashboard-body-content { display: flex !important; flex-direction: column !important; align-items: stretch !important; gap: 14px !important; width: auto !important; }
    .bento-tile.dashboard-body-content h2 { white-space: nowrap !important; font-size: 26px !important; margin: 0 !important; }
    .dashboard-header-actions { width: 100% !important; flex-wrap: wrap !important; justify-content: flex-start !important; gap: 8px !important; }
    .filter-panel-bar { flex-wrap: wrap !important; }
    .filter-panel-bar button { display: none !important; }
    .filter-panel-bar > * { flex: 1 1 140px !important; min-width: 0 !important; }
    .filter-panel-bar select, .filter-panel-bar input { width: 100% !important; max-width: 100% !important; min-width: 0 !important; box-sizing: border-box !important; }
    .expenses-list-container { width: auto !important; overflow: visible !important; margin: 14px 0 0 !important; padding: 0 !important; background: none !important; box-shadow: none !important; border: 0 !important; }
    .expenses-data-table { display: block !important; width: 100% !important; min-width: 0 !important; }
    .expenses-data-table thead { display: none !important; }
    .expenses-data-table tbody { display: grid !important; gap: 10px !important; }
    .expenses-data-table tr { display: grid !important; grid-template-columns: 1fr auto; gap: 6px 12px; padding: 14px 16px !important; border-radius: 14px; background: #fffef9; box-shadow: 0 0 0 1px rgba(23, 51, 38, 0.1); }
    .expenses-data-table td { display: block !important; padding: 0 !important; border: 0 !important; text-align: left !important; white-space: normal !important; }
    .expenses-data-table td:nth-child(1), .expenses-data-table td:nth-child(3), .expenses-data-table td:nth-child(4),
    .expenses-data-table td:nth-child(5), .expenses-data-table td:nth-child(8), .expenses-data-table td:nth-child(n+12) { display: none !important; }
    .expenses-data-table td:nth-child(6) { grid-area: 1 / 1; font-weight: 700 !important; font-size: 15px !important; }
    .expenses-data-table td:nth-child(9) { grid-area: 1 / 2; font-weight: 700 !important; text-align: right !important; }
    .expenses-data-table td:nth-child(9)::before { content: '₹'; }
    .expenses-data-table td:nth-child(7) { grid-area: 2 / 1; }
    .expenses-data-table td:nth-child(11) { grid-area: 2 / 2; justify-self: end; }
    .expenses-data-table td:nth-child(2) { grid-area: 3 / 1; color: #5c6a62; font-size: 13px !important; }
    .expenses-data-table td:nth-child(10) { grid-area: 3 / 2; color: #5c6a62; font-size: 13px !important; text-align: right !important; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  // Groups of figures or cards, found by the text of their first item.
  const group = (first) =>
    [...document.querySelectorAll('div')].find((d) => d.children.length > 2 && (d.children[0].textContent || '').trim().toLowerCase().startsWith(first));
  const grid = (el, cols) => {
    if (!el) return;
    Object.assign(el.style, { display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '10px', width: '100%', overflow: 'visible', flexWrap: 'nowrap' });
    [...el.children].forEach((c) => Object.assign(c.style, { width: 'auto', minWidth: '0', maxWidth: 'none', margin: '0', flex: 'none' }));
  };
  grid(group('this month'), 2);
  grid(group('total expenses'), 2);
  grid(group('expense summary'), 1);
  // Filters: keep search and category.
  for (const label of ['specific date', 'min price', 'max price']) {
    const l = [...document.querySelectorAll('label, span, p, div')].find((e) => e.children.length === 0 && e.textContent.trim().toLowerCase() === label);
    if (l?.parentElement) l.parentElement.style.display = 'none';
  }
}
const PHONE = [CLOSE_SIDEBAR, { eval: TIDY_PHONE, wait: 800 }];

export default {
  base: 'https://expense-logger-one.vercel.app',
  folder: 'Expense Log',
  login: {
    path: '/login',
    user: 'input[type=email]',
    pass: 'input[type=password]',
    submit: 'button:has-text("Login")',
    done: (u) => u.pathname === '/home',
    timeout: 120000, // the API host sleeps when idle
  },
  waitUntil: 'load',
  settle: 6000,

  mask: {
    sub: {
      'rashmijag2005@gmail.com': 'ramya@company.in',
      'rashmitha@crita.in': 'revathi@company.in',
      'aheesha@crita.in': 'anitha@company.in',
      'manager@gmail.com': 'meera@company.in',
      'suhas@crita.in': 'sanjay@company.in',
      'rash@gmail.com': 'rohan@company.in',
      'virat@gmail.com': 'vikram@company.in',
      'abc@email.com': 'arun@company.in',
      'crita.creative@gmail.com': 'accounts@crita.in',
      Admin01: 'Arun',
      'Rashmitha J': 'Revathi J',
      Rashmi: 'Ramya',
      Aheesha: 'Anitha',
      Suhas: 'Sanjay',
      Virat: 'Vikram',
      Engineeing: 'Engineering',
      AccOU: 'Operations',
      'abc tech': 'Northwind Tech',
      'www.abc.in': 'northwindtech.in',
    },
    // Whole-cell values only ("manager" stays: it is also the role badge's text).
    exact: {
      Rash: 'Rohan',
      abc: 'Arun',
      food: 'Client lunch',
      place: 'Site visit',
      taxi: 'Airport drop',
      'team lunch': 'Team lunch',
      'food food': 'Team dinner',
      'foodd food food': 'Team dinner with client',
      'client meet': 'Client meeting',
    },
  },

  shots: [
    // ── Administrator · desktop ──────────────────────────────────────
    { id: 'home', role: 'admin', device: 'desktop', path: '/home', steps: [SUMMARY_READY], title: 'Expense summary' },
    { id: 'home-breakdown', role: 'admin', device: 'desktop', path: '/home', steps: [SUMMARY_READY], scroll: 330, title: 'Spend by category, department and payment mode' },
    { id: 'expenses', role: 'admin', device: 'desktop', path: '/all-expenses', title: 'All expenses tracker' },
    { id: 'budget', role: 'admin', device: 'desktop', path: '/budget', title: 'Department budgets' },
    { id: 'report', role: 'admin', device: 'desktop', path: '/report', title: 'Reports overview' },
    { id: 'users', role: 'admin', device: 'desktop', path: '/user-management', title: 'Users and roles' },
    { id: 'companies', role: 'admin', device: 'desktop', path: '/company-management', title: 'Companies' },

    // ── Manager · desktop ────────────────────────────────────────────
    { id: 'expenses', role: 'manager', device: 'desktop', path: '/all-expenses', title: 'Department expenses with approval status' },
    { id: 'categories', role: 'manager', device: 'desktop', path: '/category-management', title: 'Expense categories' },

    // ── Administrator · mobile ───────────────────────────────────────
    { id: 'home', role: 'admin', device: 'mobile', path: '/home', steps: [SUMMARY_READY, ...PHONE], title: 'Expense summary' },
    { id: 'home-trend', role: 'admin', device: 'mobile', path: '/home', steps: [SUMMARY_READY, ...PHONE], scroll: 630, title: 'Spend by category, department and payment mode' },
    { id: 'expenses', role: 'admin', device: 'mobile', path: '/all-expenses', steps: PHONE, title: 'Expense tracker' },
    { id: 'report', role: 'admin', device: 'mobile', path: '/report', steps: PHONE, title: 'Reports' },
  ],
};
