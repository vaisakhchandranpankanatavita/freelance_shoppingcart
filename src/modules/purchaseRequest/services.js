import {
  convertPurchaseRequest,
  createPurchaseRequest,
  deletePurchaseRequest,
  getPurchaseRequest as apiGetRequest,
  getPurchaseRequestFormData,
  getPurchaseRequests as apiGetRequests,
  updatePurchaseRequest as apiUpdateRequest,
} from '../../api';
import { toFormOptions, toRequestEditForm, toRequestPayload, toRequestRows } from './mappers';

// Tracker rows 41-46 ("Purchases Requests" section) are still Pending on the backend — the
// endpoints above are guesses, not confirmed routes. Flip this once the real routes ship.
export const BACKEND_READY = false;

export const getRequests = async () => toRequestRows(await apiGetRequests());

export const getRequestForm = async () => toFormOptions(await getPurchaseRequestFormData());

export const getRequestEditForm = async (id) => toRequestEditForm(await apiGetRequest(id));

export const addRequest = async (form) => createPurchaseRequest(toRequestPayload(form));

export const editRequest = async (id, form) => apiUpdateRequest(id, toRequestPayload(form));

export const removeRequest = (id) => deletePurchaseRequest(id);

export const convertRequest = (id) => convertPurchaseRequest(id);
