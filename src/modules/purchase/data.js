// Seed dates are relative to today so 'Today's bills' always has data.
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export const purchases = [
  {
    id: 'PO-1001',
    supplier: 'ABC Traders',
    date: daysAgo(9),
    items: 12,
    total: 18420,
    status: 'Received',
  },
  {
    id: 'PO-1002',
    supplier: 'FreshMart Wholesale',
    date: daysAgo(7),
    items: 8,
    total: 9640,
    status: 'Pending',
  },
  {
    id: 'PO-1003',
    supplier: 'Kirana Distributors',
    date: daysAgo(5),
    items: 20,
    total: 32100,
    status: 'Received',
  },
  {
    id: 'PO-1004',
    supplier: 'Daily Needs Co.',
    date: daysAgo(4),
    items: 5,
    total: 4780,
    status: 'Cancelled',
  },
];
