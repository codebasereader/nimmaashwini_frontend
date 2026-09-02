# Cart Schema — Frontend Contract

Schema for the **guest shopping cart** used on the Nimma Ashwini storefront. The cart is stored in the browser and its line items are sent to the backend when placing an order.

**Audience:** Backend team  
**Status:** Implemented on frontend — cart persists via `localStorage`  
**Related:** [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md), [PRODUCT_SCHEMA.md](./PRODUCT_SCHEMA.md)

---

## Overview

| Concern | Approach |
|---------|----------|
| Storage | Browser `localStorage` key: `ashwini_cart` |
| Auth | Not required (guest cart) |
| Server sync | Cart is sent as `items[]` inside `POST /api/orders` at checkout |
| Multiple products | Supported — each product + variant is a separate line |

The backend does **not** need a separate cart API for the current storefront flow. Cart lines are submitted once when the customer places an order.

---

## Cart line item (client-side)

Each object in the `ashwini_cart` array:

```json
{
  "lineId": "6a475c66b203bc97e100aaa1:250ml",
  "productId": "6a475c66b203bc97e100aaa1",
  "slug": "herbal-hair-oil",
  "name": "Herbal Hair Oil",
  "image": "https://nimmaaishwini.s3.ap-south-1.amazonaws.com/products/cover.webp",
  "variantId": "250ml",
  "variantLabel": "250 ml",
  "price": 750,
  "priceDisplay": "₹750",
  "quantity": 2,
  "maxQuantity": 1
}
```

### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `lineId` | string | Unique cart key: `{productId}:{variantId}` |
| `productId` | string | Product MongoDB `_id` |
| `slug` | string | Product slug for storefront URLs |
| `name` | string | Product display name (snapshot at add-to-cart time) |
| `image` | string \| null | Cover or first gallery image URL |
| `variantId` | string | Variant `value` from `quantities[]` (e.g. `"250ml"`, `"500g"`) |
| `variantLabel` | string \| null | Display label (e.g. `"250 ml"`) |
| `price` | number | Unit price in INR for this variant |
| `priceDisplay` | string | Formatted price for UI (e.g. `"₹750"`) |
| `quantity` | number | Units in cart (≥ 1, ≤ `maxQuantity`) |
| `maxQuantity` | number | Max units per order for this variant |

---

## How items are added

1. Customer opens a product page and selects a **quantity variant** (`quantities[]`).
2. Frontend calls `addItem(product, { quantity, variant })`.
3. If the same `productId + variantId` already exists, quantities are merged (capped at `maxQuantity`).
4. Cart is saved to `localStorage` on every change.

### Variant resolution

`variantId` maps to `product.quantities[].value` (or `sizes[].value` for legacy products).

Example product variant from API:

```json
{
  "amount": 250,
  "unit": "ml",
  "label": "250 ml",
  "value": "250ml",
  "price": 750,
  "maxQuantityPerOrder": 1
}
```

Cart line uses:
- `variantId` → `"250ml"`
- `variantLabel` → `"250 ml"`
- `price` → `750`
- `maxQuantity` → `1`

---

## Cart → order mapping

At checkout, each cart line is transformed into an **order line item**:

```json
{
  "productId": "6a475c66b203bc97e100aaa1",
  "slug": "herbal-hair-oil",
  "name": "Herbal Hair Oil",
  "variantId": "250ml",
  "variantLabel": "250 ml",
  "quantity": 2,
  "unitPrice": 750,
  "lineTotal": 1500
}
```

| Cart field | Order field |
|------------|-------------|
| `productId` | `productId` |
| `slug` | `slug` |
| `name` | `name` |
| `variantId` | `variantId` |
| `variantLabel` | `variantLabel` |
| `quantity` | `quantity` |
| `price` | `unitPrice` |
| `price × quantity` | `lineTotal` |

**Backend should:**
1. Re-resolve `productId` + `variantId` against live product data
2. Verify `unitPrice` matches current variant price (or accept snapshot with audit)
3. Enforce stock and `maxQuantityPerOrder`
4. Reject inactive or missing products

---

## Validation (frontend)

| Rule | Detail |
|------|--------|
| Minimum quantity | 1 per line |
| Maximum quantity | `maxQuantity` per variant |
| Empty cart | Checkout redirects to `/cart` |
| Duplicate lines | Merged by `lineId` |

---

## Pages & routes

| Route | Purpose |
|-------|---------|
| `/cart` | View / edit cart |
| `/checkout` | Delivery form + place order |
| `/checkout/success` | Confirmation after successful order |

Cart icon in header links to `/cart`.

---

## Coupons

Apply coupons on **checkout** (not on the cart page). Validate via `POST /api/coupons/validate`, then send `couponCode` on `POST /api/orders`. Full contract: [COUPON_SCHEMA.md](./COUPON_SCHEMA.md).

## Future extensions (optional)

| Feature | Notes |
|---------|-------|
| Server-side cart | `POST /api/cart` if logged-in users need cross-device sync |
| Cart merge on login | Merge `localStorage` cart with user account cart |

---

## Checklist for backend (order placement)

- [ ] Accept `items[]` shape from [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md)
- [ ] Validate `productId` + `variantId` against `quantities[].value`
- [ ] Verify prices and stock at order time
- [ ] No separate cart API required for v1
