import {
  createBill,
  getBill,
  getBills,
  productSearch,
  refundBill,
  searchCustomer as apiSearchCustomer,
  searchProductByBarcode,
  searchProducts,
  getProducts,
  getShop,
  updateBill,
} from '../../api';
import { itemOf } from '../manage/entities';
import { mapCatalog } from '../stock/mappers';
import { toBillDetail, toBillPayload, toBillRows } from './mappers';

export const getSales = async () => toBillRows(await getBills());

export const getSale = async (id) => toBillDetail(await getBill(id));

export const getCatalog = async () => {
  try {
    return mapCatalog(await searchProducts({ search: '' }));
  } catch (e) {
    return mapCatalog(await getProducts());
  }
};

// Row 65: GET /product-search — used while typing a product name at the till.
export const searchCatalog = async (search) => mapCatalog(await productSearch(search));

// Row 66: GET /search-product-by-barcode — used after a barcode scan/entry.
export const findByBarcode = async (barcode) => mapCatalog(await searchProductByBarcode(barcode));

// Row 64: POST /searchCustomer — looks up a returning customer by phone to prefill the bill.
export const searchCustomer = async (phone) => {
  const res = await apiSearchCustomer(phone);
  const c = res?.data ?? res;
  if (!c || (Array.isArray(c) && !c.length)) return null;
  const customer = Array.isArray(c) ? c[0] : c;
  return {
    name: String(customer.name ?? customer.customer_name ?? ''),
    phone: String(customer.phone ?? customer.customer_phone ?? ''),
  };
};

export const addSale = async (payload) => toBillDetail(await createBill(toBillPayload(payload)));

export const editSale = async (id, payload) => toBillDetail(await updateBill(id, toBillPayload(payload)));

export const refundSale = (id, payload) => refundBill({ ...payload, id });

// The store's own name/address/GSTIN for the receipt header, from Store settings. Missing fields
// are simply left off the receipt rather than filled with a placeholder.
export const getStoreProfile = async () => {
  const s = itemOf(await getShop()) ?? {};
  return {
    name: String(s.name ?? s.shop_name ?? s.store_name ?? ''),
    address: String(s.address ?? ''),
    phone: String(s.phone ?? ''),
    gstin: String(s.gst_number ?? s.gstin ?? ''),
  };
};
