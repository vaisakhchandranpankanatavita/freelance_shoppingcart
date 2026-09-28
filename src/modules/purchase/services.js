import { purchases } from './data';

// NOTE: the backend has NO purchase endpoints yet — these stay in-memory
// dummies until the API exposes them.

let list = [...purchases];

export const getPurchases = async () => {
  await new Promise((r) => setTimeout(r, 200));
  return list;
};

export const addPurchase = async (payload) => {
  await new Promise((r) => setTimeout(r, 200));
  const next = { id: `PO-${1000 + list.length + 1}`, status: 'Pending', ...payload };
  list = [next, ...list];
  return next;
};
