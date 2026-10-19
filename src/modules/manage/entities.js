import {
  createBranch,
  createBrand,
  createCategory,
  createExpense,
  createExpenseCategory,
  createPermission,
  createProductBatch,
  createRole,
  createStaff,
  createSupplier,
  deletePermission,
  deleteRole,
  deleteStaff,
  getPermission,
  getPermissions,
  getRole,
  getRoles,
  getStaff,
  getStaffMember,
  updatePermission,
  updateRole,
  updateStaff,
  deleteBranch,
  deleteBrand,
  deleteCategory,
  deleteExpense,
  deleteExpenseCategory,
  deleteProductBatch,
  deleteSupplier,
  downloadExpenseBills,
  getBranch,
  getBranches,
  getBrand,
  getBrands,
  getCategories,
  getCategory,
  getCities,
  getCountries,
  getExpense,
  getExpenseCategories,
  getExpenseCategory,
  getExpenseCategoryFormData,
  getExpenses,
  getProductBatch,
  getProductBatchBarcode,
  getProductBatches,
  getProducts,
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
  updateExpense,
  updateExpenseCategory,
  updateProductBatch,
  updateShop,
  updateSupplier,
} from '../../api';
import { rupees, shortDate } from '../../utils/format';

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
  return v === 1 || v === true || ['1', 'y', 'active'].includes(String(v).toLowerCase());
};

// ── select options ─────────────────────────────────────────────────────────────────────
// `dep` = form field whose value the lookup is loaded for (states of a country…).
export const LOOKUPS = {
  countries: { load: () => getCountries() },
  states: { dep: 'country_id', load: (countryId) => getStates(countryId) },
  cities: { dep: 'state_id', load: (stateId) => getCities(stateId) },
  // Branches cascade off `clinic_country`/`clinic_state` instead of `country_id`/`state_id`
  // (see the `branch` entity below) — same countries/states/cities data, different dep key.
  branchStates: { dep: 'clinic_country', load: (countryId) => getStates(countryId) },
  branchCities: { dep: 'clinic_state', load: (stateId) => getCities(stateId) },
  supplierTypes: { load: () => getSupplierTypes() },
  products: { load: () => getProducts() },
  // Branches have no `name` attribute (see the `branch` entity's displayName comment below) —
  // toOptions' `clinic_address` fallback above picks up the same address shown there.
  branches: { load: () => getBranches() },
  expenseCategories: { load: () => getExpenseCategories() },
  // Static — the "status" field required by POST /expense[/category]/store isn't a managed list.
  // Values confirmed by a live 422: it wants the literal string 'Y'/'N', not 1/0.
  // Shaped as { id, title } (not { value, label }) so toOptions' id/title fallback chain below
  // picks it up the same way it would a real API response.
  expenseStatuses: { load: () => Promise.resolve([{ id: 'Y', title: 'Active' }, { id: 'N', title: 'Inactive' }]) },
  // `category_type` is a DB column that rejects most free text (a live 500 showed MySQL
  // truncating/rejecting it — almost certainly a backend ENUM), and its real values aren't
  // documented anywhere. Tries GET /expense/category/create first (every other module here
  // exposes its create-form dropdown data at that URL shape); if that 404s or comes back empty,
  // falls back to the most common two-value convention for this kind of field. Replace the
  // fallback the moment a live save confirms (or rejects) it.
  expenseCategoryTypes: {
    load: async () => {
      try {
        const list = listOf(await getExpenseCategoryFormData());
        if (!list.length) throw new Error('empty');
        return list.map((v) => (typeof v === 'string'
          ? { id: v, title: v }
          : { id: v.id ?? v.value ?? v.type ?? v.name, title: v.title ?? v.label ?? v.name ?? v.type }));
      } catch (e) {
        return [{ id: 'Fixed', title: 'Fixed' }, { id: 'Variable', title: 'Variable' }];
      }
    },
  },
};

const optionText = (record, keys) =>
  keys
    .map((key) => record[key])
    .find((value) => (typeof value === 'string' || typeof value === 'number') && String(value).trim());

export const toOptions = (res) =>
  listOf(res).map((o) => {
    const value = o.id ?? o.country_id ?? o.state_id ?? o.city_id;
    const label = optionText(o, [
      'country_name',
      'countryName',
      'country',
      'state_name',
      'stateName',
      'state',
      'city_name',
      'cityName',
      'city',
      'name',
      'item_name',
      'category_name',
      'category',
      'brand_name',
      'clinic_address',
      'type',
      'title',
    ]) ?? value;
    return { value: String(value ?? ''), label: String(label ?? '') };
  });

// Same fallback chain as toOptions above, for list rows: `config.nameKey` first (the field the
// spec promises for this entity), then every other name-ish field actually seen in the API's
// responses. Needed because BRANDS_PATH currently points at /categories (see brands.js) so
// brand rows come back shaped as categories (`category_name`, not `brand_name`) until that path
// is confirmed — without this fallback the Brands list renders rows with blank name text.
export const nameOf = (o, key) => o[key ?? 'name'] ?? o.name ?? o.category_name ?? o.brand_name ?? o.title ?? o.id;

// ── fields ─────────────────────────────────────────────────────────────────────────────
const name = (label, placeholder, key = 'name') => ({
  key, label, icon: 'pricetag-outline', placeholder, autoCapitalize: 'words', required: true,
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
    // No `name` attribute exists for branches at all (confirmed: a live POST /branch/store
    // response came back with no name/branch_name/title key whatsoever) — this backend's
    // branch module is really a location + compliance-info record, so list rows and the
    // picker display an address instead.
    displayName: (b) => b.clinic_address ?? `Branch ${b.id}`,
    subtitle: (b) => [b.clinic_address ?? b.address, b.clinic_phone ?? b.phone].filter(Boolean).join(' • '),
    // Request field names (POST /branch/store) confirmed by a live 422, then confirmed correct
    // by a live success response — this backend's branch module is adapted from a clinic one
    // (clinic_phone, clinic_address1, clinic_country/state/city, clinic_pincode, gstin,
    // trade_licence). That same success response showed the STORED record uses different
    // column names for several of these (clinic_address1 -> clinic_address, clinic_country ->
    // country_id, clinic_state -> state_id, clinic_city -> city_id, clinic_pincode -> pincode,
    // email -> clinic_email) — `readKey` below points each field at its real stored column so
    // editing an existing branch doesn't show those as blank and silently wipe them on save.
    fields: [
      { ...email, key: 'email', readKey: 'clinic_email' },
      { key: 'clinic_phone', label: 'Phone', icon: 'call-outline', placeholder: '10-digit number', keyboardType: 'phone-pad', required: true },
      { key: 'clinic_address1', readKey: 'clinic_address', label: 'Address', icon: 'storefront-outline', placeholder: 'Street, area', autoCapitalize: 'sentences', required: true },
      { key: 'gstin', label: 'GSTIN', icon: 'document-text-outline', placeholder: 'GST number', autoCapitalize: 'characters', required: true },
      { key: 'trade_licence', label: 'Trade licence', icon: 'document-text-outline', placeholder: 'Licence number', required: true },
      { key: 'clinic_country', readKey: 'country_id', label: 'Country', icon: 'business-outline', type: 'select', lookup: 'countries', required: true },
      { key: 'clinic_state', readKey: 'state_id', label: 'State', icon: 'business-outline', type: 'select', lookup: 'branchStates', required: true },
      { key: 'clinic_city', readKey: 'city_id', label: 'City', icon: 'business-outline', type: 'select', lookup: 'branchCities', required: true },
      { key: 'clinic_pincode', readKey: 'pincode', label: 'Pincode', icon: 'keypad-outline', placeholder: '6 digits', keyboardType: 'number-pad', maxLength: 6, required: true },
    ],
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
    nameKey: 'category_name',
    fields: [name('Category name', 'e.g. Grains', 'category_name'), description],
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
    nameKey: 'brand_name',
    fields: [name('Brand name', 'e.g. Tata', 'brand_name'), description],
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
  productBatch: {
    title: 'Stock details',
    singular: 'Batch',
    icon: 'pricetags-outline',
    api: {
      list: getProductBatches, get: getProductBatch, create: createProductBatch,
      update: updateProductBatch, remove: deleteProductBatch,
    },
    // Batches have no single "name" field — show the product name plus its batch number.
    displayName: (b) => [b.product?.name ?? b.product?.item_name ?? b.product_name, b.batch_number ?? b.batch_no]
      .filter(Boolean).join(' • ') || `Batch ${b.id}`,
    subtitle: (b) => (b.expiry_date ? `Expires ${b.expiry_date}` : b.discount ? `${b.discount}% off` : ''),
    rowAction: { icon: 'barcode-outline', label: 'Print barcode', run: (id) => getProductBatchBarcode(id) },
    fields: [
      { key: 'product_id', label: 'Product', icon: 'cube-outline', type: 'select', lookup: 'products', required: true },
      { key: 'batch_number', label: 'Batch number', icon: 'pricetag-outline', placeholder: 'e.g. B-2026-01', required: true },
      { key: 'quantity', label: 'Quantity', icon: 'layers-outline', placeholder: '0', keyboardType: 'numeric', required: true },
      { key: 'cost_price', label: 'Cost price (₹)', icon: 'cash-outline', placeholder: '0', keyboardType: 'numeric', required: true },
      { key: 'selling_price', label: 'Selling price (₹)', icon: 'pricetag-outline', placeholder: '0', keyboardType: 'numeric', required: true },
      { key: 'discount', label: 'Discount (%)', icon: 'ticket-outline', placeholder: 'Optional', keyboardType: 'numeric' },
      { key: 'expiry_date', label: 'Expiry date', icon: 'calendar-outline', placeholder: 'YYYY-MM-DD' },
    ],
  },
  expenseCategory: {
    title: 'Expense categories',
    singular: 'Expense category',
    icon: 'pricetags-outline',
    api: {
      list: getExpenseCategories, get: getExpenseCategory, create: createExpenseCategory,
      update: updateExpenseCategory, remove: deleteExpenseCategory,
    },
    subtitle: (c) => c.description ?? '',
    // POST /expense/category/store's required fields confirmed by a live 422 then a live 500: the
    // name goes under `category` (not `name`); `status` wants the literal 'Y'/'N'; and the
    // `expense_categories` table itself also has NOT NULL `category_type` and `amount` columns the
    // create form never sent at all — the 500's SQL log named them directly. `category_type`
    // rejected free text as a DB-level truncation error (see expenseCategoryTypes above), so it's
    // a constrained select instead of a type-anything field.
    nameKey: 'category',
    fields: [
      name('Category name', 'e.g. Utilities', 'category'),
      { key: 'category_type', label: 'Category type', icon: 'pricetags-outline', type: 'select', lookup: 'expenseCategoryTypes', required: true },
      { key: 'amount', label: 'Amount (₹)', icon: 'cash-outline', placeholder: '0', keyboardType: 'numeric', required: true },
      description,
      { key: 'status', label: 'Status', icon: 'toggle-outline', type: 'select', lookup: 'expenseStatuses', required: true, default: 'Y' },
    ],
  },
  // Rows 98-112. Field names are best guesses until a live response confirms them.
  staff: {
    title: 'Staff',
    singular: 'Staff member',
    icon: 'people-outline',
    api: { list: getStaff, get: getStaffMember, create: createStaff, update: updateStaff, remove: deleteStaff },
    // Confirmed by live responses: users come back under a `user` key, with the role as `is_*`
    // flags (is_admin, is_manager…) and phone/branch nested in `staff_profile`. The create/update
    // payload names are NOT confirmed (writes weren't tested against the shared backend).
    normalize: (s) => ({ ...(s.staff_profile ?? {}), ...s }),
    subtitle: (s) => {
      const flag = Object.keys(s).find((k) => k.startsWith('is_') && s[k] === 1 && k !== 'is_email_verified');
      const role = flag ? flag.slice(3).replace(/_/g, ' ') : '';
      return [role && role[0].toUpperCase() + role.slice(1), s.staff_profile?.phone ?? s.email].filter(Boolean).join(' • ');
    },
    fields: [
      name('Full name', 'e.g. Anil Kumar'),
      email,
      phone,
      { key: 'password', label: 'Password', icon: 'lock-closed-outline', placeholder: 'Leave blank to keep' },
    ],
  },
  role: {
    title: 'Roles',
    singular: 'Role',
    icon: 'shield-checkmark-outline',
    api: { list: getRoles, get: getRole, create: createRole, update: updateRole, remove: deleteRole },
    subtitle: (r) => r.description ?? '',
    fields: [name('Role name', 'e.g. Cashier'), description],
  },
  permission: {
    title: 'Permissions',
    singular: 'Permission',
    icon: 'key-outline',
    api: {
      list: getPermissions, get: getPermission, create: createPermission,
      update: updatePermission, remove: deletePermission,
    },
    subtitle: (p) => p.description ?? '',
    fields: [name('Permission name', 'e.g. create_bill'), description],
  },
  expense: {
    title: 'Expenses',
    singular: 'Expense',
    icon: 'card-outline',
    api: {
      list: getExpenses, get: getExpense, create: createExpense,
      update: updateExpense, remove: deleteExpense,
    },
    nameKey: 'name',
    // No display-worthy "name" is entered by the user (the `name` field below is required by
    // the backend but not shown to them as a title) — show the category plus amount instead,
    // same convention as productBatch. `category` comes back nested as its own object on list
    // rows (see the live response shape in the `category_id` field's comment below).
    displayName: (e) => {
      const category = e.category?.category ?? e.category?.name ?? e.category_name ?? e.expense_category_name;
      const amount = rupees(e.amount);
      return [category, amount].filter(Boolean).join(' • ') || `Expense ${e.id}`;
    },
    subtitle: (e) => [e.billdate ? shortDate(e.billdate) : null, e.note ?? e.description].filter(Boolean).join(' • '),
    rowAction: { icon: 'download-outline', label: 'Download bills', run: (id) => downloadExpenseBills(id) },
    // POST /expense/store's required fields confirmed by a live 422 ("The bill date is required.
    // (and 3 more errors)"): `billdate`, `name`, `category_id`, and `branch_id` are all required —
    // superseding the earlier guess that the backend wanted `category`/`date` instead.
    fields: [
      { key: 'name', label: 'Name', icon: 'pricetag-outline', placeholder: 'e.g. October electricity bill', required: true },
      // `asString`: a live 422 rejected these as numbers ("The category must be a string." /
      // "The branch must be a string.") — the backend wants the id sent as text, unlike every
      // other select in this file.
      { key: 'category_id', label: 'Category', icon: 'pricetags-outline', type: 'select', lookup: 'expenseCategories', required: true, asString: true },
      { key: 'branch_id', label: 'Branch', icon: 'business-outline', type: 'select', lookup: 'branches', required: true, asString: true },
      { key: 'amount', label: 'Amount (₹)', icon: 'cash-outline', placeholder: '0', keyboardType: 'numeric', required: true },
      { key: 'billdate', label: 'Bill date', icon: 'calendar-outline', type: 'date', required: true },
      { key: 'note', label: 'Note', icon: 'document-text-outline', placeholder: 'Optional', autoCapitalize: 'sentences' },
      { key: 'status', label: 'Status', icon: 'toggle-outline', type: 'select', lookup: 'expenseStatuses', required: true, default: 'Y' },
    ],
  },
};
