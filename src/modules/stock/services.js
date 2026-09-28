import { getProducts, createProduct } from '../../api';
import { mapStockItems, productToStockRows, toItem, toProductPayload } from './mappers';

// Stock is backed by the products API. Response/payload field names are
// guesses — see ./mappers.js.

export const getStockItems = async () => mapStockItems(await getProducts());

export const addStockItem = async (payload) => {
  const created = toItem(await createProduct(toProductPayload(payload)));
  // If the API echoes the product back, trust it; otherwise fall back to the form values.
  if (created && typeof created === 'object' && created.id != null) {
    return { ...payload, ...productToStockRows(created)[0] };
  }
  return { id: String(created?.id ?? Date.now()), ...payload };
};
