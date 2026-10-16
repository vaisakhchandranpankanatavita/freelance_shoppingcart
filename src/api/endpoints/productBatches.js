import { apiRequest } from '../client';

// Stock details: selling price / discount per batch of a product.
export const getProductBatches = (query) => apiRequest('/productBatch', { query });

export const createProductBatch = (payload) =>
  apiRequest('/productBatch/store', { method: 'POST', body: payload });

export const getProductBatch = (id) => apiRequest(`/productBatch/${id}/edit`);

// The update URL carries no id: send it in the payload (same convention as suppliers/categories).
export const updateProductBatch = (id, payload) =>
  apiRequest('/productBatch/update', { method: 'POST', body: { ...payload, id } });

export const deleteProductBatch = (id) => apiRequest(`/productBatch/${id}`, { method: 'DELETE' });

export const getProductBatchBarcode = (id) => apiRequest(`/productBatch/barcode/${id}`);
