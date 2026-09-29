import { getBranches, getCategories, getProducts, getSuppliers } from '../../api';
import { isActive, listOf } from '../manage/entities';
import { mapStockItems } from '../stock/mappers';

// The API has no dashboard/sales endpoint, so every figure here is derived from the lists it does
// expose: products (stock), branches, categories and suppliers. A list that fails to load only
// drops the cards built from it; the dashboard errors out only when all of them fail.

const NICE_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

// Stock value as a short card figure: ₹K below a lakh, ₹L above.
const money = (rupees) =>
  rupees >= 100000
    ? { value: Math.round(rupees / 1000) / 100, unit: '₹L' }
    : { value: Math.round(rupees / 100) / 10, unit: '₹K' };

const stockValueChart = (rows) => {
  const byCategory = new Map();
  rows.forEach((r) => byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + (r.qty * r.price) / 1000));
  const top = [...byCategory].sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (top.length < 2) return null;
  const peak = Math.max(...top.map(([, v]) => v));
  const step = NICE_STEPS.find((s) => s * 3 >= peak) ?? Math.ceil(peak / 3);
  return {
    series: {
      labels: top.map(([name]) => (name.length > 6 ? `${name.slice(0, 5)}…` : name)),
      points: top.map(([, v]) => Math.round(v * 100) / 100),
    },
    max: step * 3,
    ticks: [0, step, step * 2, step * 3],
  };
};

// Everything the extra widgets need, from the same stock rows: value share and a per-category table
// (top five categories, the rest folded into "Other"), plus how many items are fine / low / out.
const insightsFrom = (rows) => {
  const byCat = new Map();
  rows.forEach((r) => {
    const c = byCat.get(r.category) ?? { id: r.category, category: r.category, items: new Set(), units: 0, value: 0 };
    c.items.add(r.productId);
    c.units += r.qty;
    c.value += r.qty * r.price;
    byCat.set(r.category, c);
  });
  const cats = [...byCat.values()]
    .map((c) => ({ ...c, items: c.items.size, value: Math.round(c.value) }))
    .sort((a, b) => b.value - a.value);
  const top = cats.slice(0, 5);
  const rest = cats.slice(5);
  const share = top.map((c) => ({ label: c.category, value: c.value }));
  if (rest.length) share.push({ label: 'Other', value: rest.reduce((s, c) => s + c.value, 0) });
  const out = rows.filter((r) => r.qty <= 0).length;
  const low = rows.filter((r) => r.qty > 0 && r.qty <= r.lowAt).length;
  return {
    share: share.filter((d) => d.value > 0),
    totalValue: cats.reduce((s, c) => s + c.value, 0),
    table: top,
    health: { ok: rows.length - out - low, low, out },
  };
};

export const getDashboard = async () => {
  const [products, branches, categories, suppliers] = await Promise.allSettled([
    getProducts(),
    getBranches(),
    getCategories(),
    getSuppliers(),
  ]);
  if ([products, branches, categories, suppliers].every((r) => r.status === 'rejected')) {
    throw products.reason;
  }

  const metrics = [];
  let lowStock = [];
  let topStocked = [];
  let chart = null;
  let insights = null;

  if (products.status === 'fulfilled') {
    const rows = mapStockItems(products.value);
    const low = rows.filter((r) => r.qty <= r.lowAt);
    const value = money(rows.reduce((sum, r) => sum + r.qty * r.price, 0));
    metrics.push(
      { key: 'products', title: 'Products', subtitle: 'Items in your catalogue', value: new Set(rows.map((r) => r.productId)).size, unit: 'ITEMS', icon: 'cube-outline', tone: 'green', to: ['Stock'] },
      { key: 'value', title: 'Stock value', subtitle: 'At selling price', ...value, icon: 'wallet-outline', tone: 'cyan', to: ['Stock'] },
      { key: 'low', title: 'Low stock', subtitle: 'Items to restock', value: low.length, unit: 'ITEMS', icon: 'alert-circle-outline', tone: low.length ? 'red' : 'green', to: ['Stock'] },
    );
    lowStock = [...low].sort((a, b) => a.qty - b.qty).slice(0, 5);
    topStocked = [...rows].sort((a, b) => b.qty * b.price - a.qty * a.price).slice(0, 5);
    chart = stockValueChart(rows);
    if (rows.length) insights = insightsFrom(rows);
  }
  if (branches.status === 'fulfilled') {
    const list = listOf(branches.value);
    metrics.push({ key: 'branches', title: 'Branches', subtitle: `${list.length} in total`, value: list.filter(isActive).length, unit: 'ACTIVE', icon: 'business-outline', tone: 'cyan', to: ['More', { screen: 'EntityList', params: { entity: 'branch' } }] });
  }
  if (suppliers.status === 'fulfilled') {
    metrics.push({ key: 'suppliers', title: 'Suppliers', subtitle: 'Who you buy from', value: listOf(suppliers.value).length, unit: 'PARTNERS', icon: 'people-outline', tone: 'green', to: ['More', { screen: 'EntityList', params: { entity: 'supplier' } }] });
  }
  if (categories.status === 'fulfilled') {
    metrics.push({ key: 'categories', title: 'Categories', subtitle: 'Aisles and groups', value: listOf(categories.value).length, unit: 'GROUPS', icon: 'albums-outline', tone: 'cyan', to: ['More', { screen: 'EntityList', params: { entity: 'category' } }] });
  }

  return { metrics, lowStock, topStocked, chart, insights };
};
