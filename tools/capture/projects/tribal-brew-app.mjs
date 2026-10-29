// Tribal Brew Coffee — the customer ordering app (Expo / React Native,
// github.com/crita-creative-dev/tbc-client-app), captured from its web export.
//
//   cd tbc-client-app && npx expo export --platform web --output-dir web-dist
//   TBC_APP_DIST=<path>/web-dist npm run capture -- tribal-brew-app
//
// The app signs customers in with Google, which a capture cannot do, so the
// session is a fictional demo customer. Data stays read-only: the outlet list,
// menu and item endpoints are answered from production through the POS's read
// session (the same calls the POS itself makes), menu photos load as images, and
// every other API call — orders, payments, rewards, profile writes — is blocked.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const DIST = process.env.TBC_APP_DIST;
const API = 'https://server.crita.in/erp-be-prod/api/';
const READS = /^mobile-api\/(locations|items\/filter|item\/\d+)$/;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.json': 'application/json', '.svg': 'image/svg+xml' };

let auth = null;
function serve(dir) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(dir, p);
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
    if (!fs.existsSync(f)) f = path.join(dir, 'index.html'); // client-side routes
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] ?? 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  server.unref();
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${server.address().port}`)));
}

// Signs into the POS once and keeps the authorisation its own requests carry.
async function readSession(browser, acct, sleep) {
  const page = await browser.newPage();
  page.on('request', (r) => {
    if (!auth && r.url().includes('erp-be-prod') && r.headers().authorization) auth = r.headers().authorization;
  });
  await page.goto('https://server.crita.in/tbc/login', { waitUntil: 'load' });
  await sleep(2500);
  await page.fill('input[type=email]', acct.user);
  await page.fill('input[type=password]', acct.pass);
  await page.click('button:has-text("Sign In")');
  for (let i = 0; i < 30 && !auth; i++) await sleep(1000);
  await page.close();
  if (!auth) throw new Error('POS read session not available');
}

const spec = {
  base: null, // set by setup: the local server for the app build
  folder: 'Tribal Brew Coffee',
  access: 'tribal-brew-coffee',
  login: null,
  context: { geolocation: { latitude: 12.9757, longitude: 77.605 }, permissions: ['geolocation'] },
  waitUntil: 'load',
  settle: 8000,

  async setup({ ctx, page, role, accounts, browser, sleep }) {
    if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Set TBC_APP_DIST to the app\'s web export (see the header of this file).');
    spec.base ??= await serve(DIST);
    if (!auth) await readSession(browser, accounts.admin, sleep);
    if (role === 'customer') {
      await ctx.addInitScript(() => {
        localStorage.setItem('loginData', JSON.stringify({ userName: 'Priya Raman', userEmail: 'priya@example.com', userId: 'demo-customer', userProfileImage: '', userPhone: '9000012345' }));
        localStorage.setItem('store', JSON.stringify({ storeId: 4, name: 'TBC4 Chruch Street', latitude: '12.974783', longitude: '77.605927' }));
      });
    }
    await page.route(/^https:\/\/server\.crita\.in\/(erp-be|mockserver)\//, async (route) => {
      const req = route.request();
      const u = new URL(req.url());
      if (req.method() === 'GET' && u.pathname.startsWith('/erp-be/uploads/')) return route.continue(); // menu photos
      const ep = u.pathname.replace(/^\/(erp-be|mockserver)\/api\//, '');
      if (u.pathname.startsWith('/erp-be/api/') && READS.test(ep)) {
        const r = await fetch(API + ep + u.search, {
          method: req.method(),
          headers: { 'content-type': 'application/json', authorization: auth },
          body: req.method() === 'GET' ? undefined : req.postData(),
        });
        return route.fulfill({ status: r.status, contentType: 'application/json', body: await r.text() });
      }
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"not available during capture"}' });
    });
  },

  // Outlet names as the café writes them, typos tidied; the demo location has
  // no real distance to the first outlet the home screen picks.
  mask: {
    sub: { Chruch: 'Church', Indranagar: 'Indiranagar', Sarajapura: 'Sarjapura' },
    regex: [['\\b\\d{3,}\\.\\d{2}\\b', 'g', '0.4']],
    exact: { 'Show user data': '' }, // a developer label left on the café list
  },

  shots: [
    { id: 'home', role: 'customer', device: 'mobile', path: '/tabs', title: 'Home' },
    { id: 'menu', role: 'customer', device: 'mobile', path: '/tabs/menu', title: 'Menu with live prices' },
    { id: 'help', role: 'customer', device: 'mobile', path: '/help-center', title: 'Help centre' },
    // One outlet's listing photo no longer loads: its broken-image icon is hidden.
    {
      id: 'cafes', role: 'customer', device: 'mobile', path: '/tabs/store',
      steps: [{ eval: () => document.querySelectorAll('img').forEach((i) => { if (i.complete && !i.naturalWidth) i.style.visibility = 'hidden'; }), wait: 500 }],
      title: 'Choose a café',
    },
  ],
};

export default spec;
