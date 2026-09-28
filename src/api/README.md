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
| `getBrands()` … `deleteBrand(id)` | same as categories | `BRANDS_PATH` (currently `/categories`, see below) |
| `getProducts(query)` | GET | `/products?…` |
| `createProduct(payload)` | POST | `/products/store` |
| `getProduct(id)` | GET | `/products/{id}/edit` |
| `updateProduct(id, payload)` | POST | `/products/update/{id}` |
| `deleteProduct(id)` | POST | `/products/destroy/{id}` |
| `getBranchStock(productId, branchId)` | GET | `/products/stockBranch/{productId}/{branchId}` |
| `updateVariantStock(payload)` | POST | `/products/stockEntry` |
| `searchProducts({ categoryId, branchId, search, barcode })` | GET | `/get-products?category_id&branch_id&search&barcode` |

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

- **Brands path:** the spec gives the category URLs for brands too, which looks like a copy-paste error. Change `BRANDS_PATH` in `endpoints/brands.js` once the real path (probably `/brands`) is confirmed.
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
