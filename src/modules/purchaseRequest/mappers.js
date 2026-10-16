// Response-shape mapping for the (not-yet-built) purchase request API. No docs, no backend yet —
// every field name is a best guess, same convention as src/modules/purchase/mappers.js.

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
  return inner?.request ?? inner?.data ?? inner;
};

export const toFormOptions = (res) => {
  const data = res?.data ?? res ?? {};
  const suppliers = toList(data, 'suppliers');
  const branches = toList(data, 'branches');
  const products = toList(data, 'products');
  const toOptions = (list) => list.map((o) => ({ value: String(o.id), label: String(o.name ?? '') }));
  return {
    suppliers: toOptions(suppliers),
    branches: toOptions(branches),
    products: products.map((p) => ({ id: String(p.id), name: String(p.item_name ?? p.name ?? '') })),
  };
};

const statusLabel = (v) => {
  const s = String(v ?? '').toLowerCase();
  if (['approved', '1'].includes(s)) return 'Approved';
  if (['converted', 'purchased'].includes(s)) return 'Converted';
  if (['rejected', 'cancelled', 'canceled'].includes(s)) return 'Rejected';
  return 'Pending';
};

const toRow = (r) => ({
  id: String(pick(r, ['id']) ?? ''),
  supplier: String(pick(r, ['supplier_name']) ?? r.supplier?.name ?? ''),
  date: String(pick(r, ['request_date', 'date', 'created_at']) ?? '').slice(0, 10),
  items: num(pick(r, ['item_count', 'items_count']) ?? (Array.isArray(r.items) ? r.items.length : 0)),
  status: statusLabel(pick(r, ['status'])),
});

export const toRequestRows = (res) => toList(res, 'requests').map(toRow);

export const toRequestEditForm = (res) => {
  const r = itemOf(res);
  const items = Array.isArray(r.items) ? r.items : [];
  return {
    supplierId: String(pick(r, ['supplier_id']) ?? r.supplier?.id ?? ''),
    branchId: String(pick(r, ['branch_id']) ?? r.branch?.id ?? ''),
    date: String(pick(r, ['request_date', 'date']) ?? '').slice(0, 10),
    status: statusLabel(pick(r, ['status'])),
    cart: items.map((i) => ({
      id: String(pick(i, ['product_id', 'id'])),
      name: String(pick(i, ['item_name', 'name']) ?? ''),
      qty: num(pick(i, ['qty', 'quantity']), 1),
    })),
  };
};

// Request form -> POST /purchaseRequest/store payload.
export const toRequestPayload = ({ supplierId, branchId, date, cart }) => ({
  supplier_id: supplierId,
  branch_id: branchId,
  request_date: date,
  items: cart.map((i) => ({ product_id: i.id, qty: i.qty })),
});
