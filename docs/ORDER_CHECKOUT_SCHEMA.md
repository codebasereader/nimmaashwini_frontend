# Order & Checkout Schema — Backend Contract

Schema for **placing customer orders** from the Nimma Ashwini storefront checkout flow.

**Audience:** Backend team  
**Status:** Proposed — frontend implemented against this contract  
**Related:** [CART_SCHEMA.md](./CART_SCHEMA.md), [API.md](./API.md), [PRODUCT_SCHEMA.md](./PRODUCT_SCHEMA.md), [GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md), [COUPON_SCHEMA.md](./COUPON_SCHEMA.md)

---

## Summary

| Area | Detail |
|------|--------|
| Endpoint | `POST /api/orders` |
| Auth | Not required (guest checkout) |
| Currency | INR |
| Domestic orders | India only — full form + API submission |
| International orders | **Blocked on website** — customer directed to WhatsApp |

---

## Checkout flow (frontend)

```
Cart (/cart)
  → Checkout (/checkout)
      → Country = India     → Delivery form → POST /api/orders → Success page
      → Country ≠ India     → WhatsApp message (no API call)
```

### Customer fields collected (domestic — India)

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `name` | Yes | string | Full name |
| `contactNumber` | Yes | string | Primary phone (10–15 digits, optional `+` prefix) |
| `alternateNumber` | No | string | Secondary phone |
| `address` | Yes | string | Full street address |
| `landmark` | No | string | Nearby landmark |
| `pincode` | Yes | string | 6-digit Indian pincode (`^[1-9][0-9]{5}$`) |
| `city` | Yes | string | City |
| `state` | Yes | string | State |
| `country` | Yes | string | Must be `"India"` for API submission |

### International orders

When `country !== "India"`:

- Frontend **does not** call `POST /api/orders`
- User sees: *"For international orders, please contact us on WhatsApp"*
- WhatsApp: **+91 63632 50586** (`https://wa.me/916363250586`)
- Pre-filled message includes cart item names and quantities

Backend does not need an international order endpoint for v1.

---

## Create order — `POST /api/orders`

**Auth required:** No

### Request body

Prices are **GST-inclusive (5%)**. Frontend now also sends a place-of-supply tax block (`taxType`, CGST/SGST or IGST). Full rules: [GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md).

```json
{
  "customer": {
    "name": "Priya Sharma",
    "contactNumber": "+91 98765 43210",
    "alternateNumber": "+91 91234 56789",
    "address": "42, Temple Road, Jayanagar 4th Block",
    "landmark": "Near Nimma Ashwini Store",
    "pincode": "560041",
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India"
  },
  "items": [
    {
      "productId": "6a475c66b203bc97e100aaa1",
      "slug": "herbal-hair-oil",
      "name": "Herbal Hair Oil",
      "variantId": "250ml",
      "variantLabel": "250 ml",
      "quantity": 1,
      "unitPrice": 750,
      "taxRate": 5,
      "taxType": "cgst_sgst",
      "taxable": 714.29,
      "taxAmount": 35.71,
      "cgstRate": 2.5,
      "sgstRate": 2.5,
      "igstRate": 0,
      "cgstAmount": 17.86,
      "sgstAmount": 17.85,
      "igstAmount": 0,
      "lineTotal": 750
    }
  ],
  "taxableAmount": 714.29,
  "taxAmount": 35.71,
  "taxType": "cgst_sgst",
  "cgstAmount": 17.86,
  "sgstAmount": 17.85,
  "igstAmount": 0,
  "cgstRate": 2.5,
  "sgstRate": 2.5,
  "igstRate": 0,
  "taxRate": 5,
  "subtotal": 750,
  "discountAmount": 0,
  "totalAmount": 750,
  "currency": "INR",
  "orderType": "domestic"
}
```

Optional coupon (see [COUPON_SCHEMA.md](./COUPON_SCHEMA.md)):

```json
{
  "couponCode": "ASHW7K2M9P",
  "subtotal": 1500,
  "discountAmount": 225,
  "totalAmount": 1275
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `couponCode` | No | Uppercase coupon code when applied at checkout |
| `discountAmount` | No | Inclusive INR discount (client preview; **backend recomputes**) |
| `subtotal` | Yes | Sum of line totals **before** discount (GST-inclusive) |
| `totalAmount` | Yes | Payable after discount (GST-inclusive) |

When a coupon is applied, recompute the order-level tax block from the **payable** inclusive `totalAmount`. Line items remain full-price product snapshots.

Backend should **persist** this tax block (or recompute from inclusive amounts + `customer.state`). Do not add GST on top of `unitPrice`. Re-validate any `couponCode` server-side.

---

## Field reference

### `customer` object

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `name` | Yes | string | Non-empty, trimmed |
| `contactNumber` | Yes | string | Valid phone format |
| `alternateNumber` | No | string | Valid phone if provided |
| `address` | Yes | string | Non-empty |
| `landmark` | No | string | — |
| `pincode` | Yes | string | 6-digit Indian pincode when `country` is India |
| `city` | Yes | string | Non-empty |
| `state` | Yes | string | Non-empty |
| `country` | Yes | string | Must be `"India"` for v1 API acceptance |

### `items[]` — order line item

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `productId` | Yes | string | Product MongoDB `_id` |
| `slug` | Yes | string | Product slug (snapshot) |
| `name` | Yes | string | Product name at order time |
| `variantId` | Yes | string | Matches `quantities[].value` |
| `variantLabel` | No | string | Display label (e.g. `"250 ml"`) |
| `quantity` | Yes | number | Integer ≥ 1 |
| `unitPrice` | Yes | number | INR per unit (snapshot from cart) |
| `lineTotal` | Yes | number | `unitPrice × quantity` |

### Order-level fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `subtotal` | Yes | number | Sum of all `lineTotal` values (pre-discount) |
| `discountAmount` | No | number | Coupon discount in INR (inclusive); 0 if none |
| `couponCode` | No | string | Applied coupon code |
| `totalAmount` | Yes | number | Payable after discount |
| `currency` | Yes | string | Always `"INR"` for now |
| `orderType` | Yes | string | Always `"domestic"` for API v1 |

---

## Success response — `201 Created`

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "6a476abc123def4567890123",
    "orderNumber": "NA-2026-00042",
    "status": "pending",
    "customer": {
      "name": "Priya Sharma",
      "contactNumber": "+91 98765 43210",
      "alternateNumber": "+91 91234 56789",
      "address": "42, Temple Road, Jayanagar 4th Block",
      "landmark": "Near Nimma Ashwini Store",
      "pincode": "560041",
      "city": "Bengaluru",
      "state": "Karnataka",
      "country": "India"
    },
    "items": [],
    "subtotal": 1650,
    "currency": "INR",
    "orderType": "domestic",
    "createdAt": "2026-07-03T10:15:00.000Z"
  }
}
```

Frontend uses `data.id` or `data.orderNumber` on the success page, then clears the cart.

---

## Error responses

| Status | When |
|--------|------|
| `400` | Validation failed (invalid pincode, empty items, price mismatch) |
| `404` | Product or variant not found |
| `409` | Insufficient stock |
| `422` | `country` is not India (if backend enforces domestic-only) |

Example:

```json
{
  "success": false,
  "message": "Insufficient stock for Herbal Hair Oil (250 ml)",
  "errors": {
    "items.0.quantity": "Only 0 units available"
  }
}
```

---

## Backend validation (recommended)

1. **`items`** must contain at least 1 line
2. **`customer.country`** must be `"India"` for v1
3. **`customer.pincode`** must match Indian 6-digit format
4. Re-fetch each product by `productId` — must be `isActive: true`
5. Resolve `variantId` against `product.quantities[].value`
6. Verify `unitPrice` matches variant price (or log snapshot difference)
7. Verify `quantity` ≤ variant `maxQuantityPerOrder` and ≤ available stock
8. Recompute `lineTotal` and `subtotal` server-side — reject if client totals differ
9. If `couponCode` present: re-validate, recompute `discountAmount` / `totalAmount`, persist coupon on order (see [COUPON_SCHEMA.md](./COUPON_SCHEMA.md))
10. Decrement stock on successful order (variant + total product stock)

---

## MongoDB schema (suggested)

```javascript
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  variantId: { type: String, required: true },
  variantLabel: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  alternateNumber: { type: String, trim: true },
  address: { type: String, required: true, trim: true },
  landmark: { type: String, trim: true },
  pincode: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  country: { type: String, required: true, default: 'India' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  customer: { type: customerSchema, required: true },
  items: { type: [orderItemSchema], required: true, validate: v => v.length > 0 },
  subtotal: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  orderType: { type: String, enum: ['domestic'], default: 'domestic' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });
```

---

## Order status lifecycle (suggested)

| Status | Meaning |
|--------|---------|
| `pending` | Order received, awaiting team confirmation |
| `confirmed` | Team confirmed via phone/WhatsApp |
| `shipped` | Dispatched |
| `delivered` | Completed |
| `cancelled` | Cancelled |

---

## Admin endpoints (future)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/orders` | List orders (paginated) |
| `GET` | `/api/admin/orders/{id}` | Order detail |
| `PATCH` | `/api/admin/orders/{id}` | Update status |

Not required for storefront v1 but recommended for operations.

---

## Payment (future)

Current flow is **cash on delivery / manual payment** — no payment gateway in v1.

Optional future fields:

```json
{
  "paymentMethod": "cod",
  "paymentStatus": "pending"
}
```

---

## International orders (operations)

| Channel | Handling |
|---------|----------|
| Website | Blocked — WhatsApp redirect only |
| WhatsApp | Manual order entry by admin team |
| Future | `orderType: "international"` + separate shipping quote API |

WhatsApp contact: **+91 63632 50586**

---

## Frontend files (reference)

| File | Role |
|------|------|
| `src/pages/CartPage.jsx` | Cart view |
| `src/pages/CheckoutPage.jsx` | Delivery form + international handling |
| `src/pages/OrderSuccessPage.jsx` | Confirmation |
| `src/api/orders.js` | `POST /api/orders` |
| `src/lib/order.js` | Payload builder + validation |
| `src/lib/checkout.js` | Country list + WhatsApp helpers |
| `src/context/CartContext.jsx` | Cart state + localStorage |

---

## Checklist for backend

- [ ] Implement `POST /api/orders` with request shape above
- [ ] Return `id` and/or `orderNumber` on success
- [ ] Validate India-only orders (`country === "India"`)
- [ ] Validate Indian pincode format
- [ ] Re-validate products, variants, prices, and stock server-side
- [ ] Generate unique `orderNumber` from the shared invoice sequence (`NA-YYYY-NNNNN`) — see [INVOICE_NUMBER_SCHEMA.md](./INVOICE_NUMBER_SCHEMA.md); same counter as admin manual orders
- [ ] Store customer shipping snapshot on order document
- [ ] (Optional) Admin list/detail endpoints for order management
