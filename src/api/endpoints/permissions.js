import { apiRequest } from '../client';

export const getPermissions = () => apiRequest('/permission');

export const createPermission = (payload) =>
  apiRequest('/permission/store', { method: 'POST', body: payload });

export const getPermission = (id) => apiRequest(`/permission/${id}/edit`);

export const updatePermission = (id, payload) =>
  apiRequest('/permission/update', { method: 'POST', body: { ...payload, id } });

export const deletePermission = (id) => apiRequest(`/permission/${id}`, { method: 'DELETE' });
