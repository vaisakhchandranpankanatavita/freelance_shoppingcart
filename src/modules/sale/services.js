import { searchProducts, getProducts } from '../../api';
import { mapCatalog } from '../stock/mappers';
import { sales } from './data';

// NOTE: the backend has NO sales endpoints yet, so getSales/addSale stay
// in-memory dummies. Only the product catalog comes from the API.
let list = [...sales];

export const getSales = async () => {
  await new Promise((r) => setTimeout(r, 200));
  return list;
};

export const getCatalog = async () => {
  try {
    return mapCatalog(await searchProducts({ search: '' }));
  } catch (e) {
    return mapCatalog(await getProducts());
  }
};

export const addSale = async (payload) => {
  await new Promise((r) => setTimeout(r, 200));
  const next = { id: `INV-${2000 + list.length + 1}`, date: new Date().toISOString().slice(0, 10), ...payload };
  list = [next, ...list];
  return next;
};
