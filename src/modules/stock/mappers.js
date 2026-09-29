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

const categoryName = (p) =>
  (typeof p.category === 'string' ? p.category : p.category?.name) ??
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
    name: variantName ? `${product.name} - ${variantName}` : String(product.name ?? ''),
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

// Catalog for the sale screen: { id, name, price }
export const mapCatalog = (res) =>
  mapStockItems(res).map(({ id, name, price }) => ({ id, name, price }));

// Stock form -> createProduct payload. FIELD NAMES NEED BACKEND CONFIRMATION
// (the API probably expects category_id / unit_id / branch_id rather than names).
export const toProductPayload = ({ name, category, qty, unit, price, lowAt }) => ({
  name,
  category_name: category,
  selling_price: num(price),
  price: num(price),
  quantity: num(qty),
  unit,
  low_stock_alert: num(lowAt, 5),
});
