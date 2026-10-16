// Response-shape mapping for the billing API (https://store.serieux.in/api). Field names below
// follow the same convention as purchase/mappers.js; adjust here if the backend's actual response
// shape for /bill… (tracker rows 67-72) turns out to differ.

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const pick = (obj, keys) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== '') return obj[k];
  }
  return undefined;
};

const toList = (res, key) => {
  if (Array.isArray(res)) return res;
  const inner = res?.data ?? res;
  if (Array.isArray(inner)) return inner;
  if (Array.isArray(inner?.data)) return inner.data;
  if (key && Array.isArray(inner?.[key])) return inner[key];
  return [];
};

const itemOf = (res) => {
  const inner = res?.data ?? res;
  return inner?.sale ?? inner?.data ?? inner;
};

// Checkout form -> POST /bill/store payload.
export const toBillPayload = ({ customer, phone, delivery, mode, paymentMethod, cart, fee, total, grandTotal }) => ({
  customer_name: customer,
  customer_phone: phone,
  delivery_type: delivery,
  payment_mode: mode,
  payment_method: paymentMethod,
  delivery_fee: num(fee),
  subtotal: num(total),
  grand_total: num(grandTotal ?? total),
  items: cart.map((i) => ({ product_id: i.id, qty: i.qty, price: i.price })),
});

// Line items come back as `details` (confirmed by a live GET /bill/{id}/edit response — see the
// sample in the PR/chat that reported "no data" on Sale details), not `items` (that key was only
// ever a guess). No product-name field is present on a line at all, so the row falls back to its
// batch number. Keep `items` as a fallback in case the bill LIST endpoint shapes its lines
// differently from the detail endpoint.
const toLineItems = (b) => {
  const lines = Array.isArray(b?.details) ? b.details : Array.isArray(b?.items) ? b.items : [];
  return lines.map((i, idx) => ({
    id: String(pick(i, ['id', 'medicine_id', 'product_id']) ?? idx),
    name: String(pick(i, ['item_name', 'name', 'product_name']) ?? (i.batch_no ? `Batch ${i.batch_no}` : `Item ${idx + 1}`)),
    qty: num(pick(i, ['quantity', 'qty']), 1),
    price: num(pick(i, ['cost', 'price', 'selling_price'])),
  }));
};

// No single "mode" field exists — cash/card/gpay are separate amount columns, so the mode is
// whichever of those actually has money against it (same live response).
const paymentModeOf = (b) => {
  const explicit = pick(b, ['payment_mode', 'mode']);
  if (explicit) return String(explicit);
  if (num(b?.card) > 0) return 'Card';
  if (num(b?.gpay) > 0) return 'UPI';
  return 'Cash';
};

// `service_type` ("Store Pickup", "Home Delivery", …) replaces the guessed `delivery_type`;
// normalize it to the pickup/home/express keys the UI's DELIVERY_LABELS/ICONS are keyed by.
const deliveryOf = (b) => {
  const raw = String(pick(b, ['delivery_type', 'service_type']) ?? '').toLowerCase();
  if (raw.includes('home')) return 'home';
  if (raw.includes('express')) return 'express';
  return 'pickup';
};

const customerNameOf = (b) => {
  const explicit = pick(b, ['customer_name', 'customer']);
  if (explicit) return String(explicit);
  const p = b?.patient;
  const full = [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();
  return full || 'Walk-in';
};

// One bill: { id, date, customer, phone, delivery, mode, items, fee, total (= amount charged), cart }
export const toBillRow = (b) => ({
  id: String(pick(b, ['id', 'invoice_no']) ?? ''),
  date: String(pick(b, ['bill_paid_date', 'date', 'created_at']) ?? '').slice(0, 10),
  customer: customerNameOf(b),
  phone: String(pick(b, ['customer_phone', 'phone']) ?? b?.patient?.phone ?? ''),
  delivery: deliveryOf(b),
  mode: paymentModeOf(b),
  paymentMethod: pick(b, ['payment_method']),
  items: num(pick(b, ['item_count', 'items_count']) ?? toLineItems(b).length),
  fee: num(pick(b, ['delivery_fee', 'delivery_charge'])),
  total: num(pick(b, ['grand_total', 'total', 'amount_to_be_paid', 'amount_paid'])),
  cart: toLineItems(b),
});

export const toBillRows = (res) => toList(res, 'sales').map(toBillRow);

export const toBillDetail = (res) => toBillRow(itemOf(res));
