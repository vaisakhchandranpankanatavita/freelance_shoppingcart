// Response-shape mapping for the Laravel API (https://store.serieux.in/api).
// No API docs yet — every field name below is a best guess, same convention as
// src/modules/stock/mappers.js and src/modules/manage/entities.js. Fix field names HERE only.

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

// Accepts: [..] | { data: [..] } | { data: { data: [..] } } (Laravel paginator) | { purchases: [..] }.
const toList = (res, key) => {
  if (Array.isArray(res)) return res;
  const inner = res?.data ?? res;
  if (Array.isArray(inner)) return inner;
  if (Array.isArray(inner?.data)) return inner.data;
  if (key && Array.isArray(inner?.[key])) return inner[key];
  if (key && Array.isArray(res?.[key])) return res[key];
  return [];
};

const itemOf = (res) => {
  const inner = res?.data ?? res;
  return inner?.purchase ?? inner?.data ?? inner;
};

// `pick` returning undefined used to end up as the literal string "undefined" in the option's
// label/value (via String(undefined)) whenever a record didn't have any of the guessed keys —
// e.g. the branch dropdown showing "undefined" instead of a name. Falls back to '' instead.
const toOptions = (list, { labelKeys = ['name'], valueKeys = ['id'] } = {}) =>
  list.map((o) => ({
    value: String(pick(o, valueKeys) ?? ''),
    label: String(pick(o, labelKeys) ?? ''),
  }));

const toPurchaseProducts = (list) =>
  list.map((p) => ({
    id: String(p.id),
    name: String(p.item_name ?? p.name ?? ''),
    price: num(pick(p, ['purchase_price', 'cost_price', 'price'])),
  }));

// GET /productPurchase/create — suppliers/products/branches to build the "new purchase" form.
export const toFormOptions = (res) => {
  const data = res?.data ?? res ?? {};
  const suppliers = toList(data, 'suppliers');
  const branches = toList(data, 'branches');
  const products = toList(data, 'products');
  return {
    suppliers: toOptions(suppliers),
    branches: toOptions(branches),
    products: toPurchaseProducts(products),
  };
};

// Fallback product source (GET /products or /get-products) for when the create-form
// response above doesn't bundle a products list — see services.js:getPurchaseForm.
export const toPurchaseProductOptions = (res) => toPurchaseProducts(toList(res, 'products'));

// Fallback branch source (GET /branch) for when the create-form response doesn't bundle a
// branches list either — a live 422 showed branch_id still required with no branch field
// ever having been rendered. Same convention as the products fallback above. The branch-create
// 422 (see entities.js's `branch` entity) showed this backend's branch module using odd
// `clinic_*` field names for everything else, so the name key is unconfirmed too — try the
// common conventions used elsewhere in this app before falling back to blank.
export const toPurchaseBranchOptions = (res) =>
  toOptions(toList(res, 'branches'), { labelKeys: ['branch_name', 'name', 'clinic_name', 'title'] })
    .map((o) => ({ ...o, label: o.label || `Branch #${o.value}` }));

// GET /categories, reshaped for the purchase form's Category picker. Required by a live
// 422 on POST /productPurchase/store (see toPurchasePayload) — what "category" means for a
// purchase order (one overall category vs. per-item) is unconfirmed; this sends whichever
// category the user picks from the standard category list.
export const toPurchaseCategoryOptions = (res) =>
  toOptions(toList(res, 'categories'), { labelKeys: ['category_name', 'name'] });

// GET /suppliers -> id -> supplier detail map, for the purchase-order payload below. Same
// reasoning as toPurchaseBranchGstinMap: GET /suppliers/{id}/edit's shape is unconfirmed and
// was coming back without a usable GST field, even for suppliers that do have one set. Confirmed
// live from a GET /suppliers response: `{ data: [{ id, name, phone, address, gst, ... }] }` —
// this list endpoint's own GST key is `gst` (not `gst_number`, the key manage/entities.js uses
// for the same value on a different endpoint, nor `gst_no`). Field names required by the
// purchase-order payload itself were confirmed by a live 422 on POST /productPurchase/store:
// supplier.name/phone/address/gst_no are all required there — note that output key is `gst_no`.
export const toPurchaseSupplierDetailMap = (res) => {
  const list = toList(res, 'suppliers');
  const map = {};
  list.forEach((s) => {
    map[String(pick(s, ['id']) ?? '')] = {
      name: String(pick(s, ['name', 'supplier_name']) ?? ''),
      phone: String(pick(s, ['phone']) ?? ''),
      address: String(pick(s, ['address']) ?? ''),
      gst_no: String(pick(s, ['gst', 'gst_number', 'gst_no']) ?? ''),
    };
  });
  return map;
};

// GET /branch -> id -> GSTIN map, for the purchase-order payload below. GET /branch/{id}/edit
// was tried first but its response shape is unconfirmed and came back without a usable `gstin`
// (live payloads went out with gstin: "" even for branches that do have one set — see a live
// GET /branch response: { branches: [{ id, gstin, ... }] }, flat, confirmed working). The plain
// list endpoint is the one place `gstin` has actually been observed, so purchase orders look it
// up there instead of re-fetching the single-branch edit endpoint.
export const toPurchaseBranchGstinMap = (res) => {
  const list = toList(res, 'branches');
  const map = {};
  list.forEach((b) => {
    map[String(pick(b, ['id']) ?? '')] = String(pick(b, ['gstin']) ?? '');
  });
  return map;
};

const statusLabel = (v) => {
  const s = String(v ?? '').toLowerCase();
  if (['1', 'received', 'completed'].includes(s)) return 'Received';
  if (['cancelled', 'canceled', '0'].includes(s)) return 'Cancelled';
  return 'Pending';
};

// One purchase: { id, supplier, date, items, total, status }
const toRow = (p) => ({
  id: String(pick(p, ['id', 'invoice_no']) ?? ''),
  supplier: String(pick(p, ['supplier_name', 'supplier']) ?? p.supplier?.name ?? ''),
  date: String(pick(p, ['purchase_date', 'date', 'created_at']) ?? '').slice(0, 10),
  items: num(pick(p, ['item_count', 'items_count', 'total_items']) ?? (Array.isArray(p.items) ? p.items.length : 0)),
  total: num(pick(p, ['grand_total', 'total_amount', 'total'])),
  status: statusLabel(pick(p, ['status'])),
});

export const toPurchaseRows = (res) => toList(res, 'purchases').map(toRow);

export const toPurchaseDetail = (res) => toRow(itemOf(res));

// GET /productPurchase/{id}/edit -> prefill for AddPurchaseScreen's edit mode.
export const toPurchaseEditForm = (res) => {
  const p = itemOf(res);
  const items = toList(p, 'items').length ? toList(p, 'items') : Array.isArray(p.items) ? p.items : [];
  return {
    supplierId: String(pick(p, ['supplier_id']) ?? p.supplier?.id ?? ''),
    branchId: String(pick(p, ['branch_id']) ?? p.branch?.id ?? ''),
    date: String(pick(p, ['invoice_date', 'purchase_date', 'date']) ?? '').slice(0, 10),
    invoiceNo: String(pick(p, ['invoice_no']) ?? ''),
    categoryId: String(pick(p, ['category_id', 'category']) ?? p.category?.id ?? ''),
    amountPaid: num(pick(p, ['item_amount_paid', 'itemAmountPaid'])),
    cart: items.map((i) => ({
      id: String(pick(i, ['product_id', 'id'])),
      name: String(pick(i, ['item_name', 'name', 'product_name']) ?? ''),
      price: num(pick(i, ['cost_price', 'purchase_price', 'price'])),
      qty: num(pick(i, ['qty', 'quantity']), 1),
    })),
  };
};

// Add/edit-purchase form -> POST /productPurchase/store (or /update) payload.
// Field names below are confirmed by a live 422 from POST /productPurchase/store — everything
// in `errors` there (supplier.name/phone/address/gst_no, invoice_no, invoice_date, branch_id,
// category, itemtotal, currentbilltotal, grandTotal, itemAmountPaid) is required. Still
// unconfirmed: whether grandTotal/currentbilltotal can legitimately differ from itemtotal
// (e.g. extra charges, a running supplier balance) — this sends all three equal, and whether
// itemAmountPaid may be a genuine partial payment or must equal grandTotal.
// `deliverycharge`, `tax`, `discount` and `previousOutStanding` aren't backed by any field in
// this form (confirmed live: the backend crashes with "Undefined array key" rather than a 422
// when any of these is missing entirely, so all four are read unconditionally) — sent as 0
// until the form grows real inputs for them. `previousOutStanding` in particular looks like a
// running supplier-balance figure this app doesn't track anywhere yet; 0 is a guess, not a
// confirmed value — flag it if a created order's supplier balance looks wrong afterward.
// `category` turned out to be unrelated to the Category picker in this form: a live GET
// /productPurchase row shows it holding a single-letter code ("D"), nothing like the
// full-name/numeric-id categories the generic /categories endpoint returns (which is also what
// Brands reads from — see brands.js). The screen's `categoryId` (from that generic list) was
// being sent here and the database rejected it outright ("Data truncated for column
// 'category'"). Only one valid code has ever been observed live, so that's hardcoded for now;
// `categoryId` is dropped entirely here until the real set of codes (and what they mean) is known.
export const toPurchasePayload = ({
  supplierDetail, branchId, branchGstin, invoiceNo, date, cart, amountPaid,
}) => {
  const itemtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  return {
    supplier: supplierDetail,
    branch_id: branchId,
    gstin: branchGstin,
    invoice_no: invoiceNo,
    invoice_date: date,
    category: 'D',
    items: cart.map((i) => ({ product_id: i.id, qty: i.qty, cost_price: i.price })),
    itemtotal,
    currentbilltotal: itemtotal,
    grandTotal: itemtotal,
    deliverycharge: 0,
    tax: 0,
    discount: 0,
    previousOutStanding: 0,
    itemAmountPaid: amountPaid,
  };
};
