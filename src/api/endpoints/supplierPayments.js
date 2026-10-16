import { apiRequest } from '../client';

// NOT confirmed with backend yet (tracker rows 53-57: backend status Pending, no URL given).
// Only list/create/detail/delete are in the tracker — no update endpoint was listed, so payments
// are treated as an immutable ledger (view + delete only) until the backend says otherwise.
export const getSupplierPayments = (query) => apiRequest('/supplierPayment', { query });

export const createSupplierPayment = (payload) =>
  apiRequest('/supplierPayment/store', { method: 'POST', body: payload });

export const getSupplierPaymentHistory = (supplierId) =>
  apiRequest('/supplierPayment/history', { query: { supplier_id: supplierId } });

export const getSupplierPayment = (id) => apiRequest(`/supplierPayment/${id}/edit`);

export const deleteSupplierPayment = (id) => apiRequest(`/supplierPayment/${id}`, { method: 'DELETE' });
