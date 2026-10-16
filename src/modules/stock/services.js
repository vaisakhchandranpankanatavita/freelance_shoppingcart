import { getProducts, createProduct, getCategories, getStockLedger, searchProducts, updateVariantStock } from '../../api';
import { mapStockItems, productToStockRows, toCategoryOptions, toItem, toLedgerRows, toProductPayload } from './mappers';

// Stock is backed by the products API — see ./mappers.js for the confirmed field names.

export const getStockItems = async () => mapStockItems(await getProducts());

// GET /categories, for the Add stock item form's category picker (category_id is a real FK).
export const getStockCategories = async () => toCategoryOptions(await getCategories());

// GET /get-products with category/branch/barcode filters (row 34 of the API tracker) — backend
// status is still Pending there, so the filter UI is gated until this flips to true.
export const ADVANCED_SEARCH_READY = false;

export const searchStockItems = async ({ categoryId, branchId, search, barcode }) =>
  mapStockItems(await searchProducts({ categoryId, branchId, search, barcode }));

export const getLedger = async (filters) => toLedgerRows(await getStockLedger(filters));

export const addStockItem = async (payload) => {
  const created = toItem(await createProduct(toProductPayload(payload)));
  const variantId = created?.variants?.[0]?.id;

  // Qty/price have no place in /products/store's confirmed shape (see mappers.js), so they're
  // set afterwards via the Variant Stock Update endpoint. Best-effort: the catalog entry above
  // already saved, so a failure here shouldn't be reported as the whole "add item" failing.
  if (variantId != null) {
    try {
      await updateVariantStock({
        variant_id: variantId,
        quantity: Number(payload.qty) || 0,
        selling_price: Number(payload.price) || 0,
      });
    } catch (e) {
      // Swallowed — see comment above.
    }
  }

  // If the API echoes the product back, trust it; otherwise fall back to the form values.
  if (created && typeof created === 'object' && created.id != null) {
    return { ...payload, ...productToStockRows(created)[0] };
  }
  return { id: String(created?.id ?? Date.now()), ...payload };
};
