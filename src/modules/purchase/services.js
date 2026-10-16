import {
  createPurchase,
  deletePurchase,
  getBranches,
  getCategories,
  getProducts,
  getPurchase as apiGetPurchase,
  getPurchaseFormData,
  getPurchases as apiGetPurchases,
  getSuppliers,
  updatePurchase as apiUpdatePurchase,
} from '../../api';
import {
  toFormOptions,
  toPurchaseBranchGstinMap,
  toPurchaseBranchOptions,
  toPurchaseCategoryOptions,
  toPurchaseEditForm,
  toPurchasePayload,
  toPurchaseProductOptions,
  toPurchaseRows,
  toPurchaseSupplierDetailMap,
} from './mappers';

export const getPurchases = async () => toPurchaseRows(await apiGetPurchases());

// /productPurchase/create's `products` AND `branches` keys are unconfirmed (see
// src/api/README.md); when either comes back empty, fall back to its own confirmed
// standalone endpoint so the form isn't stuck empty/missing a required field (a live 422
// showed branch_id still required even with a supplier/category/dates filled in — the create
// form simply never surfaced a branch to pick). Categories aren't part of that create-form
// response at all, so they're always fetched separately.
export const getPurchaseForm = async () => {
  const [formRes, categories] = await Promise.all([
    getPurchaseFormData(),
    getCategories().then(toPurchaseCategoryOptions).catch(() => []),
  ]);
  const form = toFormOptions(formRes);
  const [products, branches] = await Promise.all([
    form.products.length ? form.products : getProducts().then(toPurchaseProductOptions).catch(() => []),
    form.branches.length ? form.branches : getBranches().then(toPurchaseBranchOptions).catch(() => []),
  ]);
  return { ...form, products, branches, categories };
};

export const getPurchaseEditForm = async (id) => toPurchaseEditForm(await apiGetPurchase(id));

const SUPPLIER_FIELD_LABELS = { name: 'name', phone: 'phone number', address: 'address', gst_no: 'GST number' };

// Fetches the chosen supplier's full record and the branch's GSTIN — POST /productPurchase/store
// needs the supplier's name/phone/address/gst_no inline (not just its id, see toPurchasePayload),
// and the user asked that the branch's GSTIN ride along too. Both come from their plain list
// endpoints (GET /suppliers, GET /branch) rather than the per-id `.../{id}/edit` endpoints: the
// `/edit` endpoints' response shapes were never confirmed and came back without usable
// gst_number/gstin fields, even for records that do have one set — see toPurchaseBranchGstinMap
// and toPurchaseSupplierDetailMap. This also means saving a purchase order (create or edit)
// never calls any `.../edit` endpoint.
const buildPayload = async (form) => {
  const [supplierDetailMap, branchGstinMap] = await Promise.all([
    getSuppliers().then(toPurchaseSupplierDetailMap),
    getBranches().then(toPurchaseBranchGstinMap),
  ]);
  const supplierDetail = supplierDetailMap[String(form.supplierId)] ?? { name: '', phone: '', address: '', gst_no: '' };
  const branchGstin = branchGstinMap[String(form.branchId)] ?? '';

  // A live 422 showed the backend rejecting the whole order over a blank supplier.gst_no —
  // the chosen supplier's own record simply has no GST number on file. Catching that here,
  // before a network round trip, in the same `{ message, errors }` shape ApiError uses, lets
  // AddPurchaseScreen surface it on the Supplier field exactly like it would a server 422.
  const missingKeys = Object.entries(supplierDetail).filter(([, v]) => !v).map(([k]) => k);
  if (missingKeys.length) {
    const labels = missingKeys.map((k) => SUPPLIER_FIELD_LABELS[k] ?? k).join(', ');
    const err = new Error(`This supplier is missing its ${labels} — add it under Manage → Suppliers, then try again.`);
    err.errors = Object.fromEntries(missingKeys.map((k) => [`supplier.${k}`, ['required']]));
    throw err;
  }

  return toPurchasePayload({ ...form, supplierDetail, branchGstin });
};

export const addPurchase = async (form) => createPurchase(await buildPayload(form));

export const editPurchase = async (id, form) => apiUpdatePurchase(id, await buildPayload(form));

export const removePurchase = (id) => deletePurchase(id);
