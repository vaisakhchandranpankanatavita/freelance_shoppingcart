# Grocery Admin — React Native (Expo)

A cross-platform (Android + iOS + Tablet) supermarket admin app for billing staff to manage **Stock**, **Purchase** and **Sale**.

Currently uses **dummy in-memory data**. Each module has a `services.js` layer that returns promises — swap those with `fetch()` calls when the Node.js backend is ready.

## Features

- Splash → Login / Sign Up flow with **segmented tabs**:
  - **Login ID tab** — sign in with a **4-digit numeric PIN only** (no password)
  - **Username tab** — sign in with username + password
- Bottom tabs: Dashboard · Stock · Purchase · Sale
- Side drawer with all admin menu items (Reports, Staff, Refunds, Branches, Settings, Log Out)
- Dashboard: KPI cards, order overview, top-selling products, weekly sales/purchase bar chart
- Stock: list + search + summary tiles (total, value, low stock) + Add item
- Purchase: list + status filters + Add new PO
- Sale: list + Today's KPIs + New Bill screen (product search, cart, qty, payment mode)
- Works on iPhone, Android phone, tablets, and web preview (auto phone-frame on desktop browser)

## Demo credentials

**Login ID tab** — 4-digit PIN only:

| Role  | Login ID |
|-------|----------|
| Admin | `1001`   |
| Staff | `2002`   |

**Username tab** — username + password:

| Role  | Username    | Password   |
|-------|-------------|------------|
| Admin | `Admin`     | `admin123` |
| Staff | `BillStaff` | `staff123` |

## Run it

```bash
# 1. install deps
npm install

# 2a. start Metro (interactive) — press i / a / w in the terminal
npm start

# 2b. or launch iOS + Android + web all at once
npm run dev
```

Or scan the QR code with the **Expo Go** app on your phone.

### First-time macOS setup (one-time)

```bash
# Node LTS via nvm (RN doesn't support Node 25/odd versions)
nvm install 20 && nvm use 20

# Watchman — prevents "EMFILE: too many open files" during Metro bundling
brew install watchman
```

## Available scripts

| Command         | What it does                                     |
|-----------------|--------------------------------------------------|
| `npm start`     | Start Metro dev server (interactive)             |
| `npm run dev`   | Start Metro **and** open iOS + Android + web     |
| `npm run ios`   | Start + open iOS simulator only                  |
| `npm run android` | Start + open Android emulator only             |
| `npm run web`   | Start + open web preview only                    |

## Folder structure

```
src/
├── components/          # reusable UI (buttons, inputs, cards, chart)
├── context/             # AuthContext (dummy login)
├── data/                # dummy dashboard data
├── modules/
│   ├── stock/           # StockListScreen, AddStockScreen, data, services, navigator
│   ├── purchase/        # PurchaseListScreen, AddPurchaseScreen, data, services, navigator
│   └── sale/            # SaleListScreen, NewSaleScreen, data, services, navigator
├── navigation/          # AuthNavigator, MainTabNavigator, AppDrawerNavigator, RootNavigator
├── screens/
│   ├── auth/            # SplashScreen, LoginScreen, SignUpScreen
│   └── DashboardScreen.js
└── theme/               # colors, spacing, radius, typography
```

## Swapping dummy data for real API

Each module keeps its data & network code isolated in `services.js`. Example (`src/modules/stock/services.js`):

```js
// before
export const getStockItems = async () => { ...returns dummy list... };

// after — with Node.js backend
export const getStockItems = async () => {
  const res = await fetch('https://api.your-backend.com/stock');
  return res.json();
};
```

No screen code needs to change.

## Notes

- App icons/splash aren't bundled — Expo uses its defaults for development. Drop your own PNGs into `assets/` and reference them from `app.json` before publishing a store build.
- Auth state currently lives in memory. Persist with `expo-secure-store` or `@react-native-async-storage/async-storage` when integrating the real backend.
- Web preview auto-clamps to a 430 × 900 phone-sized frame so mobile layouts render correctly in the browser (`App.js`).

## Troubleshooting

- **`EMFILE: too many open files, watch`** — install Watchman: `brew install watchman`.
- **`404` on `nested-error-stacks` / any package from `artifactory-edge.expedia.biz`** — the project ships a `.npmrc` pinning the public npm registry (`https://registry.npmjs.org/`). If you removed it, either restore it or run installs with `--registry=https://registry.npmjs.org/`.
- **Cryptic Node errors on install/start** — you're likely on a non-LTS Node (e.g. 25). The project pins Node **20** via `.nvmrc`; run `nvm use` inside the project folder.
- **Web says `react-native-web` missing** — `npx expo install react-native-web react-dom @expo/metro-runtime`.
