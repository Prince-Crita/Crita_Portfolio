// Veloce Trade — Veloce's B2B material-trading app. The production app cannot be
// opened for capture, so its screens come from the official "Veloce Trade — The
// Visual Guide" (public Canva view link): phone mockups of the real app, cut out
// of the mockup frame by tools/capture/canva.mjs. Personas in the guide (Ananya,
// Suresh and their companies) are the guide's own demonstration accounts.

export default {
  source: 'https://www.canva.com/design/DAHV01Wz-H4/l7az2Lcj0JhILrSO5ma1eA/view',
  folder: 'Veloce Trade',
  // `top` crops a screen below its header: in the guide's first walkthrough the
  // mockup's notch sits over the app's greeting.
  screens: [
    { asset: '5e3a86c4-10ea-4720-811f-4f008556c6f6', role: 'client-executive', id: 'dashboard', top: 312, title: 'Pickups by status' },
    { asset: '020192dd-a554-46e2-ad14-d449959ee855', role: 'client-executive', id: 'create-pickup', title: 'Listing with pricing overview' },
    { asset: '51e774f3-32db-46b3-a71c-256b893f4b0b', role: 'vendor-executive', id: 'home', title: 'Vendor executive home' },
    { asset: '157608e5-438a-4015-be24-90e3cdc14d84', role: 'vendor-executive', id: 'payments-dashboard', title: 'Payables and receivables' },
    { asset: 'acbee596-ea75-4eab-a819-72f4fe68c491', role: 'vendor-executive', id: 'today', title: 'Today at a glance' },
    { asset: '7cc4e288-bd19-4d21-9963-ae9072f98116', role: 'vendor-executive', id: 'create-po', title: 'Purchase order from a listing' },
    { asset: '878e3ea6-77aa-41df-93d7-2bbbb13f5c44', role: 'vendor-executive', id: 'assign-resources', title: 'Driver, labour and vehicle' },
    { asset: 'fdc05f21-c647-43f0-900f-26ebd80d2913', role: 'vendor-executive', id: 'fulfilment-status', title: 'Shipment status, step by step' },
    { asset: 'a4ca5d55-17bf-4752-87e3-e2fe0d94447a', role: 'vendor-executive', id: 'upload-documents', title: 'Weighment slip and vehicle photos' },
    { asset: 'c32bf9b5-73f5-4b02-b22b-b16b084024c0', role: 'vendor-executive', id: 'record-payment', title: 'Recording a payment' },
    { asset: 'ec5e4319-56ea-4d2a-8259-06f884a65558', role: 'vendor-executive', id: 'payments', title: 'Payments by status' },
    { asset: '57a3d16a-bcef-4aa9-becd-477adbe5de88', role: 'vendor-executive', id: 'documents', title: 'Company documents for verification' },
  ],
};
