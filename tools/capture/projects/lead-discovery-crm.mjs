// Lead Discovery CRM — Crita's website-connected discovery questionnaires and
// lead CRM (Flutter web, Firebase), shown with Crita's internal test data.
// Flutter draws text on a canvas, so the DOM mask cannot reach it: shots are
// framed to leave out contact details, and the signed-in team member's name and
// email at the foot of the desktop sidebar are painted over.

// The first response in the list, opened from its row.
const OPEN_RESPONSE = [{ tap: 'Crita Creative', prefix: true, wait: 6000 }];

export default {
  base: 'https://critacreativellp-dev.web.app',
  folder: 'Lead Discovery CRM',
  publicRoles: ['prospect'],
  login: {
    async run(page, acct, { base, goto, sleep, tap }) {
      await goto(page, base + '/login');
      // The Flutter engine can take a while to boot: retry until the form is there.
      for (let i = 0; i < 12; i++) {
        await sleep(4000);
        try {
          await tap(page, 'Email');
          break;
        } catch (e) {
          if (i === 11) throw e;
        }
      }
      await sleep(400);
      await page.keyboard.type(acct.user, { delay: 30 });
      await tap(page, 'Password');
      await sleep(400);
      await page.keyboard.type(acct.pass, { delay: 30 });
      await tap(page, 'Sign In');
    },
    done: (u) => u.pathname === '/dashboard',
    settle: 8000,
  },
  waitUntil: 'load',
  settle: 12000,

  redact: {
    // Sidebar footer: avatar, name and email of the signed-in user (CSS px).
    desktop: [[0, 830, 240, 70, '#ffffff']],
  },

  shots: [
    // ── Admin · desktop ──────────────────────────────────────────────
    { id: 'dashboard', role: 'admin', device: 'desktop', path: '/dashboard', title: 'Lead dashboard' },
    { id: 'responses', role: 'admin', device: 'desktop', path: '/responses', title: 'Questionnaire responses' },
    // Scrolled until the contact card (name, email, phone) has left the frame.
    { id: 'insight', role: 'admin', device: 'desktop', path: '/responses', steps: [...OPEN_RESPONSE, { wheel: [900, 500, 330], wait: 1500 }], redact: [[906, 113, 128, 38, '#ffffff'], [560, 38, 440, 20, '#ffffff']], title: 'Response with campaign insight and fit score' },
    { id: 'templates', role: 'admin', device: 'desktop', path: '/templates', title: 'Discovery questionnaire templates' },

    // ── Prospect (public questionnaire) ─────────────────────────────
    { id: 'questionnaire', role: 'prospect', device: 'desktop', path: '/discover/inventory-mgmt', title: 'Public discovery questionnaire' },
    { id: 'questionnaire', role: 'prospect', device: 'mobile', path: '/discover/inventory-mgmt', title: 'Discovery questionnaire on a phone' },

    // ── Admin · mobile ───────────────────────────────────────────────
    { id: 'dashboard', role: 'admin', device: 'mobile', path: '/dashboard', title: 'Lead dashboard' },
    { id: 'responses', role: 'admin', device: 'mobile', path: '/responses', title: 'Responses by questionnaire' },
    // On a touch screen the wheel does not scroll Flutter: the contact line and
    // phone chip of the response card are painted over instead.
    { id: 'insight', role: 'admin', device: 'mobile', path: '/responses', steps: OPEN_RESPONSE, redact: [[108, 125, 218, 25, '#ffffff'], [180, 279, 140, 40, '#ffffff']], title: 'Campaign insight' },
  ],
};
