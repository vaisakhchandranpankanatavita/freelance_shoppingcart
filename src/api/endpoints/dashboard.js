import { apiRequest } from '../client';

export const getDashboardAnalytics = (params) =>
  apiRequest('/dashboard', { method: 'POST', body: params });
