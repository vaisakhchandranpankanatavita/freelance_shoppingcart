// Swipeable KPI cards on the dashboard. `tone` picks the waveform / gauge colour.
export const metrics = [
  {
    key: 'sales',
    title: 'Sales',
    subtitle: 'Bills across all counters',
    value: 1345,
    unit: 'BILLS',
    icon: 'receipt-outline',
    badge: 70,
    tone: 'green',
  },
  {
    key: 'revenue',
    title: 'Revenue',
    subtitle: '12 counters online',
    value: 123,
    unit: '₹K',
    icon: 'wallet-outline',
    tone: 'cyan',
  },
  {
    key: 'stock',
    title: 'Low stock',
    subtitle: 'Items to restock',
    value: 23,
    unit: 'ITEMS',
    icon: 'cube-outline',
    tone: 'red',
  },
  {
    key: 'customers',
    title: 'Footfall',
    subtitle: 'Walk-in customers',
    value: 980,
    unit: 'VISITS',
    icon: 'people-outline',
    tone: 'cyan',
  },
];

// Per-metric gauge detail: scale max, unit label and value per branch per period.
export const metricDetail = {
  sales: { max: 2000, unit: 'BILLS', values: { Today: [566, 980, 610], Week: [1320, 1780, 1410], Month: [1650, 1920, 1540] } },
  revenue: { max: 200, unit: '₹K', values: { Today: [48, 123, 72], Week: [96, 168, 120], Month: [150, 190, 164] } },
  stock: { max: 100, unit: 'ITEMS', values: { Today: [23, 41, 12], Week: [35, 58, 26], Month: [52, 77, 44] } },
  customers: { max: 2000, unit: 'VISITS', values: { Today: [640, 980, 420], Week: [1200, 1640, 890], Month: [1540, 1880, 1310] } },
};

export const branches = ['Main Store', 'City Mall', 'Airport'];
export const periods = ['Today', 'Week', 'Month'];

// Revenue trend in thousands (₹K). Both series share a length so the chart can morph.
export const statistic = {
  Month: { labels: ['5', '10', '15', '20', '25', '30'], points: [0.4, 0.9, 0.6, 1.1, 0.8, 1.5, 1.0, 1.9, 1.2, 1.45, 1.1] },
  Year: { labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], points: [0.5, 0.65, 1.0, 0.75, 1.3, 0.85, 1.05, 0.8, 2.7, 1.2, 1.6] },
};

export const topSelling = [
  { id: '1', name: 'Basmati Rice 5kg', orders: 1200, profit: '+₹6,526', icon: 'basket-outline' },
  { id: '2', name: 'Sunflower Oil 1L', orders: 1230, profit: '+₹7,135', icon: 'water-outline' },
  { id: '3', name: 'Toor Dal 1kg', orders: 1100, profit: '+₹3,266', icon: 'nutrition-outline' },
];
