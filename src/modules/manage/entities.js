import {
  createBranch,
  createBrand,
  createCategory,
  createSupplier,
  deleteBranch,
  deleteBrand,
  deleteCategory,
  deleteSupplier,
  getBranch,
  getBranches,
  getBrand,
  getBrands,
  getCategories,
  getCategory,
  getCities,
  getCountries,
  getShop,
  getStates,
  getSupplier,
  getSupplierTypes,
  getSuppliers,
  toggleBranchStatus,
  toggleBrandStatus,
  toggleCategoryStatus,
  updateBranch,
  updateBrand,
  updateCategory,
  updateShop,
  updateSupplier,
} from '../../api';

// Every "manage" screen (store settings, branches, categories, brands, suppliers) is one
// generic list/form pair driven by the config below. Response and payload FIELD NAMES are
// best guesses for the Laravel API — fix them here only (same convention as stock/mappers.js).

// ── response shapes ────────────────────────────────────────────────────────────────────
// [..] | { data: [..] } | { data: { data: [..] } } | { data: { branches: [..] } } | …
export const listOf = (res) => {
  const inner = res?.data ?? res;
  if (Array.isArray(inner)) return inner;
  if (Array.isArray(inner?.data)) return inner.data;
  return Object.values(inner ?? {}).find(Array.isArray) ?? [];
};

// {..} | { data: {..} } | { data: { branch: {..} } }
export const itemOf = (res) => {
  const inner = res?.data ?? res;
  if (inner?.id != null || !inner || typeof inner !== 'object') return inner;
  return Object.values(inner).find((v) => v && typeof v === 'object' && !Array.isArray(v)) ?? inner;
};

export const isActive = (item) => {
  const v = item?.status ?? item?.is_active;
  return v === 1 || v === true || String(v).toLowerCase() === '1' || String(v).toLowerCase() === 'active';
};

// ── select options ─────────────────────────────────────────────────────────────────────
// `dep` = form field whose value the lookup is loaded for (states of a country…).
export const LOOKUPS = {
  countries: { load: () => getCountries() },
  states: { dep: 'country_id', load: (countryId) => getStates(countryId) },
  cities: { dep: 'state_id', load: (stateId) => getCities(stateId) },
  supplierTypes: { load: () => getSupplierTypes() },
};

export const toOptions = (res) =>
  listOf(res).map((o) => ({ value: o.id, label: String(o.name ?? o.type ?? o.title ?? o.id) }));

// ── fields ─────────────────────────────────────────────────────────────────────────────
const name = (label, placeholder) => ({
  key: 'name', label, icon: 'pricetag-outline', placeholder, autoCapitalize: 'words', required: true,
});
const phone = { key: 'phone', label: 'Phone', icon: 'call-outline', placeholder: '10-digit number', keyboardType: 'phone-pad' };
const email = { key: 'email', label: 'Email', icon: 'at-outline', placeholder: 'name@example.com', keyboardType: 'email-address' };
const address = { key: 'address', label: 'Address', icon: 'storefront-outline', placeholder: 'Street, area', autoCapitalize: 'sentences' };
const gst = { key: 'gst_number', label: 'GST number', icon: 'document-text-outline', placeholder: 'Optional', autoCapitalize: 'characters' };
const description = { key: 'description', label: 'Description', icon: 'document-text-outline', placeholder: 'Optional', autoCapitalize: 'sentences' };
const place = [
  { key: 'country_id', label: 'Country', icon: 'business-outline', type: 'select', lookup: 'countries' },
  { key: 'state_id', label: 'State', icon: 'business-outline', type: 'select', lookup: 'states' },
  { key: 'city_id', label: 'City', icon: 'business-outline', type: 'select', lookup: 'cities' },
  { key: 'pincode', label: 'Pincode', icon: 'keypad-outline', placeholder: '6 digits', keyboardType: 'number-pad', maxLength: 6 },
];

export const ENTITIES = {
  shop: {
    title: 'Store settings',
    singular: 'Store',
    icon: 'settings-outline',
    singleton: true,
    api: { get: getShop, save: updateShop },
    fields: [name('Store name', 'e.g. Fresh Mart'), phone, email, address, gst, ...place],
  },
  branch: {
    title: 'Branches',
    singular: 'Branch',
    icon: 'business-outline',
    api: {
      list: getBranches, get: getBranch, create: createBranch, update: updateBranch,
      toggle: toggleBranchStatus, remove: deleteBranch,
    },
    subtitle: (b) => [b.address, b.phone].filter(Boolean).join(' • '),
    fields: [name('Branch name', 'e.g. Main Street'), phone, email, address, ...place],
  },
  category: {
    title: 'Categories',
    singular: 'Category',
    icon: 'albums-outline',
    api: {
      list: getCategories, get: getCategory, create: createCategory, update: updateCategory,
      toggle: toggleCategoryStatus, remove: deleteCategory,
    },
    subtitle: (c) => c.description ?? '',
    fields: [name('Category name', 'e.g. Grains'), description],
  },
  brand: {
    title: 'Brands',
    singular: 'Brand',
    icon: 'ribbon-outline',
    api: {
      list: getBrands, get: getBrand, create: createBrand, update: updateBrand,
      toggle: toggleBrandStatus, remove: deleteBrand,
    },
    subtitle: (b) => b.description ?? '',
    fields: [name('Brand name', 'e.g. Tata'), description],
  },
  supplier: {
    title: 'Suppliers',
    singular: 'Supplier',
    icon: 'people-outline',
    api: { list: getSuppliers, get: getSupplier, create: createSupplier, update: updateSupplier, remove: deleteSupplier },
    subtitle: (s) => [s.phone, s.email].filter(Boolean).join(' • '),
    fields: [
      { key: 'supplier_type_id', label: 'Supplier type', icon: 'options-outline', type: 'select', lookup: 'supplierTypes', required: true },
      name('Supplier name', 'e.g. Sri Traders'),
      phone,
      email,
      address,
      gst,
    ],
  },
};
