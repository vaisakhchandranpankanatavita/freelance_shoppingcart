import { apiRequest } from '../client';

export const getSupplierTypes = () => apiRequest('/supplierTypes');

export const getSuppliers = () => apiRequest('/suppliers');

export const createSupplier = (payload) =>
  apiRequest('/suppliers/store', { method: 'POST', body: payload });

export const getSupplier = (id) => apiRequest(`/suppliers/${id}/edit`);

// The update URL carries no id: send it in the payload.
export const updateSupplier = (id, payload) =>
  apiRequest('/suppliers/update', { method: 'POST', body: { ...payload, id } });

export const deleteSupplier = (id) => apiRequest(`/suppliers/${id}`, { method: 'DELETE' });
