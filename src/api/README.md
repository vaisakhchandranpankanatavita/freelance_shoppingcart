# API layer

Base URL: `https://store.serieux.in/api` (`config.js`). Import everything from `src/api`.

All functions return the parsed JSON response. Use `unwrap(res)` to get `res.data ?? res`.
Payloads may be plain objects (sent as JSON) or `FormData` (sent as multipart, for images).

## Endpoints

| Function | Method | URL |
| --- | --- | --- |
| `login(credentials)` | POST | `/login` (no auth; stores returned tokens) |
| `refreshToken()` | POST | `/refresh-token` |
| `logout()` | POST | `/logout` (always clears tokens) |
| `getShop()` | GET | `/shop` |
| `updateShop(payload)` | POST | `/shop/store` |
| `getCountries()` | GET | `/countries` |
| `getStates(countryId)` | GET | `/states/{countryId}` |
| `getCities(stateId)` | GET | `/cities/{stateId}` |
| `getBranches()` | GET | `/branch` |
| `createBranch(payload)` | POST | `/branch/store` |
| `getBranch(id)` | GET | `/branch/{id}/edit` |
| `updateBranch(id, payload)` | POST | `/branch/update/{id}` |
| `toggleBranchStatus(id)` | GET | `/branch/statusChange/{id}` |
| `deleteBranch(id)` | DELETE | `/branch/{id}` |
| `getCategories()` | GET | `/categories` |
| `createCategory(payload)` | POST | `/categories/store` |
| `getCategory(id)` | GET | `/categories/{id}/edit` |
| `updateCategory(id, payload)` | POST | `/categories/update/{id}` |
| `toggleCategoryStatus(id)` | GET | `/categories/statusChange/{id}` |
| `deleteCategory(id)` | DELETE | `/categories/{id}` |
| `getBrands()` … `deleteBrand(id)` | same as categories | `/categories` (the API tracker lists the Categories route family for Brands) |
| `getProducts(query)` | GET | `/products?…` |
| `createProduct(payload)` | POST | `/products/store` |
| `getProduct(id)` | GET | `/products/{id}/edit` |
| `updateProduct(id, payload)` | POST | `/products/update/{id}` |
| `deleteProduct(id)` | POST | `/products/destroy/{id}` |
| `getBranchStock(productId, branchId)` | GET | `/products/stockBranch/{productId}/{branchId}` |
| `updateVariantStock(payload)` | POST | `/products/stockEntry` |
| `getSupplierTypes()` | GET | `/supplierTypes` |
| `getSuppliers()` | GET | `/suppliers` |
| `createSupplier(payload)` | POST | `/suppliers/store` |
| `getSupplier(id)` | GET | `/suppliers/{id}/edit` |
| `updateSupplier(id, payload)` | POST | `/suppliers/update` (id sent in the body) |
| `deleteSupplier(id)` | DELETE | `/suppliers/{id}` |
| `searchProducts({ categoryId, branchId, search, barcode })` | GET | `/get-products?category_id&branch_id&search&barcode` |
| `getPurchaseFormData()` | GET | `/productPurchase/create` |
| `getPurchases(query)` | GET | `/productPurchase?…` |
| `createPurchase(payload)` | POST | `/productPurchase/store` |
| `getPurchase(id)` | GET | `/productPurchase/{id}/edit` |
| `updatePurchase(id, payload)` | POST | `/productPurchase/update` (id sent in the body) |
| `deletePurchase(id)` | POST | `/productPurchase/delete/{id}` |
| `getProductBatches(query)` | GET | `/productBatch?…` |
| `createProductBatch(payload)` | POST | `/productBatch/store` |
| `getProductBatch(id)` | GET | `/productBatch/{id}/edit` |
| `updateProductBatch(id, payload)` | POST | `/productBatch/update` (id sent in the body) |
| `deleteProductBatch(id)` | DELETE | `/productBatch/{id}` |
| `getProductBatchBarcode(id)` | GET | `/productBatch/barcode/{id}` |
| `getStockLedger({ branchId, productId, from, to })` | GET | `/stockLedger?…` |
| `searchCustomer(phone)` | POST | `/searchCustomer` |
| `productSearch(search)` | GET | `/product-search?search=…` |
| `searchProductByBarcode(barcode)` | GET | `/search-product-by-barcode?barcode=…` |
| `getBills(query)` | GET | `/billHistory?…` |
| `getBill(id)` | GET | `/bill/{id}/edit` |
| `createBill(payload)` | POST | `/bill/store` |
| `updateBill(id, payload)` | POST | `/bill/update` (id sent in the body) |
| `printBill(id)` | GET | `/bill/print-bill/{id}` |
| `refundBill(payload)` | POST | `/bill/saleRefund` (id sent in the body) |
| `getExpenseCategories()` | GET | `/expense/category` |
| `createExpenseCategory(payload)` | POST | `/expense/category/store` |
| `getExpenseCategory(id)` | GET | `/expense/category/{id}/edit` |
| `updateExpenseCategory(id, payload)` | POST | `/expense/category/update` (id sent in the body) |
| `deleteExpenseCategory(id)` | DELETE | `/expense/category/{id}` |
| `getExpenses(query)` | GET | `/expense?…` |
| `createExpense(payload)` | POST | `/expense/store` |
| `getExpense(id)` | GET | `/expense/{id}/edit` |
| `updateExpense(id, payload)` | POST | `/expense/update` (id sent in the body) |
| `deleteExpense(id)` | DELETE | `/expense/delete/{id}` |
| `downloadExpenseBills(id)` | GET | `/expense/{id}/download-bills` |
| `getCollectionReport(query)` | GET | `/collectionReport?…` |
| `getIncomeReport(query)` | GET | `/incomeReport?…` |
| `getSalesItemReport(query)` | GET | `/salesItemReport?…` |
| `getSalesCategoryReport(query)` | GET | `/salesCategoryReport?…` |
| `getInStockReport(query)` | GET | `/inStockReport?…` |
| `getOutOfStockReport(query)` | GET | `/outOfStockReport?…` |
| `getRefundBillList(query)` | GET | `/refundBillList?…` |
| `getReturnedItems(query)` | GET | `/returnedItems?…` |

## Frontend wiring status

The backend-completed API groups are connected to these app flows:

| API group | Frontend flow |
| --- | --- |
| Login, refresh, logout | `AuthContext` and `RootNavigator`; logout is available from the account menu and More screen |
| Shop, countries/states/cities, branches | More → Store settings / Manage Branches; shared entity forms load dependent location options |
| Categories, brands, suppliers and supplier types | More → their management lists and forms |
| Products and branch stock | Stock list, Add item and Product details (per-branch stock read/update) |
| Purchase history, create/edit/delete and form data | Purchase list and purchase-order form |
| Product batches and barcode | More → Stock details; the batch list action requests its barcode |
| Stock ledger | More → Stock ledger, with a branch filter |
| Customer/product/barcode search for billing | New bill flow |
| Expense categories and expenses | More → Expense categories / Expenses lists and forms; the expense list's download action requests a bill |
| Collection/income/sales/stock/refund/return reports | More → Reports → each report list, with a date filter where the report supports one |

`/get-products` is used for stock filters, but the tracker marks that endpoint Pending. Purchase-request and supplier-payment routes are also Pending. Do not treat those groups as backend-completed. The expense and report routes above are marked Completed on the backend but Pending on QA — their response shapes aren't confirmed yet, so the frontend reads them defensively (see `manage/entities.js`'s `expense` entity and `modules/reports/reports.js`).

Billing create/update/print/refund/history/detail routes now use the confirmed `/bill…` and `/billHistory` paths from the tracker.

## Tokens and refresh

- Tokens live in memory (`tokenStore.js`); they are lost on restart. Persistence (expo-secure-store) can be added in `tokenStore.js`.
- Authenticated requests send `Authorization: Bearer <access token>`.
- Token keys accepted from responses (login confirmed to use top-level `access_token` / `refresh_token`): `access_token`, `token`, `data.access_token`, `data.token`; refresh token: `refresh_token`, `data.refresh_token`.
- On a 401, one shared refresh call is made (`POST /refresh-token` with `{ refresh_token }` in the body and the refresh token as Bearer), then the request is retried once.
- If the refresh fails, tokens are cleared and `onAuthExpired` listeners fire, so the app can go back to login.

## Errors

Every failure throws `ApiError` with `message`, `status`, `data` and `errors` (the Laravel 422 `errors` object, if any).
This covers non-2xx responses and 2xx responses with `{ status: false }` or `{ success: false }`.
Network failures have `status: 0`. Aborted requests (`signal`) rethrow the original `AbortError`.

## Open questions

- **Brands path:** the API tracker currently lists the Categories route family for Brands. The frontend follows that contract through `BRANDS_PATH` in `endpoints/brands.js`; switch it only if the backend confirms a separate Brands route family.
- **Login response (confirmed):** `POST /login` success returns
  `{ status: true, message, access_token, refresh_token, user: { id, name, username, login_id, email, roles: ['Admin'] } }`.
  Tokens are read from the top-level keys and stored. `AuthContext` maps the user to
  `{ id, name, loginId: String(login_id), role: roles[0].toLowerCase(), email }` (role defaults to `'staff'`).
- **Still unverified:**
  - Login *request* field names: the app sends `{ login_id, password? }` (Login ID mode; `login_id` as the typed string, `password` omitted when undefined) or `{ email, username, password }`. Confirm which the backend accepts, and whether `login_id` must be a number.
  - The failure body shape (assumed `{ status: false, message }` and/or a Laravel 422 `errors` object) and the HTTP status used for bad credentials.
  - The full list of role names (only `Admin` seen); non-admin roles fall through lowercased.
  - The `/refresh-token` contract and the `/logout` response.
  - Response shapes for every non-auth endpoint.
- `getProducts(query)` query parameters (paging, filters) are unknown and are passed through as given.
