import { apiRequest } from '../client';

// NOT confirmed with backend yet (tracker rows 41-46: backend status Pending, no URL given).
// Paths below follow this app's established convention (same shape as /productPurchase). Fix
// them here — and only here — once the backend team ships the real routes.
export const getPurchaseRequestFormData = () => apiRequest('/purchaseRequest/create');

export const getPurchaseRequests = (query) => apiRequest('/purchaseRequest', { query });

export const createPurchaseRequest = (payload) =>
  apiRequest('/purchaseRequest/store', { method: 'POST', body: payload });

export const getPurchaseRequest = (id) => apiRequest(`/purchaseRequest/${id}/edit`);

export const updatePurchaseRequest = (id, payload) =>
  apiRequest('/purchaseRequest/update', { method: 'POST', body: { ...payload, id } });

export const deletePurchaseRequest = (id) => apiRequest(`/purchaseRequest/${id}`, { method: 'DELETE' });

// "Purchase Request to purchase" (row 46) — converts an approved request into a real purchase.
export const convertPurchaseRequest = (id) => apiRequest(`/purchaseRequest/convert/${id}`);
