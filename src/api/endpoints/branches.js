import { apiRequest } from '../client';

export const getBranches = () => apiRequest('/branch');

export const createBranch = (payload) =>
  apiRequest('/branch/store', { method: 'POST', body: payload });

export const getBranch = (id) => apiRequest(`/branch/${id}/edit`);

export const updateBranch = (id, payload) =>
  apiRequest(`/branch/update/${id}`, { method: 'POST', body: payload });

export const toggleBranchStatus = (id) => apiRequest(`/branch/statusChange/${id}`);

export const deleteBranch = (id) => apiRequest(`/branch/${id}`, { method: 'DELETE' });
