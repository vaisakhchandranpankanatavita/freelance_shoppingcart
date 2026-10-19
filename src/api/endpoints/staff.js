import { apiRequest } from '../client';

export const getStaff = () => apiRequest('/staff');

export const createStaff = (payload) =>
  apiRequest('/staff/store', { method: 'POST', body: payload });

export const getStaffMember = (id) => apiRequest(`/staff/${id}/edit`);

export const updateStaff = (id, payload) =>
  apiRequest(`/staff/update/${id}`, { method: 'POST', body: payload });

export const deleteStaff = (id) => apiRequest(`/staff/${id}`, { method: 'DELETE' });
