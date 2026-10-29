// Fictional replacement names for display masking. Allocation keeps the first
// letter of the original so avatar initials in the UI still line up.

const PEOPLE = [
  'Arjun', 'Anand', 'Ashwin', 'Aditi', 'Bhavya', 'Bala', 'Charan', 'Chitra', 'Dinesh', 'Deepa',
  'Divakar', 'Eshwar', 'Farhan', 'Gokul', 'Geetha', 'Hari', 'Harini', 'Imran', 'Indu', 'Joel',
  'Jaya', 'Karthik', 'Kavitha', 'Keerthi', 'Lokesh', 'Lavanya', 'Manoj', 'Meena', 'Mohan', 'Naveen',
  'Nithya', 'Nandini', 'Pradeep', 'Pooja', 'Praveen', 'Rohan', 'Revathi', 'Rajiv', 'Sangeetha', 'Suresh',
  'Sanjay', 'Shalini', 'Tarun', 'Uma', 'Varun', 'Vidya', 'Vinoth', 'Yamini', 'Gautham', 'Kiran',
  'Kishore', 'Madhavi', 'Nirmal', 'Prakash', 'Ramya', 'Sowmya', 'Thilak', 'Vasanth', 'Yuvan', 'Ganesh',
];

// Fictional textile and manufacturing businesses.
const COMPANIES = [
  'Amberline Knits', 'Aravali Apparels', 'Ashwood Exports', 'Azure Weaves', 'Aurum Textiles',
  'Banyan Knit Fab', 'Bluefern Garments', 'Brookfield Fabrics', 'Birchway Apparels', 'Bayleaf Knitwear',
  'Cedarline Garments', 'Coralbay Fabrics', 'Crestwood Knits', 'Citrine Exports', 'Copperleaf Apparels',
  'Deltaweave Mills', 'Dunmore Textiles', 'Driftwood Knits', 'Elmstone Apparels', 'Emberline Fabrics',
  'Fernhill Apparels', 'Foxglove Knits', 'Galeway Exports', 'Granite Weaves', 'Harbourline Textiles',
  'Hazelwood Knits', 'Indigo Crest Mills', 'Ivory Loom Works', 'Jadeport Garments', 'Juniper Knitwear',
  'Kestrel Fabrics', 'Kovai Loom Co.', 'Larkspur Apparels', 'Linden Knit Exports', 'Lotusway Textiles',
  'Maplecourt Garments', 'Meadowline Knits', 'Moonstone Fabrics', 'Northgate Apparels', 'Nilavu Knits',
  'Oakridge Textiles', 'Opaline Exports', 'Pinecrest Garments', 'Pearlway Knitwear', 'Quillon Fabrics',
  'Riverbend Knits', 'Rosewood Apparels', 'Saffronline Textiles', 'Silverleaf Knits', 'Sundial Exports',
  'Tamarind Garments', 'Teakline Fabrics', 'Umber Loom Works', 'Valewood Apparels', 'Vetiver Knits',
  'Willowbrook Textiles', 'Wrenfield Exports', 'Yarrow Knitwear', 'Zenara Fabrics', 'Cobaltline Knits',
];

export function allocator(pool, used = new Set()) {
  const taken = new Set(used);
  return (original) => {
    const first = (original.trim()[0] || 'A').toUpperCase();
    const pick =
      pool.find((n) => !taken.has(n) && n[0].toUpperCase() === first) ?? pool.find((n) => !taken.has(n));
    taken.add(pick);
    return pick;
  };
}

export const personAllocator = (avoid = []) => allocator(PEOPLE, new Set(avoid));
export const companyAllocator = (avoid = []) => allocator(COMPANIES, new Set(avoid));

/** "AB" initials as the SMC UI derives them: first two non-space characters. */
export const twoLetterInitials = (name) => name.replace(/\s+/g, '').slice(0, 2).toUpperCase();

/** A short client code from a name, unique within `taken`. */
export function codeFor(name, digits, taken) {
  const letters = name.replace(/[^A-Za-z]/g, '').toUpperCase();
  for (let i = 0; i + 3 <= letters.length; i++) {
    const code = letters.slice(0, 1) + letters.slice(i + 1, i + 3) + digits;
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
  const fallback = letters.slice(0, 3) + digits;
  taken.add(fallback);
  return fallback;
}

/** Deterministic placeholder for a phone number. */
export const phoneFor = (i) => `90000${String(10000 + i * 137).slice(-5)}`;
