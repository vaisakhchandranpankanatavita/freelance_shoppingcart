import { apiRequest } from '../client';

// Sales analytics endpoints (tracker rows 92-97). All POST — the backend expects
// fromdate/todate/branch_id in the body, same convention as the report endpoints.
const analyticsBody = ({ branchId, from, to } = {}) => ({
  branch_id: branchId,
  fromdate: from,
  todate: to,
});

export const getBillStatistics = (params) =>
  apiRequest('/billStatistics', { method: 'POST', body: analyticsBody(params) });

export const getSalePeakHours = (params) =>
  apiRequest('/salePeakHours', { method: 'POST', body: analyticsBody(params) });

export const getSaleSummary = (params) =>
  apiRequest('/saleSummaryAnalytics', { method: 'POST', body: analyticsBody(params) });

export const getCategorySales = (params) =>
  apiRequest('/categorySales', { method: 'POST', body: analyticsBody(params) });

export const getSalesRevenue = (params) =>
  apiRequest('/revenue', { method: 'POST', body: analyticsBody(params) });
