// City Threads — textile inventory and warehouse management (demonstration
// environment with seeded data). Only a tester's placeholder area is renamed.

const LOOKUP = [
  { click: 'button:has-text("Scan barcode / Stock ID")' },
  { wait: 1200 },
  { click: 'button:has-text("Search")' },
  { wait: 800 },
  { fill: ['#stock-find', '00152'] },
  { wait: 2500 },
  // A result row only resolves the unit (read-only GET).
  { click: 'li button:has(span.font-mono) >> nth=0' },
  { wait: 3000 },
];

export default {
  base: 'https://city-threads-prototype.prince-4a5.workers.dev',
  login: { path: '/login', user: 'input[type=email]', pass: 'input[type=password]', submit: 'button[type=submit]' },
  waitUntil: 'load',
  settle: 4500,

  mask: {
    sub: { 'DUMMY-A': 'R4', Dummy: 'Room 4' },
    exact: { testing: 'Overflow & returns' },
  },
  // The realtime badge can briefly read "Reconnecting" while it connects.
  afterMask: () => {
    for (const el of document.querySelectorAll('header span')) {
      if (el.textContent.trim() === 'Reconnecting') el.style.setProperty('display', 'none', 'important');
    }
  },

  shots: [
    // ── Admin · desktop ──────────────────────────────────────────────
    { id: 'overview', role: 'admin', device: 'desktop', path: '/admin/overview', title: 'Warehouse overview' },
    { id: 'overview-full', role: 'admin', device: 'desktop', path: '/admin/overview', full: true, title: 'Warehouse overview (full page)' },
    { id: 'warehouse', role: 'admin', device: 'desktop', path: '/admin/warehouse', title: 'Warehouse explorer' },
    { id: 'warehouse-area', role: 'admin', device: 'desktop', path: '/admin/warehouse', steps: [{ click: 'button:has-text("Open area") >> nth=1' }, { wait: 3000 }], title: 'Area → rack → bin' },
    { id: 'stock', role: 'admin', device: 'desktop', path: '/admin/inventory/stock', title: 'Stock units' },
    { id: 'products', role: 'admin', device: 'desktop', path: '/admin/inventory/products', title: 'Product catalogue' },
    { id: 'sales-orders', role: 'admin', device: 'desktop', path: '/admin/order-to-dispatch/sales-orders', title: 'Sales orders pipeline' },
    { id: 'purchase-orders', role: 'admin', device: 'desktop', path: '/admin/order-to-dispatch/purchase-orders', title: 'Purchase orders' },
    { id: 'dispatch', role: 'admin', device: 'desktop', path: '/admin/order-to-dispatch/dispatch', title: 'Dispatch' },
    { id: 'counts', role: 'admin', device: 'desktop', path: '/admin/inventory/counts', title: 'Cycle counts' },
    { id: 'movements', role: 'admin', device: 'desktop', path: '/admin/movements', title: 'Stock movement ledger' },
    { id: 'sales', role: 'admin', device: 'desktop', path: '/admin/sales', title: 'Sales' },
    { id: 'executives', role: 'admin', device: 'desktop', path: '/admin/executives', title: 'Executives' },
    { id: 'requests', role: 'admin', device: 'desktop', path: '/admin/requests', title: 'Requests' },

    // ── Admin · mobile ───────────────────────────────────────────────
    { id: 'overview', role: 'admin', device: 'mobile', path: '/admin/overview', title: 'Warehouse overview' },
    { id: 'warehouse', role: 'admin', device: 'mobile', path: '/admin/warehouse', title: 'Warehouse explorer' },
    { id: 'sales-orders', role: 'admin', device: 'mobile', path: '/admin/order-to-dispatch/sales-orders', title: 'Sales orders' },

    // ── Executive · mobile ───────────────────────────────────────────
    { id: 'home', role: 'executive', device: 'mobile', path: '/exec/home', title: 'Executive home' },
    { id: 'operations', role: 'executive', device: 'mobile', path: '/exec/operations', title: 'Warehouse operations' },
    { id: 'stock', role: 'executive', device: 'mobile', path: '/exec/stock', title: 'Stock lookup' },
    { id: 'stock-unit', role: 'executive', device: 'mobile', path: '/exec/stock', steps: LOOKUP, title: 'Stock unit with barcode' },
    { id: 'transfer', role: 'executive', device: 'mobile', path: '/exec/operations/transfer', title: 'Stock transfer' },
    { id: 'pick', role: 'executive', device: 'mobile', path: '/exec/operations/pick', title: 'Pick list' },
    { id: 'dispatch', role: 'executive', device: 'mobile', path: '/exec/operations/dispatch', title: 'Dispatch' },
    { id: 'count', role: 'executive', device: 'mobile', path: '/exec/operations/count', title: 'Cycle count' },
    { id: 'inward', role: 'executive', device: 'mobile', path: '/exec/operations/inward', title: 'Goods inward' },
    { id: 'activity', role: 'executive', device: 'mobile', path: '/exec/activity', title: 'My activity' },

    // ── Executive · desktop ──────────────────────────────────────────
    { id: 'home', role: 'executive', device: 'desktop', path: '/exec/home', title: 'Executive home on desktop' },
    { id: 'stock-unit', role: 'executive', device: 'desktop', path: '/exec/stock', steps: LOOKUP, title: 'Stock unit with barcode' },
  ],
};
