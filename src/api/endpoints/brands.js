import { apiRequest } from '../client';

const BRANDS_PATH = '/categories'; // TODO: spec lists category URLs for brands — confirm real path (likely /brands)

export const getBrands = () => apiRequest(BRANDS_PATH);

export const createBrand = (payload) =>
  apiRequest(`${BRANDS_PATH}/store`, { method: 'POST', body: payload });

export const getBrand = (id) => apiRequest(`${BRANDS_PATH}/${id}/edit`);

export const updateBrand = (id, payload) =>
  apiRequest(`${BRANDS_PATH}/update/${id}`, { method: 'POST', body: payload });

export const toggleBrandStatus = (id) => apiRequest(`${BRANDS_PATH}/statusChange/${id}`);

export const deleteBrand = (id) => apiRequest(`${BRANDS_PATH}/${id}`, { method: 'DELETE' });
