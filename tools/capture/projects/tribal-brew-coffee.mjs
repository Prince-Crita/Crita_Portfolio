// Tribal Brew Coffee — POS and back office of a working café chain (live
// production system). View only: the cart below is on-screen state that is never
// confirmed, held, discounted or discarded, and no bill is ever changed.
// The customer mobile app is captured separately (tribal-brew-app.mjs).

const P = '/tbc';
const OUTLET = 'TBC4 Chruch Street';
const toOutlet = [{ select: ['select', OUTLET] }, { wait: 4000 }];
const opt = (label) => ({ click: `text="${label}"`, wait: 500 });
const NEW_ORDER = [...toOutlet, { click: 'button:has-text("New Order")', wait: 6000 }];
const CART = [
  ...NEW_ORDER,
  { click: 'text=Caramel Crème Brûlée Hot', wait: 1800 }, opt('Oat Milk'), opt('Surya Beans'), opt('Jaggery'),
  { click: 'button:has-text("Add to Order")', wait: 1500 },
  { click: 'text=Cappuccino', wait: 1800 }, opt('Almond Milk'), opt('Rudra Beans'), opt('Regular'),
  { click: 'button:has-text("Add to Order")', wait: 1500 },
  { click: 'text=Quinoa Paneer Bowl', wait: 1800 }, opt('Peri peri sauce'),
  { click: 'button:has-text("Add to Order")', wait: 1500 },
];

export default {
  base: 'https://server.crita.in',
  folder: 'Tribal Brew Coffee',
  login: {
    path: `${P}/login`,
    user: 'input[type=email]',
    pass: 'input[type=password]',
    submit: 'button:has-text("Sign In")',
    done: (u) => u.pathname === `${P}/home`,
    settle: 2500,
  },
  waitUntil: 'load',
  settle: 4500,

  // Outlet names as written by the café, typos tidied; the test login's name.
  mask: {
    sub: {
      'Chruch Street': 'Church Street',
      CHRUCH: 'CHURCH',
      Indranagar: 'Indiranagar',
      INDRANAGAR: 'INDIRANAGAR',
      Sarajapura: 'Sarjapura',
      SARAJAPURA: 'SARJAPURA',
      'namma pickler pickle ball event ': 'Pickleball pop-up',
      'NAMMA PICKLER PICKLE BALL EVENT': 'PICKLEBALL POP-UP',
      Bussiness: 'Business',
    },
    exact: { test: 'Head office' },
  },

  shots: [
    { id: 'pos-cart', role: 'admin', device: 'desktop', path: `${P}/pos/sell/orders`, steps: CART, title: 'Point of sale with a live order' },
    {
      id: 'pos-options', role: 'admin', device: 'desktop', path: `${P}/pos/sell/orders`,
      steps: [...NEW_ORDER, { click: 'text=Caramel Crème Brûlée Hot', wait: 1800 }, opt('Oat Milk'), opt('Surya Beans')],
      title: 'Drink options: milk, roast and sweetener',
    },
    { id: 'orders', role: 'admin', device: 'desktop', path: `${P}/pos/sell/orders`, steps: toOutlet, title: 'Outlet bills' },
    { id: 'bill', role: 'admin', device: 'desktop', path: `${P}/pos/sell/orders`, steps: [...toOutlet, { click: 'text=#TBC4/30114', wait: 5000 }], title: 'Bill with GST split' },
    { id: 'items', role: 'admin', device: 'desktop', path: `${P}/catalogue/items`, title: 'Menu catalogue' },
    { id: 'modifiers', role: 'admin', device: 'desktop', path: `${P}/catalogue/modifier-groups`, title: 'Modifier groups' },
    { id: 'discounts', role: 'admin', device: 'desktop', path: `${P}/catalogue/discounts`, title: 'Discounts and offers' },
    { id: 'locations', role: 'admin', device: 'desktop', path: `${P}/admin/locations`, title: 'Outlets' },
    { id: 'roles', role: 'admin', device: 'desktop', path: `${P}/admin/user_roles`, title: 'Staff roles' },
    { id: 'reports', role: 'admin', device: 'desktop', path: `${P}/reports`, title: 'Sales and tax reports' },
  ],
};
