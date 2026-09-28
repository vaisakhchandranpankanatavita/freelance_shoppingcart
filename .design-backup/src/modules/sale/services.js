import { sales, catalog } from './data';

let list = [...sales];

export const getSales = async () => {
  await new Promise((r) => setTimeout(r, 200));
  return list;
};

export const getCatalog = async () => {
  await new Promise((r) => setTimeout(r, 100));
  return catalog;
};

export const addSale = async (payload) => {
  await new Promise((r) => setTimeout(r, 200));
  const next = { id: `INV-${2000 + list.length + 1}`, date: new Date().toISOString().slice(0, 10), ...payload };
  list = [next, ...list];
  return next;
};
