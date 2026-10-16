import { apiRequest } from '../client';

// Movements for one or all products, filterable by branch/product/date range.
export const getStockLedger = ({ branchId, productId, from, to } = {}) =>
  apiRequest('/stockLedger', {
    query: { branch_id: branchId, product_id: productId, from, to },
  });
