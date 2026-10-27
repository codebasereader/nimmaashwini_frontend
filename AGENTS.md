# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

**Nimma Ashwini** (nimmaashwini.com) — an e-commerce storefront for traditional natural hair/wellness products (hair oil, herbal shampoo, ragi malt) plus an admin dashboard (catalog, orders, expenses, GST, insights). It is a client-side React SPA; all data comes from a separate backend API (AWS API Gateway). Payments go through PhonePe, but the frontend never talks to PhonePe — it only redirects to the `checkoutPageUrl` the backend returns.

## Stack

- React 19, Vite 8, plain **JavaScript/JSX** (no TypeScript), ES modules
- React Router 7 (`react-router-dom`), `BrowserRouter`
- Redux Toolkit + react-redux for **admin** state; React Context for the **cart**
- Tailwind CSS 4 (CSS-first config via `@theme` in `src/index.css`, PostCSS plugin `@tailwindcss/postcss`)
- `motion` (animations), `lucide-react` (icons), `recharts` (insights charts), `react-helmet-async` (SEO), `exceljs` + `file-saver` (Excel exports)
- Native `fetch` — there is no Axios

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # runs `prebuild` first (regenerates public/sitemap.xml from the LIVE API), then vite build
npm run lint      # eslint .
npm run preview   # serve dist/
npm run sitemap   # regenerate public/sitemap.xml only
```

There is **no test suite**. Verify changes with `npm run lint` and by running the app. Note that `npm run build` needs network access (sitemap fetch); if the API is unreachable the script warns and emits static pages only.

Seed/maintenance scripts in `scripts/` (`seed-all-test-data.mjs`, `seed-gstr1-test-data.mjs`, `update-*.mjs`) hit the real backend with an admin token/credentials. Do not run them unless asked.

## Layout

```
config.js                 API_URL (single source of truth; also imported by scripts/)
index.html                static fallback SEO tags (marked data-seo-default)
public/                   static assets, _redirects (SPA fallback), robots.txt, sitemap.xml (generated)
docs/                     backend API/schema docs — read these before touching an API integration
scripts/                  node scripts (sitemap, seeding)
src/
  main.jsx                providers: Helmet > Redux > MotionConfig > Router > CartProvider > App
  App.jsx                 all routes
  api/                    one module per backend resource; thin wrappers over apiRequest
  store/                  Redux store + slices (admin only)
  context/CartContext.jsx storefront cart
  lib/                    pure helpers (money, GST, order math, exports, SEO config, storage)
  hooks/                  shared hooks
  data/                   static product + legal content
  pages/                  storefront route components
  components/             storefront UI (layout/, sections/, ui/, product/, checkout/, icons/)
  admin/                  admin dashboard (AdminLayout, components/, lib/, pages/<area>/)
```

## Routing & layouts

- Storefront routes are wrapped individually in `<AppLayout>` (navbar/footer/announcement bar) inside `App.jsx`.
- `/login` and everything under `/admin` are "standalone" (no storefront chrome, no logo loader). `isStandaloneRoute` in `App.jsx` encodes this — update it if you add another standalone prefix.
- `/admin/*` is guarded by `ProtectedRoute` (redirects to `/login` when `state.auth.token` is empty); pages render in `AdminLayout`'s `<Outlet>`. Adding an admin page = new page component + `<Route>` in `App.jsx` + nav entry in `src/admin/components/AdminNav.jsx`.
- `public/_redirects` (`/* /index.html 200`) provides the SPA fallback on the host; keep it.
- New public pages should also be added to `STATIC_PAGES` in `scripts/generate-sitemap.mjs`.

## API layer

- All calls go through `apiRequest(path, { method, body, token })` in `src/api/client.js`. It prefixes `API_URL`, JSON-encodes `body`, adds `Authorization: Bearer <token>`, and **returns `payload.data`** (not the whole envelope). Backend envelope: `{ success, message, data, errors }`.
- Failures throw `ApiError` (`message`, `status`, `errors`). A `401` triggers the handler registered in `main.jsx`, which dispatches `logout()`.
- Binary exports use `apiDownload(...)` → `{ blob, filename }`, then save with `file-saver`.
- Pattern for a new resource: add `src/api/<resource>.js` exporting plain functions that take `(…, token)` for admin endpoints and no token for public ones (see `coupons.js`, which also holds its own `buildQuery` helper).
- Backend contracts are documented in `docs/*.md` (e.g. `API.md`, `ORDER_CHECKOUT_SCHEMA.md`, `FRONTEND_PAYMENT_INTEGRATION.md`). Treat them as the spec; don't guess field names.
- Backend IDs may be `id`, `_id`, `uuid`, etc. Always use `getEntityId` (`store/slices/crudHelpers.js`, re-exported as `getRowId` in `admin/lib/entityId.js`) instead of reading `item.id` directly in admin code.

## State management

- **Admin CRUD slices** follow one pattern (see `couponsSlice.js`): `createAsyncThunk`s (`load`, `loadById`, `add`, `edit`, `remove`) read the token from `getState().auth.token`, return `rejectWithValue(error.message)` on failure, and the slice wires reducers with `createCrudSliceHandlers` + `crudInitialState` from `crudHelpers.js`. Reuse that instead of hand-writing reducers. New slices must be registered in `src/store/index.js`.
- Auth: `authSlice` persists `ashwini_admin_token` / `ashwini_admin_user` in `localStorage`. (Known tradeoff: tokens in localStorage rather than httpOnly cookies — the backend currently returns a bearer token.)
- Cart: `CartContext` (not Redux), persisted via `src/lib/cartStorage.js`. Cart lines are keyed by `lineId` (product + variant). Quantities are clamped to `maxQuantityPerOrder`.
- Storefront product data comes from the API via `useStorefrontProducts` (module-level cache + in-flight dedupe, filters `isActive === false`). `src/data/products.js` is static content (copy, benefits, images) for the product pages — check which source a given component uses before editing.

## Admin conventions

- Pages are `src/admin/pages/<area>/<Name>Page.jsx`; shared admin pieces live in `src/admin/components/` (`AdminDataTable`, `AdminDrawer`, `AdminPagination`, `AdminTabs`, `ConfirmDialog`, `DateRangeFilter`, form drawers per entity, `AdminFormFields`).
- Create/edit is done in **drawers** (`*FormDrawer.jsx`), not separate routes. `useAdminEditById` loads the full record by id when Edit is clicked.
- Money/GST/order math lives in `src/lib/` (`gst.js`, `gstr1.js`, `order.js`, …) and `src/admin/lib/purchaseMath.js`, `src/admin/pages/orders/orderMath.js`. Put calculations there, not inline in JSX.
- Excel/export builders: `lib/orderExport.js`, `lib/expenseExport.js`, `lib/gstr1Excel.js`.
- **Duplicate to be aware of:** `src/admin/components/OrderDetailDrawer.jsx` is unused and differs from the live `src/admin/pages/orders/OrderDetailDrawer.jsx` (imported by `OrdersPage` and `CustomersPage`). Edit the one in `pages/orders/`; don't revive the other without checking.

## Checkout & payments

- Flow: cart → `/checkout` → `POST /orders` → redirect to returned `checkoutPageUrl` → backend redirects to `/payment-success?merchantOrderId=…` or `/payment-failure?merchantOrderId=…`. `lib/paymentOrder.js` extracts the order id from the query string (several param spellings tolerated).
- International orders (`country !== "India"`) are not paid online; they build a WhatsApp message (`lib/checkout.js`).
- Coupons: public `validateCoupon` / `fetchAvailableCoupons` (no token); admin CRUD under `/admin/coupons`.
- Pincode autofill: `hooks/usePincodeAutofill.js` + `lib/pincodeLookup.js`.

## Testing mode flag

`TESTING_MODE` in `src/lib/siteNotice.js` is a single switch that shows the testing banner (`TestingNoticeBar`), the welcome pop-up (`TestingNoticePopup`, seen-state in `sessionStorage`), and **disables payment** on `CheckoutPage` (button disabled, auto-actions skipped). It is currently `true`. Flipping it to `false` is the go-live step — don't change it as a side effect of other work.

## SEO

- Every page should render `<Seo title description path … jsonLd />` (`src/components/Seo.jsx`); admin/login/transactional pages should pass `noindex`. `Seo` removes the static `data-seo-default` tags from `index.html` once mounted.
- Site constants (`SITE_URL`, `SITE_NAME`, default description/OG image) are in `src/lib/seoConfig.js`; build absolute URLs with `absoluteUrl()`.
- `public/sitemap.xml` is generated; it is committed, but regenerate with `npm run sitemap` rather than hand-editing.

## Styling

- Tailwind v4 with design tokens declared in `src/index.css` under `@theme`: fonts (`font-display` Cormorant Garamond, `font-sans` Montserrat), a type scale (`text-display-*`, `text-body*`, `text-caption`), and colour scales (cream, etc.). Use these tokens/utilities instead of arbitrary hex values or px sizes.
- Brand feel is warm, traditional, Indian-heritage (cream backgrounds, serif display type, motif decor in `components/product/motifs`). Match it when adding UI.
- Reuse `components/ui/*` (`Button`, `SectionHeading`, `ScrollReveal`, `ProductCard`, …) and `lib/motion.js` animation presets before creating new ones. Respect reduced motion (`MotionConfig reducedMotion="user"` is set globally).

## Code style

- ESLint flat config: `@eslint/js` recommended + `react-hooks` + `react-refresh/only-export-components`. Keep `npm run lint` clean — in particular, files exporting components should not also export non-components (move helpers to `lib/`).
- Function components with hooks; default-export the component, named-export helpers. Double quotes, semicolons, 2-space indent, trailing commas in multiline literals (match surrounding files).
- Import paths are relative (no alias configured).
- Currency is INR; format with `formatPrice` (`lib/product.js`) / `formatOrderMoney` (`lib/paymentOrder.js`) using `en-IN`.
- Keep comments sparse and explain *why*, as the existing code does.

## Things to avoid

- Don't hard-code the API URL anywhere except `config.js`.
- Don't commit tokens, admin credentials, or seed-script secrets.
- Don't edit `dist/` or generated `public/sitemap.xml` by hand (`dist` is gitignored).
- Don't add a second state library or HTTP client; extend the existing Redux/Context/`apiRequest` setup.
- Don't remove or reorder the `prebuild` sitemap step without a replacement.
