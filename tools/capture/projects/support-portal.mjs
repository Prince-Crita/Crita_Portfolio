// Support Portal — Crita's ticketing and support desk (development instance).
// Requester and administrator views. People, emails, a client's name in a ticket
// and an application address quoted in a reply are masked.

const B = '/support-ticket/dev/';
const TICKET = 'SUPPORT-392484';

export default {
  base: 'https://server.crita.in',
  folder: 'Support Portal',
  publicRoles: ['public'],
  login: {
    path: B,
    // The header's "Sign in" collapses into a menu on phones; this button shows at every size.
    open: 'button:has-text("Submit a ticket"):visible',
    user: '#email',
    pass: '#password',
    submit: 'form button:has-text("Sign in")',
    done: (u) => u.hash.startsWith('#/portal'),
  },
  waitUntil: 'load',
  settle: 3500,

  mask: {
    sub: {
      'https://server.crita.in/veloce-exchange/#/app/register-user': 'the admin console',
      'munna.saha@veloce.exchange': 'rohan.das@northwind.in',
      'portal.ux.check.1791278000@example.com': 'kavya@northwind.in',
      'asvijayavitthala@crita.in': 'aditi@crita.in',
      'development@crita.in': 'support@crita.in',
      'rashmitha@crita.in': 'revathi@crita.in',
      'suhasks@crita.in': 'sanjay@crita.in',
      'abishek@crita.in': 'arjun@crita.in',
      'prince@crita.in': 'priya@northwind.in',
      'Veloce Executive Login Issue': 'Field executive login issue',
      'For Veloce executives': 'For field executives',
      'veloce executives': 'field executives',
      'upload the documents of you r company': 'Please upload your company documents',
      'Munna Saha': 'Rohan Das',
      'Portal Requester': 'Kavya Nair',
      'Rashmitha J': 'Revathi J',
      'Suhas K S': 'Sanjay K',
      'Abishek M': 'Arjun M',
      'Prince M': 'Priya Raman',
      'Veloce Executive.jpeg': 'login-screen.jpeg',
    },
    exact: { asv: 'Aditi Sen', testing: 'Invoice download fails on mobile' },
  },

  shots: [
    // ── Public · desktop ─────────────────────────────────────────────
    { id: 'help-centre', role: 'public', device: 'desktop', path: B, title: 'Support portal home' },
    { id: 'knowledge-base', role: 'public', device: 'desktop', path: `${B}#/knowledge-base`, title: 'Knowledge base' },

    // ── Requester · desktop ──────────────────────────────────────────
    { id: 'raise-ticket', role: 'requester', device: 'desktop', path: `${B}#/portal/tickets/new`, title: 'Raise a ticket' },

    // ── Administrator · desktop ──────────────────────────────────────
    { id: 'queue', role: 'admin', device: 'desktop', path: `${B}#/portal/tickets`, title: 'Admin queue' },
    { id: 'ticket', role: 'admin', device: 'desktop', path: `${B}#/portal/tickets/${TICKET}`, title: 'Ticket with conversation and workflow' },
    { id: 'history', role: 'admin', device: 'desktop', path: `${B}#/portal/history`, title: 'Status history' },
    { id: 'types', role: 'admin', device: 'desktop', path: `${B}#/portal/support-ticket-types`, title: 'Ticket types and approval rules' },

    // ── Mobile ───────────────────────────────────────────────────────
    { id: 'help-centre', role: 'public', device: 'mobile', path: B, title: 'Support portal home' },
    { id: 'raise-ticket', role: 'requester', device: 'mobile', path: `${B}#/portal/tickets/new`, title: 'Raise a ticket' },
    { id: 'queue', role: 'admin', device: 'mobile', path: `${B}#/portal/tickets`, title: 'Admin queue' },
    { id: 'ticket', role: 'admin', device: 'mobile', path: `${B}#/portal/tickets/${TICKET}`, title: 'Ticket on mobile' },
  ],
};
