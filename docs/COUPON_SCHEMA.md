# Coupon Codes — API Schema

**Audience:** Backend team  
**Status:** Proposed (frontend implemented against these contracts)  
**Auth:** Admin JWT on `/admin/coupons`; public validate has no auth  
**Related:** [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md), [CART_SCHEMA.md](./CART_SCHEMA.md), [PRODUCT_SCHEMA.md](./PRODUCT_SCHEMA.md), [COUPONS_AVAILABLE_SCHEMA.md](./COUPONS_AVAILABLE_SCHEMA.md)

Use this document to design schemas and CRUD APIs for **discount coupons** applied to catalog products at checkout.

---

## Critical: Edit flow = GET by ID

On every **Edit**, the frontend does **not** reuse the list-row object. It calls:

```http
GET /api/admin/coupons/{id}
Authorization: Bearer <admin_jwt_token>
```

and populates the form only after this response.

| UI action | API called first |
|-----------|------------------|
| Edit Coupon | `GET /api/admin/coupons/{id}` |

### GET by ID response shape

```json
{
  "success": true,
  "data": {
    "id": "ObjectId",
    "code": "ASHW7K2M9P",
    "discountType": "percent",
    "discountValue": 15,
    "appliesTo": "products",
    "productIds": ["6a475c66b203bc97e100aaa1"],
    "products": [{ "id": "6a475c66b203bc97e100aaa1", "name": "Herbal Hair Oil" }],
    "validDays": 30,
    "startsAt": "2026-08-21T00:00:00.000Z",
    "endsAt": "2026-09-20T00:00:00.000Z",
    "isActive": true,
    "maxUses": 100,
    "usedCount": 12,
    "createdAt": "2026-08-21T10:00:00.000Z",
    "updatedAt": "2026-08-21T10:00:00.000Z"
  }
}
```

### What list vs detail should return

| Endpoint | May be slim | Must include on GET by ID |
|----------|-------------|---------------------------|
| Coupons list | code, type/value, appliesTo, endsAt, isActive, usedCount/maxUses | full `productIds`, `validDays`, `startsAt`, notes if any |
| Coupons detail | — | all fields above |

If GET by ID is missing, **Edit will fail / stay loading** — implement these first.

---

## Auth

```http
Authorization: Bearer <admin_jwt_token>
```

| HTTP | Meaning |
|------|---------|
| `401` | Missing / invalid token |
| `403` | Logged in but not an admin |
| `404` | ID not found |
| `409` | Duplicate `code` |

All list responses should return either a bare array **or**:

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

---

## Coupon entity

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | — | MongoDB `_id` (alias `id` in API) |
| `code` | string | Yes | Unique, uppercase, trimmed; e.g. `ASHW7K2M9P` |
| `discountType` | `"amount"` \| `"percent"` | Yes | Fixed INR off or percentage |
| `discountValue` | number | Yes | `> 0`; if percent, max `100` |
| `appliesTo` | `"all"` \| `"products"` | Yes | Scope of discount |
| `productIds` | string[] | When `appliesTo === "products"` | Catalog product ObjectIds |
| `validDays` | number | Yes | Integer ≥ 1 |
| `startsAt` | ISO datetime | Yes | Default = create time |
| `endsAt` | ISO datetime | Yes | Server: `startsAt + validDays` (end of day recommended) |
| `isActive` | boolean | Yes | Default `true`; inactive codes always reject |
| `maxUses` | number \| null | No | `null` / omit = unlimited |
| `usedCount` | number | — | Server-managed; default `0`; increment on successful paid/confirmed order |

### Discount math (authoritative)

1. Build **eligible subtotal** = sum of `quantity × unitPrice` for cart lines whose `productId` is in `productIds`, or **all** lines if `appliesTo === "all"`.
2. If eligible subtotal is `0` → invalid for this cart (`message`: no eligible products).
3. If `discountType === "percent"` → `discountAmount = round2(eligibleSubtotal × discountValue / 100)`.
4. If `discountType === "amount"` → `discountAmount = min(discountValue, eligibleSubtotal)`.
5. Cap so `discountAmount ≤ order subtotal` (sum of all lines).
6. Catalog prices are **GST-inclusive**. After applying discount, recompute order tax from the reduced **inclusive** `totalAmount` (do not add GST on top).

Never trust client-sent `discountAmount` on order create — always recompute.

### Validity checks (validate + order)

Reject when any of:

- Code not found (normalize: trim + uppercase)
- `isActive === false`
- Now `< startsAt` or now `> endsAt`
- `maxUses != null` and `usedCount >= maxUses`
- No eligible lines in the submitted cart items

---

## Admin endpoints

### List — `GET /api/admin/coupons`

Query (optional): `page`, `limit`, `search` (code), `status` = `active` | `expired` | `inactive`

### Create — `POST /api/admin/coupons`

```json
{
  "code": "ASHW7K2M9P",
  "discountType": "percent",
  "discountValue": 15,
  "appliesTo": "products",
  "productIds": ["6a475c66b203bc97e100aaa1"],
  "validDays": 30,
  "startsAt": "2026-08-21T00:00:00.000Z",
  "isActive": true,
  "maxUses": 100
}
```

Server sets `endsAt` from `startsAt` + `validDays`. When `appliesTo === "all"`, ignore / clear `productIds`.

### Update — `PUT /api/admin/coupons/{id}`

Same body shape as create. Recalculate `endsAt` when `startsAt` or `validDays` change. Do **not** allow clients to set `usedCount`.

### Delete — `DELETE /api/admin/coupons/{id}`

Hard delete or soft-deactivate — prefer soft (`isActive: false`) if the code was already used on orders.

---

## Public validate — `POST /api/coupons/validate`

**Auth:** None

### Request

```json
{
  "code": "ASHW7K2M9P",
  "items": [
    {
      "productId": "6a475c66b203bc97e100aaa1",
      "quantity": 2,
      "unitPrice": 750
    }
  ]
}
```

### Success (valid)

```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "ASHW7K2M9P",
    "discountType": "percent",
    "discountValue": 15,
    "discountAmount": 225,
    "eligibleProductIds": ["6a475c66b203bc97e100aaa1"],
    "message": "Coupon applied"
  }
}
```

### Invalid (still 200 recommended, or 400)

```json
{
  "success": true,
  "data": {
    "valid": false,
    "code": "ASHW7K2M9P",
    "discountAmount": 0,
    "eligibleProductIds": [],
    "message": "This coupon has expired"
  }
}
```

Frontend shows `message` and only attaches the coupon to the order when `valid === true`.

---

## Public available — `POST /api/coupons/available`

**Auth:** None  

Full backend contract (request, response, algorithm, checklist): **[COUPONS_AVAILABLE_SCHEMA.md](./COUPONS_AVAILABLE_SCHEMA.md)**.

Returns **active, in-date coupons that give a positive discount** for the submitted cart. Used by checkout **View available** modal.

Frontend calls:

```http
POST /api/coupons/available
Content-Type: application/json
```

```json
{
  "items": [
    {
      "productId": "6a475c66b203bc97e100aaa1",
      "quantity": 2,
      "unitPrice": 750
    }
  ]
}
```

Until this route exists, checkout shows **Failed to fetch** / not found.

---

## Order create — coupon fields

Extend `POST /api/orders` (see [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md)):

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `couponCode` | No | string | Uppercase code; omit if none applied |
| `discountAmount` | No | number | Client preview only — **backend must recompute** |
| `subtotal` | Yes | number | Sum of line totals **before** discount (GST-inclusive) |
| `totalAmount` | Yes | number | `subtotal - discountAmount` (GST-inclusive payable) |

On accept:

1. Re-validate coupon against live cart items (same rules as `/coupons/validate`).
2. Set authoritative `discountAmount` and `totalAmount`.
3. Persist `couponCode`, `discountAmount` on the order.
4. Increment `usedCount` when the order is successfully created / payment confirmed (pick one policy and document it; recommended: on successful payment confirmation to avoid burning uses on abandoned PhonePe sessions).

Reject with `400` if `couponCode` is present but invalid.

---

## MongoDB schema (suggested)

```javascript
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["amount", "percent"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: {
      type: String,
      enum: ["all", "products"],
      required: true,
      default: "all",
    },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    validDays: { type: Number, required: true, min: 1 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);
```

Add optional order fields:

```javascript
couponCode: { type: String, uppercase: true, trim: true },
discountAmount: { type: Number, default: 0, min: 0 },
```

---

## Checklist for backend

- [ ] Admin CRUD + GET by ID
- [ ] Unique uppercase `code`
- [ ] Compute `endsAt` from `startsAt` + `validDays`
- [ ] `POST /api/coupons/validate`
- [ ] `POST /api/coupons/available` (eligible list for checkout modal)
- [ ] Re-validate on `POST /api/orders` when `couponCode` present
- [ ] Recompute `discountAmount` / `totalAmount` server-side
- [ ] Increment `usedCount` on confirmed use
- [ ] Never discount ineligible product lines
