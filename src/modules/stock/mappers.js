// Response-shape mapping for the Laravel API (https://store.serieux.in/api).
// No API docs yet — every field name below is a best guess. Once real responses
// are known, fix them HERE only; stock and sale services both go through this file.

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

// Accepts: [..] | { data: [..] } | { data: { data: [..] } } (Laravel paginator)
// | { products: [..] } | { data: { products: [..] } }.
export const toList = (res) => {
  if (Array.isArray(res)) return res;
  const inner = res?.data ?? res;
  if (Array.isArray(inner)) return inner;
  if (Array.isArray(inner?.data)) return inner.data;
  if (Array.isArray(inner?.products)) return inner.products;
  if (Array.isArray(res?.products)) return res.products;
  return [];
};

// Single-object responses: { data: {..} } | { data: { product: {..} } } | {..}
export const toItem = (res) => {
  const inner = res?.data ?? res;
  return inner?.product ?? inner?.data ?? inner;
};

const productName = (p) => String(p.item_name ?? p.name ?? '');

const categoryName = (p) =>
  (typeof p.category === 'string' ? p.category : p.category?.category_name ?? p.category?.name) ??
  p.category_name ??
  'General';

const unitName = (p) =>
  (typeof p.unit === 'string' ? p.unit : p.unit?.name) ?? p.unit_name ?? 'pcs';

// One stock row: { id (variant id, else product id), productId, name, category, qty, unit, price, lowAt }
const toRow = (product, variant) => {
  const src = variant ?? product;
  const variantName = variant && pick(variant, ['name', 'variant_name', 'title']);
  return {
    id: String(src.id ?? product.id),
    productId: String(product.id),
    name: variantName ? `${productName(product)} - ${variantName}` : productName(product),
    category: categoryName(product),
    qty: num(pick(src, ['stock', 'quantity', 'qty']) ?? pick(product, ['stock', 'quantity', 'qty'])),
    unit: unitName(src.unit || src.unit_name ? src : product),
    price: num(
      pick(src, ['selling_price', 'price', 'sale_price']) ??
        pick(product, ['selling_price', 'price', 'sale_price'])
    ),
    lowAt: num(
      pick(src, ['low_stock_alert', 'alert_quantity']) ??
        pick(product, ['low_stock_alert', 'alert_quantity']),
      5
    ),
  };
};

// A product with nested variants becomes one row per variant.
export const productToStockRows = (product) => {
  const variants = product?.variants ?? product?.product_variants;
  if (Array.isArray(variants) && variants.length) return variants.map((v) => toRow(product, v));
  return [toRow(product)];
};

export const mapStockItems = (res) => toList(res).flatMap(productToStockRows);

// Catalog for the sale screen: { id, name, price, qty }. `qty` is kept (not just used to
// filter) so a zero-stock item still shows up for billing instead of silently disappearing —
// the row just gets an "Out of stock" label (see NewSaleScreen.js).
export const mapCatalog = (res) =>
  mapStockItems(res).map(({ id, name, price, qty }) => ({ id, name, price, qty }));

// GET /stockLedger — one row per stock movement: { id, date, productName, branchName, type, qty, reference }.
export const toLedgerRows = (res) =>
  toList(res).map((r, i) => ({
    id: String(r.id ?? i),
    date: String(pick(r, ['date', 'created_at']) ?? '').slice(0, 10),
    productName: String(pick(r, ['product_name', 'item_name']) ?? r.product?.name ?? r.product?.item_name ?? ''),
    branchName: String(pick(r, ['branch_name']) ?? r.branch?.name ?? ''),
    type: String(pick(r, ['type', 'movement_type']) ?? '').toLowerCase() === 'out' ? 'out' : 'in',
    qty: num(pick(r, ['qty', 'quantity'])),
    reference: String(pick(r, ['reference', 'reference_no', 'remarks']) ?? ''),
  }));

// GET /categories, reshaped for the Add stock item form's picker — the real /products/store
// call needs a numeric category_id (confirmed by a live GET /products response), not a name.
export const toCategoryOptions = (res) =>
  toList(res).map((c) => ({
    value: String(c.id),
    label: String(pick(c, ['category_name', 'name']) ?? ''),
  }));

// Stock form -> POST /products/store payload. Field names confirmed from a live GET /products
// response plus two live 422s: variant_name/sku/minimum_stock/is_weightable are top-level
// fields (not nested under a `variants` array), and each must itself be an array — one entry
// per variant row, parallel across the four fields. This quick-add form only ever submits one.
// `qty`/`price` have no home on this endpoint (the sample response carries neither on the
// product nor the variant) — services.js sends them on afterwards via the confirmed
// Variant Stock Update endpoint instead.
export const toProductPayload = ({ name, categoryId, lowAt }) => ({
  item_name: name,
  category_id: categoryId,
  with_tax: 'N',
  tax: '0',
  with_loyalty: 'N',
  status: 'Y',
  variant_name: [name],
  sku: [String(Date.now())],
  minimum_stock: [num(lowAt, 5)],
  is_weightable: ['N'],
});
