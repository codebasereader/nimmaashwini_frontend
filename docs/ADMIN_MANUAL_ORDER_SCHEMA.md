# Admin Manual Order Schema — Backend Contract

Schema for **creating customer orders from the admin panel** (offline / walk-in / phone sales).

**Audience:** Backend team  
**Status:** Proposed — frontend implemented against this contract  
**Related:** [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md), [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md), [INSIGHTS_SCHEMA.md](./INSIGHTS_SCHEMA.md), **[GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md)** (CGST+SGST vs IGST), **[INVOICE_NUMBER_SCHEMA.md](./INVOICE_NUMBER_SCHEMA.md)** (shared `orderNumber` / invoice sequence)

---

## Summary

| Area | Detail |
|------|--------|
| Endpoint | `POST /api/admin/orders` |
| Auth | Admin JWT required |
| Currency | INR |
| GST | Fixed **5%** already included in catalog `unitPrice`. Split by place of supply: **Karnataka → CGST 2.5% + SGST 2.5%**; **other states → IGST 5%**. Never add tax on top. See [GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md). |
| Defaults on create | `status: "completed"`, `paymentStatus: "COMPLETED"`, `manual_entry: true` |
| Revenue | Grand total (`totalAmount` / `subtotal`) **must** be included in Insights revenue |

Public checkout (`POST /api/orders`) starts PhonePe and must **not** be reused for admin manual entry.

---

## Why a separate create endpoint

| Concern | Public `POST /api/orders` | Admin `POST /api/admin/orders` |
|---------|---------------------------|--------------------------------|
| Auth | Guest | Admin JWT |
| Payment | PhonePe redirect | Already collected (cash / UPI / offline) |
| Status | Usually `pending` until paid | Immediately `completed` |
| Payment status | `initiated` → gateway | Immediately `COMPLETED` |
| GST breakdown | Same place-of-supply split as admin | Required (`taxType` + CGST/SGST **or** IGST) |
| Flag | N/A | `manual_entry: true` (required) |
| Order date | Server `createdAt` | Client-supplied `orderDate` allowed |

---

## Auth

```http
Authorization: Bearer <admin_jwt_token>
```

| HTTP | Meaning |
|------|---------|
| `401` | Missing / invalid token |
| `403` | Logged in but not an admin |

---

## Create manual order — `POST /api/admin/orders`

### Request body

```json
{
  "orderDate": "2026-08-04",
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
      "quantity": 2,
      "unitPrice": 750,
      "taxRate": 5,
      "taxable": 1428.57,
      "taxAmount": 71.43,
      "cgstRate": 2.5,
      "sgstRate": 2.5,
      "cgstAmount": 35.72,
      "sgstAmount": 35.71,
      "lineTotal": 1500
    }
  ],
  "taxableAmount": 1428.57,
  "taxAmount": 71.43,
  "cgstAmount": 35.72,
  "sgstAmount": 35.71,
  "cgstRate": 2.5,
  "sgstRate": 2.5,
  "taxRate": 5,
  "subtotal": 1500,
  "totalAmount": 1500,
  "currency": "INR",
  "orderType": "domestic",
  "status": "completed",
  "paymentStatus": "COMPLETED",
  "manual_entry": true
}
```

---

## Field reference

### Order-level fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `orderDate` | Yes | string | Business date `YYYY-MM-DD`. Used for reporting / Insights day buckets. Persist as date (or midnight in business TZ). |
| `customer` | Yes | object | Same shape as public checkout customer |
| `items` | Yes | array | At least one line item |
| `taxableAmount` | Yes | number | Sum of line `taxable` |
| `taxAmount` | Yes | number | Sum of line `taxAmount` (= CGST + SGST) |
| `cgstAmount` | Yes | number | Sum of line `cgstAmount` |
| `sgstAmount` | Yes | number | Sum of line `sgstAmount` |
| `cgstRate` | Yes | number | Always `2.5` for v1 |
| `sgstRate` | Yes | number | Always `2.5` for v1 |
| `taxRate` | Yes | number | Always `5` for v1 |
| `subtotal` | Yes | number | Grand total including GST (same as `totalAmount`) |
| `totalAmount` | Yes | number | Grand total including GST — **use this for revenue** |
| `currency` | Yes | string | `"INR"` |
| `orderType` | Yes | string | `"domestic"` (or `"international"` if country ≠ India) |
| `status` | Yes | string | Frontend always sends `"completed"` |
| `paymentStatus` | Yes | string | Frontend always sends `"COMPLETED"` |
| `manual_entry` | Yes | boolean | Frontend always sends `true`. **Must be stored.** |

### `customer` object

Same validation as [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md):

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `name` | Yes | string | Non-empty |
| `contactNumber` | Yes | string | `/^\+?[\d\s-]{10,15}$/` |
| `alternateNumber` | No | string | Same phone regex if present |
| `address` | Yes | string | Non-empty |
| `landmark` | No | string | — |
| `pincode` | Yes | string | `/^[1-9][0-9]{5}$/` for India |
| `city` | Yes | string | Non-empty |
| `state` | Yes | string | Non-empty |
| `country` | Yes | string | Default `"India"` |

### `items[]` — line item

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `productId` | Yes | string | Catalog product MongoDB `_id` |
| `slug` | Yes | string | Snapshot |
| `name` | Yes | string | Snapshot |
| `variantId` | Yes | string | Matches catalog `quantities[].value` |
| `variantLabel` | No | string | Display label (e.g. `"250 ml"`) |
| `quantity` | Yes | number | Integer ≥ 1 |
| `unitPrice` | Yes | number | **GST-inclusive** unit price (INR). Catalog price already includes 5% tax — do **not** add tax on top. |
| `taxRate` | Yes | number | `5` |
| `taxable` | Yes | number | Inclusive line total ÷ `1.05` |
| `taxAmount` | Yes | number | `lineTotal − taxable` (extracted, not added) |
| `cgstRate` | Yes | number | `2.5` |
| `sgstRate` | Yes | number | `2.5` |
| `cgstAmount` | Yes | number | Half of `taxAmount` (rounded) |
| `sgstAmount` | Yes | number | `taxAmount - cgstAmount` |
| `lineTotal` | Yes | number | `unitPrice × quantity` (same as paid amount; already includes GST) |

---

## GST rules (tax-inclusive prices + place of supply)

Catalog / admin unit prices are **all-inclusive of 5% GST**. Backend and frontend only **split** the included tax for reporting — they must **never** multiply by 1.05 again.

**Authoritative place-of-supply rules (CGST+SGST vs IGST):** [GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md).

```
lineTotal  = round2(unitPrice * quantity)          // paid amount (incl. GST)
taxable    = round2(lineTotal / 1.05)               // excl. GST portion
taxAmount  = round2(lineTotal - taxable)           // included 5%

# if customer.state is Karnataka:
cgstAmount = round2(taxAmount / 2)
sgstAmount = round2(taxAmount - cgstAmount)
igstAmount = 0
taxType    = "cgst_sgst"

# else (other state):
igstAmount = taxAmount
cgstAmount = sgstAmount = 0
taxType    = "igst"
```

Document totals:

```
taxableAmount = Σ line.taxable
taxAmount     = Σ line.taxAmount
cgstAmount    = Σ line.cgstAmount
sgstAmount    = Σ line.sgstAmount
igstAmount    = Σ line.igstAmount
subtotal = totalAmount = Σ line.lineTotal
```

`round2` = round to 2 decimal places (banker’s / half-up is fine if consistent).

**Do not** add 5% on top of `unitPrice` / `lineTotal`.

---

## Server-side behaviour (required)

On successful create, backend **must**:

1. **Persist** all request fields, including `manual_entry: true`.
2. Generate `orderNumber` from the **shared invoice sequence** (same series as online orders, e.g. `NA-2026-00043`). See [INVOICE_NUMBER_SCHEMA.md](./INVOICE_NUMBER_SCHEMA.md) — do not invent a separate manual series.
3. Force (or accept and keep):
   - `status = "completed"`
   - `paymentStatus = "COMPLETED"`
   - `manual_entry = true`
4. Set `createdAt` / `updatedAt` to now.
5. Prefer storing `orderDate` separately from `createdAt` so back-dated manual sales report on the chosen business day.
6. **Skip PhonePe** / payment gateway entirely.
7. Optionally decrement catalog stock for each `(productId, variantId)` — same rules as fulfilled online orders if that already exists.
8. **Add `totalAmount` to revenue** used by Insights:
   - Include when `status === "completed"` **and** `paymentStatus === "COMPLETED"`
   - Exclude when later marked `cancelled`
9. Return the full order document (same shape as `GET /api/admin/orders/{id}`).

### Recommended defaults if client omits flags

| Field | Default |
|-------|---------|
| `manual_entry` | `true` (this endpoint only) |
| `status` | `completed` |
| `paymentStatus` | `COMPLETED` |
| `currency` | `INR` |
| `taxRate` | `5` |
| `cgstRate` / `sgstRate` | `2.5` / `2.5` |

Online orders from `POST /api/orders` must continue to store `manual_entry: false` (or omit / default false).

---

## Success response — `201 Created`

```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "id": "6a476abc123def4567890999",
    "orderNumber": "NA-2026-00043",
    "orderDate": "2026-08-04",
    "status": "completed",
    "paymentStatus": "COMPLETED",
    "manual_entry": true,
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
        "quantity": 2,
        "unitPrice": 750,
        "taxRate": 5,
        "taxable": 1428.57,
        "taxAmount": 71.43,
        "cgstRate": 2.5,
        "sgstRate": 2.5,
        "cgstAmount": 35.72,
        "sgstAmount": 35.71,
        "lineTotal": 1500
      }
    ],
    "taxableAmount": 1428.57,
    "taxAmount": 71.43,
    "cgstAmount": 35.72,
    "sgstAmount": 35.71,
    "cgstRate": 2.5,
    "sgstRate": 2.5,
    "taxRate": 5,
    "subtotal": 1500,
    "totalAmount": 1500,
    "currency": "INR",
    "orderType": "domestic",
    "createdAt": "2026-08-04T10:15:00.000Z",
    "updatedAt": "2026-08-04T10:15:00.000Z"
  }
}
```

---

## Error responses

| HTTP | When |
|------|------|
| `400` | Validation failure (missing customer fields, empty items, bad pincode, negative amounts, tax mismatch) |
| `401` | Unauthorized |
| `403` | Not admin |
| `404` | `productId` not found (if you validate catalog refs) |
| `409` | Insufficient stock (if you enforce stock) |

### Field errors shape (recommended)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "customer.contactNumber": "Enter a valid contact number",
    "items": "At least one item is required"
  }
}
```

Prefix customer keys with `customer.` so the admin form can map them the same way as checkout.

---

## MongoDB / document model additions

Extend the existing Order document:

```js
{
  // …existing fields (orderNumber, customer, items, status, paymentStatus, …)

  orderDate: Date,          // NEW — business date for manual + optionally online
  manual_entry: Boolean,    // NEW — default false; true for admin create

  // Tax block — required for manual_entry orders; optional/null for legacy online
  taxableAmount: Number,
  taxAmount: Number,
  cgstAmount: Number,
  sgstAmount: Number,
  cgstRate: Number,
  sgstRate: Number,
  taxRate: Number,
  totalAmount: Number,      // GST-inclusive grand total (revenue source)

  items: [{
    // …existing productId, slug, name, variantId, variantLabel, quantity, unitPrice, lineTotal
    taxRate: Number,
    taxable: Number,
    taxAmount: Number,
    cgstRate: Number,
    sgstRate: Number,
    cgstAmount: Number,
    sgstAmount: Number,
  }],
}
```

### Indexes

| Index | Purpose |
|-------|---------|
| `{ manual_entry: 1, orderDate: -1 }` | Filter / report manual sales |
| `{ status: 1, paymentStatus: 1, orderDate: -1 }` | Revenue aggregates |
| Existing `{ createdAt: -1 }` | Admin list sorting |

---

## Revenue / Insights contract

Insights aggregations (`GET /api/admin/insights`, product analysis, weekly revenue) must:

1. Sum **`totalAmount`** (fallback to `subtotal` for legacy online orders without tax block).
2. Include an order only when:
   - `status === "completed"`
   - `paymentStatus === "COMPLETED"`
3. Exclude `status === "cancelled"`.
4. Bucket by **`orderDate`** when present, else `createdAt` (date in business timezone).
5. Treat `manual_entry: true` orders the same as paid online completed orders for revenue (do not exclude them).

Optional future filter: `?source=manual|online` using `manual_entry`.

---

## List / detail compatibility

`GET /api/admin/orders` and `GET /api/admin/orders/{id}` should return the new fields when present:

- `manual_entry`
- `orderDate`
- `taxableAmount`, `taxAmount`, `cgstAmount`, `sgstAmount`, `taxRate`, `totalAmount`
- Per-item tax fields

Admin list UI shows a **Manual** badge when `manual_entry === true`.

Date filters (`fromDate` / `toDate`) should prefer `orderDate` when set, otherwise `createdAt`.

---

## Frontend integration notes

| UI piece | Behaviour |
|----------|-----------|
| Add Order | 90% width drawer |
| Customer | Same fields as public checkout |
| Lines | Catalog products + quantity variants; qty changes recompute 5% GST |
| Save | `POST /api/admin/orders` with payload above |
| After save | Refresh order list |

No separate “revenue” API call — revenue is a **side effect** of persisting a completed paid order.

---

## Acceptance checklist (backend)

- [ ] `POST /api/admin/orders` requires admin JWT
- [ ] Stores `manual_entry: true`
- [ ] Stores `status: completed` and `paymentStatus: COMPLETED`
- [ ] Stores GST totals and CGST/SGST split
- [ ] Does not call PhonePe
- [ ] Generates `orderNumber` from shared invoice sequence ([INVOICE_NUMBER_SCHEMA.md](./INVOICE_NUMBER_SCHEMA.md)) — same counter as online orders
- [ ] Returns full order in `201` response
- [ ] Insights revenue includes the order’s `totalAmount`
- [ ] Cancelling later removes it from revenue
- [ ] Online orders remain `manual_entry: false` (or unset)
