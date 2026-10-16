import { apiRequest } from '../client';

// ── Confirmed (tracker rows 64-66) ──────────────────────────────────────────────────────
export const searchCustomer = (phone) => apiRequest('/searchCustomer', { method: 'POST', body: { phone } });

export const productSearch = (search) => apiRequest('/product-search', { query: { search } });

export const searchProductByBarcode = (barcode) =>
  apiRequest('/search-product-by-barcode', { query: { barcode } });

// ── Confirmed (tracker rows 67-72) ──────────────────────────────────────────────────────
export const getBills = (query) => apiRequest('/billHistory', { query });

export const getBill = (id) => apiRequest(`/bill/${id}/edit`);

export const createBill = (payload) => apiRequest('/bill/store', { method: 'POST', body: payload });

export const updateBill = (id, payload) =>
  apiRequest('/bill/update', { method: 'POST', body: { ...payload, id } });

export const printBill = (id) => apiRequest(`/bill/print-bill/${id}`);

export const refundBill = (payload) =>
  apiRequest('/bill/saleRefund', { method: 'POST', body: payload });
