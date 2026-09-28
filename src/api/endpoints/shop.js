import { apiRequest } from '../client';

export const getShop = () => apiRequest('/shop');

export const updateShop = (payload) => apiRequest('/shop/store', { method: 'POST', body: payload });
