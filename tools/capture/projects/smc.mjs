// SMC Task Management — Shaabi Management Consultancy (live production system).
// Every client, contact and staff name is masked: the screens show real usage,
// never real identities.
import { personAllocator, companyAllocator, twoLetterInitials, codeFor, phoneFor } from '../names.mjs';

// Scoped to <main>: the sidebar's collapse toggle uses the same icon.
const PREV_WEEK = 'main button:visible:has(svg.lucide-chevron-left)';
const SURNAMES = ['Raman', 'Krishnan', 'Natarajan', 'Menon', 'Iyer', 'Pillai'];

// Fictional client names keyed by the UI's two-letter avatar initials, so every
// avatar still matches its name. Entries are used in the order of the original
// names sorted alphabetically, which keeps sister entities visibly related.
const BY_INITIALS = {
  AC: ['Acorn Textiles'], AL: ['Alder Dyeing', 'Alder Exports'], AO: ['AO Textile Processing'],
  AR: ['Arbor Common Effluent Treatment Plant'], BA: ['Banyan Apparels'], BO: ['Bodhi Exports'],
  BR: ['BRK Elastic'], BT: ['BTL International'], CB: ['CBN Fashion LLP'],
  CL: ['Cloverleaf Exports', 'Cloverleaf Exports - 2nd visit'], CO: ['Coastline Fashions'],
  CR: ['Crestline Garments'], EN: ['Endeavour Exports'], EU: ['Eureka International'],
  FA: ['Fabrique Creations'], FI: ['Firefly Exports'], FR: ['Freshweave Knitwear'], JN: ['JNR Apparel'],
  JU: ['Jupiter Processing Mills'], KA: ['Kaveri Knitwear'], KN: ['Knotwork Gallery', 'Knotwell Garments'],
  KU: ['Kuvera Fashions'], LA: ['Lantern Sweets'], MU: ['Mustang Carriers', 'Mustang Carriers (South)'],
  NE: ['Neoline Exports'], NR: ['NRV Exports'], NT: ['NTK Apparels Private Limited'], PA: ['Panorama Dyeing'],
  RE: ['Regal Fashions', 'Redwood Process'], RH: ['Rhapsody Knit India', 'Rhapsody Knit India (Unit 2)'],
  RK: ['RKM Exports'], SD: ['SDK & Sons'], SR: ['Sripada Goods Carrier'], SU: ['Summit Impex'],
  SV: ['SVK Printing', 'SVR Knits'], SW: ['Swanmark International'], TE: ['Tejas Textiles'],
  TO: ['Topaz Knitwear'], UD: ['UDN Exports'], UP: ['Upland Apparel', 'Upland Apparels'],
  VR: ['VRS Fashion'], WE: ['Westwind Knit Fashion'],
};

const list = (d) => (Array.isArray(d) ? d : Object.values(d).find(Array.isArray) ?? []);

export default {
  base: 'https://smc-crita.vercel.app',
  login: { path: '/login', user: '#identifier', pass: '#password', submit: '#login-btn' },
  settle: 2500,

  async buildMask({ withRole, getJSON }) {
    const [clients, execs] = await withRole('admin', async (page) => [
      list(await getJSON(page, '/api/admin/clients?includeArchived=true')),
      list(await getJSON(page, '/api/admin/executives')),
    ]);

    const sub = {};
    const exact = {};
    // 'Sangeetha' is reserved for the admin user below.
    const people = personAllocator(['Sangeetha', ...execs.map((e) => e.name), ...clients.map((c) => c.contactPerson || '')]);
    const companies = companyAllocator();
    const codes = new Set();
    let phoneIndex = 0;
    const phones = new Map();
    const phone = (p) => {
      if (!p) return;
      const digits = String(p).replace(/\D/g, '').slice(-10);
      if (digits.length < 10 || phones.has(digits)) return;
      phones.set(digits, phoneFor(phoneIndex++));
      sub[digits] = phones.get(digits);
    };

    // Staff — keep the first letter so avatar initials still match.
    for (const e of execs) {
      const parts = e.name.trim().split(/\s+/);
      const first = people(parts[0]);
      sub[parts[0]] = first;
      const cap = parts[0][0].toUpperCase() + parts[0].slice(1);
      sub[cap] = first;
      if (parts.length > 1) {
        const full = `${first} ${SURNAMES[parts.length % SURNAMES.length]}`;
        sub[e.name.trim()] = full;
        sub[parts.slice(1).join(' ')] = full.split(' ').slice(1).join(' ');
      }
      phone(e.phone);
    }
    sub.selvi = 'Sangeetha';
    sub.Selvi = 'Sangeetha';

    // Clients — names, codes, contacts, phones and emails.
    const usedByInitials = {};
    const sorted = [...clients].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const c of sorted) {
      const ini = twoLetterInitials(c.name);
      const n = (usedByInitials[ini] = (usedByInitials[ini] ?? -1) + 1);
      const fake = BY_INITIALS[ini]?.[n] ?? companies(c.name);
      sub[c.name.trim()] = fake;
      if (c.name.trim() !== c.name.trim().replace(/\s+/g, ' ')) sub[c.name.trim().replace(/\s+/g, ' ')] = fake;
      if (c.code) {
        const digits = (c.code.match(/[\d-]+$/) || ['001'])[0];
        sub[c.code] = codeFor(fake, digits, codes);
      }
      if (!BY_INITIALS[ini]?.[n]) exact[ini] = twoLetterInitials(fake);
      if (c.contactPerson && c.contactPerson.trim()) {
        const raw = c.contactPerson.trim();
        const m = raw.match(/^((?:Mr|Mrs|Ms|Dr)\.?\s*)(.+)$/i);
        const honorific = m ? m[1].replace(/\.?\s*$/, '. ') : '';
        const name = m ? m[2] : raw;
        if (!sub[raw]) sub[raw] = `${honorific}${people(name)}`;
      }
      phone(c.phone);
      if (c.email) sub[c.email] = `accounts@${fake.toLowerCase().replace(/[^a-z]+/g, '')}.in`;
      for (const r of c.reportEmails ?? []) {
        const addr = typeof r === 'string' ? r : r?.email;
        if (addr && !sub[addr]) sub[addr] = `reports@${fake.toLowerCase().replace(/[^a-z]+/g, '')}.in`;
      }
    }
    // A contact name written into a subtask title, and a data-entry typo.
    sub['Verification - John'] = 'Verification - Joel';
    sub['WEEKLY REVIW'] = 'WEEKLY REVIEW';

    return { sub, exact };
  },

  shots: [
    // ── Admin · desktop ──────────────────────────────────────────────
    { id: 'dashboard', role: 'admin', device: 'desktop', path: '/admin', title: 'Admin dashboard' },
    { id: 'dashboard-full', role: 'admin', device: 'desktop', path: '/admin', full: true, title: 'Admin dashboard (full page)' },
    { id: 'dashboard-analytics', role: 'admin', device: 'desktop', path: '/admin', scroll: 440, title: 'Staff performance and task distribution' },
    { id: 'visits', role: 'admin', device: 'desktop', path: '/admin/visits', title: 'All visits' },
    { id: 'carry-forward', role: 'admin', device: 'desktop', path: '/admin/carry-forward', title: 'Carry-forward approvals' },
    { id: 'calendar-w33', role: 'admin', device: 'desktop', path: '/admin/calendar', steps: [{ clickAll: [PREV_WEEK, 11, 900] }, { wait: 2500 }], title: 'Visit calendar' },
    { id: 'calendar-w34', role: 'admin', device: 'desktop', path: '/admin/calendar', steps: [{ clickAll: [PREV_WEEK, 10, 900] }, { wait: 2500 }], title: 'Visit calendar' },
    { id: 'calendar-w35', role: 'admin', device: 'desktop', path: '/admin/calendar', steps: [{ clickAll: [PREV_WEEK, 9, 900] }, { wait: 2500 }], title: 'Visit calendar' },
    { id: 'task-config', role: 'admin', device: 'desktop', path: '/admin/task-config', title: 'Client-specific checklists' },
    { id: 'executives', role: 'admin', device: 'desktop', path: '/admin/executives', title: 'Executive workload' },
    { id: 'clients', role: 'admin', device: 'desktop', path: '/admin/clients', title: 'Clients' },
    { id: 'visit-detail', role: 'admin', device: 'desktop', path: '/admin/visits/cmt06q3in000c04l29gsci9ys', title: 'Visit detail (admin)' },

    // ── Admin · mobile ───────────────────────────────────────────────
    { id: 'dashboard', role: 'admin', device: 'mobile', path: '/admin', title: 'Admin dashboard' },
    { id: 'dashboard-charts', role: 'admin', device: 'mobile', path: '/admin', scroll: 900, title: 'Admin dashboard charts' },
    { id: 'visits', role: 'admin', device: 'mobile', path: '/admin/visits', title: 'All visits' },
    { id: 'carry-forward', role: 'admin', device: 'mobile', path: '/admin/carry-forward', title: 'Carry-forward approvals' },
    { id: 'calendar', role: 'admin', device: 'mobile', path: '/admin/calendar', steps: [{ clickAll: [PREV_WEEK, 10, 900] }, { wait: 2500 }], title: 'Visit calendar' },

    // ── Executive · desktop ──────────────────────────────────────────
    { id: 'dashboard', role: 'executive', device: 'desktop', path: '/executive', title: 'Executive dashboard' },
    { id: 'visits', role: 'executive', device: 'desktop', path: '/executive/visits', title: 'My visits' },
    { id: 'visit-closed', role: 'executive', device: 'desktop', path: '/executive/visits/cmt06q3in000c04l29gsci9ys', title: 'Completed visit with activity trail' },
    { id: 'visit-closed-full', role: 'executive', device: 'desktop', path: '/executive/visits/cmt06q3in000c04l29gsci9ys', full: true, title: 'Completed visit (full page)' },
    { id: 'visit-team', role: 'executive', device: 'desktop', path: '/executive/visits/cmt1fyvld000104l2yb2c8vd5', title: 'Team visit, ready to open' },
    { id: 'visit-partial', role: 'executive', device: 'desktop', path: '/executive/visits/cmsmwhs6v005r04i9elhmgmeh', title: 'Visit with reasons for incomplete items' },
    { id: 'visit-summary', role: 'executive', device: 'desktop', path: '/executive/visits/cmt06q3in000c04l29gsci9ys', steps: [{ click: 'button:has-text("View Summary")' }, { wait: 1500 }], title: 'Auto-generated visit summary' },
    { id: 'calendar', role: 'executive', device: 'desktop', path: '/executive/calendar', steps: [{ clickAll: [PREV_WEEK, 10, 900] }, { wait: 2500 }], title: 'My calendar' },

    // ── Executive · mobile ───────────────────────────────────────────
    { id: 'dashboard', role: 'executive', device: 'mobile', path: '/executive', title: 'Executive dashboard' },
    { id: 'visits', role: 'executive', device: 'mobile', path: '/executive/visits', title: 'My visits' },
    { id: 'visit-closed', role: 'executive', device: 'mobile', path: '/executive/visits/cmt06q3in000c04l29gsci9ys', title: 'Completed visit' },
    { id: 'visit-partial', role: 'executive', device: 'mobile', path: '/executive/visits/cmsmwhs6v005r04i9elhmgmeh', title: 'Visit progress' },
    { id: 'visit-partial-tasks', role: 'executive', device: 'mobile', path: '/executive/visits/cmsmwhs6v005r04i9elhmgmeh', scroll: 980, title: 'MD meeting and reasons' },
    { id: 'visit-summary', role: 'executive', device: 'mobile', path: '/executive/visits/cmt06q3in000c04l29gsci9ys', steps: [{ click: 'button:has-text("View Summary")' }, { wait: 1500 }], title: 'Visit summary' },
    { id: 'attendance', role: 'executive', device: 'mobile', path: '/executive/leave', title: 'Attendance and leave' },
    { id: 'calendar', role: 'executive', device: 'mobile', path: '/executive/calendar', steps: [{ clickAll: [PREV_WEEK, 10, 900] }, { wait: 2500 }], title: 'My calendar' },
  ],
};
