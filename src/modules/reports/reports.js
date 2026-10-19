import {
  getBillStatistics,
  getCategorySales,
  getSalePeakHours,
  getSaleSummary,
  getSalesRevenue,
  getCollectionReport,
  getInStockReport,
  getIncomeReport,
  getOutOfStockReport,
  getRefundBillList,
  getReturnedItems,
  getSalesCategoryReport,
  getSalesItemReport,
} from '../../api';
import { listOf } from '../manage/entities';
import { rupees, shortDate } from '../../utils/format';

// Every report screen (tracker rows 84-91) is one generic list driven by the config below, same
// convention as manage/entities.js. Response field names aren't documented anywhere yet, so each
// row is built from a fallback chain of every plausible key instead of one hard-coded name — fix
// a field's real name here only, once a live response confirms it.
const pick = (row, keys) =>
  keys.map((k) => row[k]).find((v) => v !== undefined && v !== null && String(v).trim() !== '');

const money = (row, keys) => {
  const v = pick(row, keys);
  return v === undefined ? null : rupees(v);
};

// Same lookup as `money`, but the raw number instead of a formatted "₹1,234" string — used to
// drive the chart view's bar widths (BarListChart), kept separate from `value` so the list view's
// display text (money() or a "N sold" suffix) is untouched.
const num = (row, keys) => {
  const v = pick(row, keys);
  return v === undefined ? null : Number(v) || 0;
};

const date = (row, keys) => {
  const v = pick(row, keys);
  return v ? shortDate(v) : null;
};

// Normalizes one report's response into flat rows with a stable `id`, a `primary` line, an
// optional `secondary` line, and an optional right-aligned `value`.
export const toReportRows = (res, mapRow, rows) =>
  (rows ? rows(res) : listOf(res)).map((row, i) => ({ id: String(row.id ?? i), ...mapRow(row) }));

// /billStatistics returns { bills: { monthly: { months, new_bills: {Jan: n}, refunds: {Jan: n} } } }
// rather than a list — one row per month.
const monthlyBills = (res) => {
  const m = res?.bills?.monthly;
  return (m?.months ?? []).map((month) => ({ month, new_bills: m.new_bills?.[month] ?? 0, refunds: m.refunds?.[month] ?? 0 }));
};

export const REPORTS = {
  collection: {
    title: 'Collection report',
    icon: 'wallet-outline',
    emptyIcon: 'wallet-outline',
    api: getCollectionReport,
    dateFilter: true,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => ({
      primary: pick(r, ['branch_name', 'collected_by', 'payment_mode', 'mode']) ?? 'Collection',
      secondary: date(r, ['date', 'collection_date', 'created_at']),
      value: money(r, ['amount', 'total_collection', 'total']),
      chartValue: num(r, ['amount', 'total_collection', 'total']),
    }),
  },
  // Row shape confirmed by a live response: one row PER DAY (not per income source) —
  // { date, day, netPaid, cash, gpay, card, machine_tax, balance_given, pureTotal,
  // totalCustomer, totalService } — supersedes the earlier branch/source-based guess, which
  // matched none of these keys and always rendered a blank "Income" row.
  income: {
    title: 'Income report',
    icon: 'trending-up-outline',
    emptyIcon: 'trending-up-outline',
    api: getIncomeReport,
    dateFilter: true,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => {
      // The different payment-method amounts, shown individually rather than collapsed into
      // one figure — only the ones with money in them, so an all-cash day doesn't show
      // "GPay ₹0 • Card ₹0" clutter.
      const breakdown = [
        r.cash ? `Cash ${rupees(r.cash)}` : null,
        r.gpay ? `GPay ${rupees(r.gpay)}` : null,
        r.card ? `Card ${rupees(r.card)}` : null,
        r.machine_tax ? `Tax ${rupees(r.machine_tax)}` : null,
      ].filter(Boolean);
      return {
        primary: [date(r, ['date']), r.day].filter(Boolean).join(' • ') || 'Day',
        secondary: breakdown.length ? breakdown.join(' • ') : 'No payments recorded',
        value: money(r, ['netPaid', 'pureTotal', 'amount']),
        chartValue: num(r, ['netPaid', 'pureTotal', 'amount']),
      };
    },
  },
  salesByItem: {
    title: 'Sale by item',
    icon: 'cube-outline',
    emptyIcon: 'cube-outline',
    api: getSalesItemReport,
    dateFilter: true,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => ({
      primary: pick(r, ['product_name', 'item_name', 'name']) ?? 'Item',
      secondary: pick(r, ['quantity', 'qty', 'quantity_sold']) != null
        ? `${pick(r, ['quantity', 'qty', 'quantity_sold'])} sold`
        : null,
      value: money(r, ['amount', 'total_sale', 'total']),
      chartValue: num(r, ['amount', 'total_sale', 'total']),
    }),
  },
  salesByCategory: {
    title: 'Sale by category',
    icon: 'albums-outline',
    emptyIcon: 'albums-outline',
    api: getSalesCategoryReport,
    dateFilter: true,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => ({
      primary: pick(r, ['category_name', 'name']) ?? 'Category',
      secondary: pick(r, ['quantity', 'qty', 'quantity_sold']) != null
        ? `${pick(r, ['quantity', 'qty', 'quantity_sold'])} sold`
        : null,
      value: money(r, ['amount', 'total_sale', 'total']),
      chartValue: num(r, ['amount', 'total_sale', 'total']),
    }),
  },
  // Row shape confirmed by a live response: { branch_id, product_id, product_name, variant_id,
  // variant_name, batch_id, batch_no, available_stock, purchase_price, selling_price,
  // stock_value, expiry_date } — one row per batch, not per product, so batch/expiry are shown
  // to tell two rows of the same product apart; stock_value (₹ worth of that batch) is the
  // right-aligned figure, same convention as the money reports above.
  inStock: {
    title: 'In stock',
    icon: 'checkmark-circle-outline',
    emptyIcon: 'checkmark-circle-outline',
    api: getInStockReport,
    dateFilter: false,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => {
      const qty = pick(r, ['available_stock', 'quantity', 'qty', 'stock']);
      const variant = pick(r, ['variant_name']);
      const batch = pick(r, ['batch_no', 'batch_number']);
      const expiry = date(r, ['expiry_date']);
      return {
        primary: pick(r, ['product_name', 'item_name', 'name']) ?? 'Item',
        secondary: [
          qty != null ? `${qty} in stock` : null,
          variant,
          batch ? `Batch ${batch}` : null,
          expiry ? `Exp ${expiry}` : null,
        ].filter(Boolean).join(' • ') || pick(r, ['branch_name', 'category_name']),
        value: money(r, ['stock_value', 'amount']),
        chartValue: num(r, ['stock_value', 'amount']),
      };
    },
  },
  outOfStock: {
    title: 'Out of stock',
    icon: 'close-circle-outline',
    emptyIcon: 'close-circle-outline',
    api: getOutOfStockReport,
    // Turned on so the From/To calendar shows (user couldn't pick a start/end date at all with
    // this off) — harmless to send fromdate/todate even if this endpoint ends up ignoring them.
    dateFilter: true,
    // No numeric value at all for this one (every row is just "zero stock") — nothing to chart.
    chartable: false,
    mapRow: (r) => ({
      primary: pick(r, ['product_name', 'item_name', 'name']) ?? 'Item',
      secondary: pick(r, ['branch_name', 'category_name']),
      value: null,
    }),
  },
  refundBills: {
    title: 'Refund bills',
    icon: 'return-down-back-outline',
    emptyIcon: 'return-down-back-outline',
    api: getRefundBillList,
    dateFilter: true,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => ({
      primary: pick(r, ['bill_no', 'invoice_no', 'customer_name']) ?? 'Refund',
      secondary: date(r, ['date', 'refund_date', 'created_at']),
      value: money(r, ['amount', 'refund_amount', 'total']),
      chartValue: num(r, ['amount', 'refund_amount', 'total']),
    }),
  },
  // Rows 92-97 (sales analytics). Response shapes unconfirmed — generic fallback chains below.
  billStatistics: {
    title: 'Bill statistics',
    icon: 'receipt-outline',
    emptyIcon: 'receipt-outline',
    api: getBillStatistics,
    rows: monthlyBills,
    dateFilter: true,
    chartable: true,
    chartFormat: (v) => `${Math.round(v)} bills`,
    mapRow: (r) => ({
      primary: r.month,
      secondary: `${r.refunds} refunds`,
      value: `${r.new_bills} bills`,
      chartValue: r.new_bills,
    }),
  },
  salePeakHours: {
    title: 'Sale peak hours',
    icon: 'time-outline',
    emptyIcon: 'time-outline',
    api: getSalePeakHours,
    dateFilter: true,
    chartable: true,
    chartFormat: (v) => `${Math.round(v)} bills`,
    mapRow: (r) => ({
      primary: String(r.label ?? r.hour ?? 'Hour'),
      secondary: null,
      value: `${r.bill_count ?? 0} bills`,
      chartValue: Number(r.bill_count) || 0,
    }),
  },
  saleSummary: {
    title: 'Sale summary',
    icon: 'stats-chart-outline',
    emptyIcon: 'stats-chart-outline',
    api: getSaleSummary,
    dateFilter: true,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => ({
      primary: pick(r, ['label', 'name', 'date', 'period']) ?? 'Summary',
      secondary: pick(r, ['bills', 'count', 'total_bills']) != null ? `${pick(r, ['bills', 'count', 'total_bills'])} bills` : null,
      value: money(r, ['amount', 'total_sale', 'total', 'value']),
      chartValue: num(r, ['amount', 'total_sale', 'total', 'value']),
    }),
  },
  categorySales: {
    title: 'Category sales',
    icon: 'pie-chart-outline',
    emptyIcon: 'pie-chart-outline',
    api: getCategorySales,
    dateFilter: true,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => ({
      primary: pick(r, ['category_name', 'category', 'name']) ?? 'Category',
      secondary: pick(r, ['quantity', 'qty']) != null ? `${pick(r, ['quantity', 'qty'])} sold` : null,
      value: money(r, ['amount', 'total_sale', 'total']),
      chartValue: num(r, ['amount', 'total_sale', 'total']),
    }),
  },
  salesRevenue: {
    title: 'Sales revenue',
    icon: 'cash-outline',
    emptyIcon: 'cash-outline',
    api: getSalesRevenue,
    // POST /revenue always returns a fixed 30-day window starting today and ignores fromdate/todate.
    dateFilter: false,
    chartable: true,
    chartFormat: rupees,
    mapRow: (r) => ({
      primary: pick(r, ['label', 'date', 'name', 'month']) ?? 'Revenue',
      secondary: pick(r, ['day']),
      value: money(r, ['revenue', 'amount', 'total']),
      chartValue: num(r, ['revenue', 'amount', 'total']),
    }),
  },
  returnedItems: {
    title: 'Returned items',
    icon: 'arrow-undo-outline',
    emptyIcon: 'arrow-undo-outline',
    api: getReturnedItems,
    dateFilter: true,
    chartable: true,
    // Chart bars are quantity-based when the row has one (the common case), falling back to
    // money otherwise — `chartFormat` is picked per-row below to match whichever one is used,
    // since a single static formatter can't tell the two apart.
    mapRow: (r) => {
      const qty = pick(r, ['quantity', 'qty']);
      return {
        primary: pick(r, ['product_name', 'item_name', 'name']) ?? 'Item',
        secondary: date(r, ['date', 'return_date', 'created_at']),
        value: qty != null ? `${qty} returned` : money(r, ['amount', 'total']),
        chartValue: qty != null ? Number(qty) || 0 : num(r, ['amount', 'total']),
        chartFormat: qty != null ? ((v) => `${Math.round(v)} returned`) : rupees,
      };
    },
  },
};
