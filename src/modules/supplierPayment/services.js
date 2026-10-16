import {
  createSupplierPayment,
  deleteSupplierPayment,
  getSupplierPayment as apiGetPayment,
  getSupplierPaymentHistory,
  getSupplierPayments as apiGetPayments,
} from '../../api';
import { toPaymentDetail, toPaymentPayload, toPaymentRows } from './mappers';

// Tracker rows 53-57 ("Supplier Payments" section) are still Pending on the backend — the
// endpoints above are guesses, not confirmed routes. Flip this once the real routes ship.
export const BACKEND_READY = false;

export const getPayments = async () => toPaymentRows(await apiGetPayments());

export const getPaymentHistory = async (supplierId) => toPaymentRows(await getSupplierPaymentHistory(supplierId));

export const getPaymentDetail = async (id) => toPaymentDetail(await apiGetPayment(id));

export const addPayment = async (form) => createSupplierPayment(toPaymentPayload(form));

export const removePayment = (id) => deleteSupplierPayment(id);
