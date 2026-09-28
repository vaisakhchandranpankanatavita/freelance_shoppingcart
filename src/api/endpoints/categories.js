import { apiRequest } from '../client';

export const getCategories = () => apiRequest('/categories');

export const createCategory = (payload) =>
  apiRequest('/categories/store', { method: 'POST', body: payload });

export const getCategory = (id) => apiRequest(`/categories/${id}/edit`);

export const updateCategory = (id, payload) =>
  apiRequest(`/categories/update/${id}`, { method: 'POST', body: payload });

export const toggleCategoryStatus = (id) => apiRequest(`/categories/statusChange/${id}`);

export const deleteCategory = (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' });
