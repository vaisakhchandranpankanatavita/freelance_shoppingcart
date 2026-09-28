import { stockItems } from './data';

// Service layer — swap the bodies with fetch() calls when your Node.js API is ready.
let items = [...stockItems];

export const getStockItems = async () => {
  await new Promise((r) => setTimeout(r, 200));
  return items;
};

export const addStockItem = async (payload) => {
  await new Promise((r) => setTimeout(r, 200));
  const newItem = { id: `SKU-${String(items.length + 1).padStart(3, '0')}`, ...payload };
  items = [newItem, ...items];
  return newItem;
};
