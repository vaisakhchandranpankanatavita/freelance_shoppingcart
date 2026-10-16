// Response-shape mapping for the (not-yet-built) supplier payment API. No docs, no backend yet —
// field names are best guesses, same convention as src/modules/purchase/mappers.js.

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
  return inner?.payment ?? inner?.data ?? inner;
};

const toRow = (p) => ({
  id: String(pick(p, ['id']) ?? ''),
  supplier: String(pick(p, ['supplier_name']) ?? p.supplier?.name ?? ''),
  date: String(pick(p, ['payment_date', 'date', 'created_at']) ?? '').slice(0, 10),
  amount: num(pick(p, ['amount', 'paid_amount'])),
  mode: String(pick(p, ['payment_mode', 'mode']) ?? 'Cash'),
  reference: String(pick(p, ['reference', 'reference_no', 'note']) ?? ''),
});

export const toPaymentRows = (res) => toList(res, 'payments').map(toRow);

export const toPaymentDetail = (res) => toRow(itemOf(res));

// Payment form -> POST /supplierPayment/store payload.
export const toPaymentPayload = ({ supplierId, amount, date, mode, reference }) => ({
  supplier_id: supplierId,
  amount: num(amount),
  payment_date: date,
  payment_mode: mode,
  reference,
});
