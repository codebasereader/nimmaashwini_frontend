# Customer Data (Phone-keyed CRM) — Backend Schema

**Audience:** Backend team  
**Status:** Proposed — frontend implemented against this contract  
**Admin UI:** `/admin/customers` (Customer Data)  
**Related:** [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md), [ADMIN_MANUAL_ORDER_SCHEMA.md](./ADMIN_MANUAL_ORDER_SCHEMA.md), [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md), [INSIGHTS_SCHEMA.md](./INSIGHTS_SCHEMA.md)

This document defines a **Customer** registry keyed by mobile number. Shoppers never log in and never get a dashboard. On every order (public checkout + admin manual), the backend finds or creates a Customer by **normalized phone**, links the order, and the admin Customer Data page shows name, phone, linked invoices/orders, and product-wise purchase stats.

This is **not** Master Data → Users (`/admin/users` — admin panel accounts).

---

## 1. Goals

| Goal | Behaviour |
|------|-----------|
| Identity | One Customer per normalized mobile (`contactNumber`) |
| No shopper auth | No password, OTP, role, or storefront session |
| Repeat orders | Same phone → same Customer; `orderCount` grows |
| Admin search | Find a member and see how many orders / which invoices / which products |
| Order snapshots | Keep embedded `order.customer` for invoices / GSTR-1; also store `order.customerId` |

---

## 2. Phone normalization (mandatory)

Apply the same function everywhere (order create, backfill, search indexing):

```text
1. Take customer.contactNumber (raw string)
2. Keep digits only: replace /[^\d]/g with ""
3. If length > 10, use the last 10 digits
4. Result is `phone` (unique identity key)
```

| Raw input | Normalized `phone` |
|-----------|--------------------|
| `+91 98765 43210` | `9876543210` |
| `9876543210` | `9876543210` |
| `09876543210` | `9876543210` |
| `919876543210` | `9876543210` |

Also store `phoneDisplay` as the **latest raw** `contactNumber` string for UI.

**Do not** use `alternateNumber` for identity or matching.

**Reject / skip upsert** if after normalization `phone` is empty or shorter than 10 digits (order may still be created, but log a warning — prefer validating phone on checkout so this is rare).

---

## 3. Duplicate handling

**One Customer row per normalized `phone`.** Enforce with a **unique index** on `phone`.

| Situation | Result |
|-----------|--------|
| Same number, different formatting | Same Customer |
| Same number, different name/address on a new order | Same Customer; overwrite profile with **latest** checkout values; historical order snapshots unchanged |
| Same display name, different phones | Two Customers |
| Same person later uses a second phone | Two Customers (no merge API in v1) |
| Concurrent first orders for same phone | Atomic upsert — never two rows |

### Race-safe upsert (required)

Use an atomic upsert on `phone` (e.g. MongoDB `updateOne({ phone }, { $set: …, $setOnInsert: … }, { upsert: true })` or equivalent). Do **not** do find-then-insert without a unique index — two concurrent first-time orders must not create duplicates.

---

## 4. Customer entity

```json
{
  "id": "ObjectId",
  "phone": "9876543210",
  "phoneDisplay": "+91 98765 43210",
  "name": "Priya Sharma",
  "address": {
    "line1": "42, Temple Road, Jayanagar 4th Block",
    "landmark": "Near Nimma Ashwini Store",
    "pincode": "560041",
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India"
  },
  "orderCount": 5,
  "completedOrderCount": 4,
  "totalSpent": 6200.00,
  "firstOrderAt": "2026-08-04T10:00:00.000Z",
  "lastOrderAt": "2026-08-09T14:30:00.000Z",
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `phone` | string | Normalized, **unique**, required |
| `phoneDisplay` | string | Latest raw contact number |
| `name` | string | Latest checkout name |
| `address` | object | Latest shipping snapshot (optional fields as available) |
| `orderCount` | number | Count of **all** orders with this `customerId` (any status) |
| `completedOrderCount` | number | Orders with `status: "completed"` **and** `paymentStatus: "COMPLETED"` |
| `totalSpent` | number | Sum of `totalAmount` (or `subtotal`) for completed+paid orders only |
| `firstOrderAt` / `lastOrderAt` | datetime | From linked orders (`orderDate` or `createdAt`) |

No password, email login, role, or auth tokens on this entity.

---

## 5. Order linking

On every successful create of:

- `POST /api/orders` (public checkout)
- `POST /api/admin/orders` (manual / offline)

After validating the order payload:

1. Normalize `customer.contactNumber` → `phone`
2. Upsert Customer (set name, phoneDisplay, address from this checkout; bump `updatedAt`)
3. Persist on the order:
   - `customerId` → Customer `id`
   - Keep existing embedded `customer` object unchanged in shape (GSTR-1 / invoices)

When payment completes or order status changes (PhonePe webhook / admin status update):

- Recompute that Customer’s `orderCount`, `completedOrderCount`, `totalSpent`, `firstOrderAt`, `lastOrderAt` from linked orders  
  **or** incrementally adjust counters (must stay consistent).

Manual admin orders that are created already `completed` + `COMPLETED` should update completed metrics immediately on create.

### Suggested order field addition

```json
{
  "customerId": "ObjectId",
  "customer": { "...existing snapshot..." }
}
```

Return `customerId` on `GET /api/admin/orders/:id` when present.

---

## 6. Auth & envelope

- Auth: Admin JWT (`Authorization: Bearer <token>`) on all `/api/admin/customers*` routes
- Success: `{ "success": true, "data": { ... } }`
- List may use `{ items, pagination }` inside `data`
- Errors: `401` / `403` as usual; `404` when customer id not found; `400` for bad query params

---

## 7. Admin APIs

### 7.1 List customers

`GET /api/admin/customers?search=&page=&limit=&sort=`

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `search` | No | string | Match `name`, `phone`, `phoneDisplay` (normalize digits in query for phone match) |
| `page` | No | number | Default `1` |
| `limit` | No | number | Default `25` (max 100) |
| `sort` | No | string | Default `lastOrderAt:desc`. Allow `lastOrderAt:asc`, `orderCount:desc`, `name:asc`, `totalSpent:desc` |

**List item** (slim):

```json
{
  "id": "ObjectId",
  "name": "Priya Sharma",
  "phone": "9876543210",
  "phoneDisplay": "+91 98765 43210",
  "orderCount": 5,
  "completedOrderCount": 4,
  "totalSpent": 6200.00,
  "firstOrderAt": "2026-08-04T10:00:00.000Z",
  "lastOrderAt": "2026-08-09T14:30:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [ /* list items */ ],
    "pagination": {
      "total": 120,
      "page": 1,
      "limit": 25,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 7.2 Get customer by ID (required for detail drawer)

`GET /api/admin/customers/:id`

Must return full profile + linked orders + product aggregates. Frontend does **not** rebuild this from the list row alone.

```json
{
  "success": true,
  "data": {
    "id": "ObjectId",
    "name": "Priya Sharma",
    "phone": "9876543210",
    "phoneDisplay": "+91 98765 43210",
    "address": {
      "line1": "42, Temple Road",
      "landmark": "Near store",
      "pincode": "560041",
      "city": "Bengaluru",
      "state": "Karnataka",
      "country": "India"
    },
    "orderCount": 5,
    "completedOrderCount": 4,
    "totalSpent": 6200.00,
    "firstOrderAt": "2026-08-04T10:00:00.000Z",
    "lastOrderAt": "2026-08-09T14:30:00.000Z",
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime",
    "orders": [
      {
        "orderId": "ObjectId",
        "orderNumber": "NA-2026-00042",
        "orderDate": "2026-08-04",
        "status": "completed",
        "paymentStatus": "COMPLETED",
        "totalAmount": 1500.00,
        "placeOfSupply": "Karnataka"
      }
    ],
    "products": [
      {
        "productName": "Herbal Hair Oil",
        "orderCount": 3,
        "totalQuantity": 5,
        "totalValue": 3750.00
      }
    ]
  }
}
```

#### `orders[]` (invoices)

| Field | Derivation |
|-------|------------|
| `orderId` | Order `_id` |
| `orderNumber` | Invoice number (same as GSTR-1) |
| `orderDate` | `order.orderDate` or `createdAt` as `YYYY-MM-DD` |
| `status` / `paymentStatus` | As stored |
| `totalAmount` | `order.totalAmount \|\| order.subtotal` |
| `placeOfSupply` | `order.customer.state` (normalized display name ok) |

Sort: `orderDate` descending, then `orderNumber` descending. Include **all** linked orders (any status) so admin can see pending/cancelled too.

#### `products[]`

Group all line items from linked orders by snapshot `item.name`:

| Field | Derivation |
|-------|------------|
| `productName` | `item.name` |
| `orderCount` | Number of **distinct orders** that contain this product name |
| `totalQuantity` | `Σ item.quantity` |
| `totalValue` | `Σ item.lineTotal` (GST-inclusive) |

Sort: `productName` ascending. Prefer completed+paid lines only for `totalQuantity` / `totalValue` / product `orderCount` **or** document clearly if all statuses are included — **frontend expects completed+paid only** for product aggregates so spend matches `totalSpent`.

---

### 7.3 Backfill existing orders

`POST /api/admin/customers/backfill`

One-shot (or idempotent) rebuild for orders that predate `customerId`:

1. Scan all orders with a `customer.contactNumber`
2. Normalize phone → upsert Customer
3. Set `order.customerId`
4. Recompute all Customer counters from linked orders

**Response:**

```json
{
  "success": true,
  "data": {
    "ordersProcessed": 320,
    "customersCreated": 180,
    "customersUpdated": 40,
    "ordersLinked": 318,
    "skippedInvalidPhone": 2
  }
}
```

Safe to re-run: linking the same order again must not double-count.

---

## 8. Upsert algorithm (pseudo)

```text
onOrderCreate(orderPayload):
  phone = normalizePhone(orderPayload.customer.contactNumber)
  if !phone: create order without customerId; return

  customer = atomicUpsert by phone:
    set: name, phoneDisplay, address snapshot, updatedAt
    setOnInsert: phone, firstOrderAt = now, createdAt
    // counters recomputed after order is saved

  order.customerId = customer.id
  save order (with embedded customer snapshot)

  recomputeCustomerStats(customer.id)
```

```text
recomputeCustomerStats(customerId):
  orders = find all where customerId
  completed = orders where status == completed AND paymentStatus == COMPLETED
  set:
    orderCount = orders.length
    completedOrderCount = completed.length
    totalSpent = sum(completed.totalAmount)
    firstOrderAt = min(order dates)
    lastOrderAt = max(order dates)
```

---

## 9. Indexes

| Index | Purpose |
|-------|---------|
| Unique on `Customer.phone` | Dedup / upsert |
| `Customer.name` (text or case-insensitive) | Search |
| `Order.customerId` | Detail + stats |
| `Order.customer.contactNumber` (optional) | Backfill / legacy search |

---

## 10. Acceptance checklist

- [ ] Unique index on `Customer.phone`
- [ ] Public + admin order create both upsert and set `customerId`
- [ ] Same normalized phone + different names → one Customer; name = latest
- [ ] Different phones → different Customers even if names match
- [ ] `GET /api/admin/customers` supports search + pagination
- [ ] `GET /api/admin/customers/:id` returns `orders[]` and `products[]`
- [ ] `orderNumber` exposed as invoice link
- [ ] Product aggregates use completed + paid orders
- [ ] `totalSpent` / `completedOrderCount` use completed + paid only
- [ ] `POST /api/admin/customers/backfill` is idempotent
- [ ] No shopper login / Customer auth endpoints

---

## 11. Frontend already expecting

| Surface | Behaviour |
|---------|-----------|
| Admin → Customer Data | Lists customers; search by name/phone; paginates |
| Row click / View | `GET /api/admin/customers/:id` → detail drawer |
| Detail → Orders / Invoices | Renders `orders[]`; order # can open existing order detail |
| Detail → Products | Renders `products[]` (name, order count, qty, value) |
| Optional | Admin may call backfill once after deploy (button or script) |
