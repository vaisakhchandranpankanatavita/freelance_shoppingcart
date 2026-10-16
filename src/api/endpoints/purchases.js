import { apiRequest } from '../client';

// Suppliers/products/branches needed to build the "new purchase" form.
export const getPurchaseFormData = () => apiRequest('/productPurchase/create');

export const getPurchases = (query) => apiRequest('/productPurchase', { query });

export const createPurchase = (payload) =>
  apiRequest('/productPurchase/store', { method: 'POST', body: payload });

export const getPurchase = (id) => apiRequest(`/productPurchase/${id}/edit`);

// The update URL carries no id: send it in the payload (same convention as suppliers/categories).
export const updatePurchase = (id, payload) =>
  apiRequest('/productPurchase/update', { method: 'POST', body: { ...payload, id } });

export const deletePurchase = (id) =>
  apiRequest(`/productPurchase/delete/${id}`, { method: 'POST' });
