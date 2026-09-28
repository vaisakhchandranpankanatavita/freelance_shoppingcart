import { apiRequest } from '../client';

export const getProducts = (query) => apiRequest('/products', { query });

export const createProduct = (payload) =>
  apiRequest('/products/store', { method: 'POST', body: payload });

export const getProduct = (id) => apiRequest(`/products/${id}/edit`);

export const updateProduct = (id, payload) =>
  apiRequest(`/products/update/${id}`, { method: 'POST', body: payload });

export const deleteProduct = (id) => apiRequest(`/products/destroy/${id}`, { method: 'POST' });

export const getBranchStock = (productId, branchId) =>
  apiRequest(`/products/stockBranch/${productId}/${branchId}`);

export const updateVariantStock = (payload) =>
  apiRequest('/products/stockEntry', { method: 'POST', body: payload });

export const searchProducts = ({ categoryId, branchId, search, barcode } = {}) =>
  apiRequest('/get-products', {
    query: { category_id: categoryId, branch_id: branchId, search, barcode },
  });
