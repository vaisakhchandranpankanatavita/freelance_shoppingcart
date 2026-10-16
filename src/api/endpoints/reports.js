import { apiRequest } from '../client';

// Read-only report endpoints (tracker rows 84-91). `fromdate`/`todate` confirmed by a live 422
// on /salesItemReport ("The fromdate field is required. (and 1 more error)") — and required
// outright, with no fallback to "all time" when omitted, unlike stockLedger.js's `from`/`to`.
// `branch_id` is still an unconfirmed guess; unused keys are dropped by apiRequest's query
// builder, so passing it is harmless if a given report ignores it.
const reportQuery = ({ branchId, from, to } = {}) => ({ branch_id: branchId, fromdate: from, todate: to });

export const getCollectionReport = (params) => apiRequest('/collectionReport', { query: reportQuery(params) });

export const getIncomeReport = (params) => apiRequest('/incomeReport', { query: reportQuery(params) });

export const getSalesItemReport = (params) => apiRequest('/salesItemReport', { query: reportQuery(params) });

export const getSalesCategoryReport = (params) => apiRequest('/salesCategoryReport', { query: reportQuery(params) });

export const getInStockReport = (params) => apiRequest('/inStockReport', { query: reportQuery(params) });

export const getOutOfStockReport = (params) => apiRequest('/outOfStockReport', { query: reportQuery(params) });

export const getRefundBillList = (params) => apiRequest('/refundBillList', { query: reportQuery(params) });

export const getReturnedItems = (params) => apiRequest('/returnedItems', { query: reportQuery(params) });
