// Expense Log — multi-company expense, approval and budget platform (shared
// demo backend with test data). People, emails and junk test values are masked.

// The phone layout opens with the sidebar covering the page; its own toggle hides it.
// Clicked in the page: on Home a loading layer can sit over it for a while.
const CLOSE_SIDEBAR = { eval: () => document.querySelector('button.sidebar-toggle-btn')?.click(), wait: 1500 };

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
    { id: 'home', role: 'admin', device: 'desktop', path: '/home', title: 'Expense summary' },
    { id: 'home-breakdown', role: 'admin', device: 'desktop', path: '/home', scroll: 330, title: 'Spend by category, department and payment mode' },
    { id: 'expenses', role: 'admin', device: 'desktop', path: '/all-expenses', title: 'All expenses tracker' },
    { id: 'budget', role: 'admin', device: 'desktop', path: '/budget', title: 'Department budgets' },
    { id: 'report', role: 'admin', device: 'desktop', path: '/report', title: 'Reports overview' },
    { id: 'users', role: 'admin', device: 'desktop', path: '/user-management', title: 'Users and roles' },
    { id: 'companies', role: 'admin', device: 'desktop', path: '/company-management', title: 'Companies' },

    // ── Manager · desktop ────────────────────────────────────────────
    { id: 'expenses', role: 'manager', device: 'desktop', path: '/all-expenses', title: 'Department expenses with approval status' },
    { id: 'categories', role: 'manager', device: 'desktop', path: '/category-management', title: 'Expense categories' },

    // ── Administrator · mobile ───────────────────────────────────────
    { id: 'home', role: 'admin', device: 'mobile', path: '/home', steps: [CLOSE_SIDEBAR], title: 'Expense summary' },
    { id: 'home-trend', role: 'admin', device: 'mobile', path: '/home', steps: [CLOSE_SIDEBAR, { scroll: 640, wait: 800 }], title: 'Trend and category split' },
    { id: 'expenses', role: 'admin', device: 'mobile', path: '/all-expenses', steps: [CLOSE_SIDEBAR], title: 'Expense tracker' },
    { id: 'report', role: 'admin', device: 'mobile', path: '/report', steps: [CLOSE_SIDEBAR], title: 'Reports' },
  ],
};
