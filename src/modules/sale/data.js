export const catalog = [
  { id: 'SKU-001', name: 'Basmati Rice 5kg', price: 620 },
  { id: 'SKU-002', name: 'Sunflower Oil 1L', price: 140 },
  { id: 'SKU-003', name: 'Toor Dal 1kg', price: 130 },
  { id: 'SKU-004', name: 'Aashirvaad Atta 10kg', price: 540 },
  { id: 'SKU-005', name: 'Amul Butter 500g', price: 285 },
  { id: 'SKU-006', name: 'Tata Salt 1kg', price: 28 },
  { id: 'SKU-007', name: 'Colgate 200g', price: 110 },
  { id: 'SKU-008', name: 'Surf Excel 1kg', price: 220 },
];

const line = (skuId, qty) => {
  const p = catalog.find((c) => c.id === skuId);
  return { id: p.id, name: p.name, price: p.price, qty };
};

const build = (rows) => {
  const cart = rows.map(([id, qty]) => line(id, qty));
  return {
    cart,
    items: cart.reduce((s, i) => s + i.qty, 0),
    total: cart.reduce((s, i) => s + i.qty * i.price, 0),
  };
};

// Seed dates are relative to today so 'Today's bills' always has data.
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export const sales = [
  {
    id: 'INV-2001', customer: 'Ravi Kumar', phone: '9876543210',
    date: daysAgo(0), mode: 'UPI', delivery: 'pickup',
    ...build([
      ['SKU-001', 1], ['SKU-002', 2], ['SKU-003', 1],
      ['SKU-005', 1], ['SKU-007', 1],
    ]),
  },
  {
    id: 'INV-2002', customer: 'Walk-in',
    date: daysAgo(0), mode: 'Cash', delivery: 'pickup',
    ...build([
      ['SKU-002', 1], ['SKU-007', 1], ['SKU-008', 1],
    ]),
  },
  {
    id: 'INV-2003', customer: 'Priya Sharma', phone: '9812345678',
    date: daysAgo(1), mode: 'Card', delivery: 'home',
    ...build([
      ['SKU-001', 2], ['SKU-004', 1], ['SKU-002', 2],
      ['SKU-005', 2], ['SKU-003', 2], ['SKU-007', 2], ['SKU-008', 1],
    ]),
  },
  {
    id: 'INV-2004', customer: 'Walk-in',
    date: daysAgo(1), mode: 'Cash', delivery: 'pickup',
    ...build([
      ['SKU-006', 1], ['SKU-007', 1],
    ]),
  },
  {
    id: 'INV-2005', customer: 'Aisha Khan', phone: '9012345678',
    date: daysAgo(2), mode: 'UPI', delivery: 'express',
    ...build([
      ['SKU-004', 1], ['SKU-003', 3], ['SKU-005', 1],
      ['SKU-008', 2], ['SKU-006', 2],
    ]),
  },
];
