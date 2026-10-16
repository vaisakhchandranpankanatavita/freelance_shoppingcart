import { apiRequest } from '../client';

const CATEGORY_PATH = '/expense/category';
const EXPENSE_PATH = '/expense';

export const getExpenseCategories = () => apiRequest(CATEGORY_PATH);

// Not in the tracker, but every other module here exposes its create-form dropdown data at
// GET /{resource}/create (confirmed for purchases — see getPurchaseFormData). Tried as the first
// source for `category_type`'s real enum values (see manage/entities.js's expenseCategoryTypes
// lookup); if this 404s, that lookup falls back to a guessed list instead.
export const getExpenseCategoryFormData = () => apiRequest(`${CATEGORY_PATH}/create`);

export const createExpenseCategory = (payload) =>
  apiRequest(`${CATEGORY_PATH}/store`, { method: 'POST', body: payload });

export const getExpenseCategory = (id) => apiRequest(`${CATEGORY_PATH}/${id}/edit`);

// The update URL carries no id: send it in the payload (same convention as purchases/suppliers).
export const updateExpenseCategory = (id, payload) =>
  apiRequest(`${CATEGORY_PATH}/update`, { method: 'POST', body: { ...payload, id } });

export const deleteExpenseCategory = (id) => apiRequest(`${CATEGORY_PATH}/${id}`, { method: 'DELETE' });

export const getExpenses = (query) => apiRequest(EXPENSE_PATH, { query });

export const createExpense = (payload) =>
  apiRequest(`${EXPENSE_PATH}/store`, { method: 'POST', body: payload });

export const getExpense = (id) => apiRequest(`${EXPENSE_PATH}/${id}/edit`);

export const updateExpense = (id, payload) =>
  apiRequest(`${EXPENSE_PATH}/update`, { method: 'POST', body: { ...payload, id } });

export const deleteExpense = (id) => apiRequest(`${EXPENSE_PATH}/delete/${id}`, { method: 'DELETE' });

export const downloadExpenseBills = (id) => apiRequest(`${EXPENSE_PATH}/${id}/download-bills`);
