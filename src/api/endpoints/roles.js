import { apiRequest } from '../client';

export const getRoles = () => apiRequest('/roles');

export const createRole = (payload) =>
  apiRequest('/roles/store', { method: 'POST', body: payload });

export const getRole = (id) => apiRequest(`/roles/${id}/edit`);

export const updateRole = (id, payload) =>
  apiRequest('/roles/update', { method: 'POST', body: { ...payload, id } });

export const deleteRole = (id) => apiRequest(`/roles/${id}`, { method: 'DELETE' });
