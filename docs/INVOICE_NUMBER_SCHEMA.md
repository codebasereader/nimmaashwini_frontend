# Invoice Number Sequence — Backend Schema

**Audience:** Backend team  
**Status:** Proposed — frontend implemented against this contract  
**Admin UI:** `/admin/invoice-number` (Master Data → Invoice Number)  
**Related:** [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md), [ADMIN_MANUAL_ORDER_SCHEMA.md](./ADMIN_MANUAL_ORDER_SCHEMA.md), [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md), [GSTR1_FILING_SCHEMA.md](./GSTR1_FILING_SCHEMA.md)

This document defines the **shared invoice / order number sequence**. In this product, **`orderNumber` is the invoice number** (GSTR-1, customer invoices, admin Orders page all use the same value). There is no separate `invoiceNumber` field.

---

## Goals

| Goal | Behaviour |
|------|-----------|
| One series | Online checkout (`POST /api/orders`) and admin manual create (`POST /api/admin/orders`) share **one** counter |
| Controllable seed | Admin can set the **next** number; further invoices continue **upwards** from there |
| Fixed format | Every new number must match `NA-YYYY-NNNNN` — no other formats |
| No collisions | Atomic allocate + unique index on `order.orderNumber` |
| No side effects | Does **not** change tax, status, payment, customer upsert, Insights, or GSTR-1 math — only how `orderNumber` is generated |

---

## Format (mandatory)

```text
NA-YYYY-NNNNN
```

| Part | Rule | Example |
|------|------|---------|
| Prefix | Always `NA` (literal) | `NA` |
| Separator | Hyphen `-` | |
| Year | Exactly 4 digits | `2026` |
| Separator | Hyphen `-` | |
| Sequence | Exactly **5** digits, zero-padded | `00042` |

**Valid:** `NA-2026-00001`, `NA-2026-00042`, `NA-2027-10000`  
**Invalid:** `INV-2026-00001`, `NA-26-00001`, `NA-2026-42`, `NA-2026-000042`, `na-2026-00001`

Regex (server + client):

```text
^NA-\d{4}-\d{5}$
```

Do **not** accept lowercase, extra spaces, or alternate prefixes.

---

## Auth

```http
Authorization: Bearer <admin_jwt_token>
```

| HTTP | Meaning |
|------|---------|
| `401` | Missing / invalid token |
| `403` | Logged in but not an admin |
| `400` | Invalid format / validation failure |
| `409` | Next number would collide with an existing `orderNumber` |

---

## 1. Endpoint cheat sheet

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/invoice-settings` | Current sequence + last issued |
| `PUT` | `/api/admin/invoice-settings` | Set the **next** invoice number |

Public checkout and admin order create do **not** take a client-supplied `orderNumber`. The server always allocates from this sequence.

---

## 2. Settings entity shape

Returned by GET / PUT:

```json
{
  "prefix": "NA",
  "year": 2026,
  "nextSequence": 43,
  "padding": 5,
  "nextInvoiceNumber": "NA-2026-00043",
  "lastIssuedInvoiceNumber": "NA-2026-00042",
  "updatedAt": "2026-08-13T06:30:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `prefix` | string | Always `"NA"` |
| `year` | number | Year component of the next number |
| `nextSequence` | number | Integer sequence that will be used for the **next** allocation (1…99999) |
| `padding` | number | Always `5` |
| `nextInvoiceNumber` | string | Convenience: formatted next number (`NA-{year}-{pad(nextSequence)}`) |
| `lastIssuedInvoiceNumber` | string \| `null` | Last number successfully assigned to an order; `null` if none yet |
| `updatedAt` | ISO string | Last time settings were changed or a number was allocated |

Persist a single settings document (singleton), e.g. collection `invoiceSettings` with fixed `_id: "default"`.

---

## 3. GET — `GET /api/admin/invoice-settings`

### Success — `200`

```json
{
  "success": true,
  "message": "Invoice settings",
  "data": {
    "prefix": "NA",
    "year": 2026,
    "nextSequence": 43,
    "padding": 5,
    "nextInvoiceNumber": "NA-2026-00043",
    "lastIssuedInvoiceNumber": "NA-2026-00042",
    "updatedAt": "2026-08-13T06:30:00.000Z"
  }
}
```

### Bootstrap (first run)

If no settings document exists:

1. Scan existing orders for `orderNumber` matching `^NA-(\d{4})-(\d{5})$`.
2. Take the row with the **highest** `(year, sequence)`.
3. Seed:
   - If found: `year` = that year, `nextSequence` = sequence + 1, `lastIssuedInvoiceNumber` = that number.
   - If none: `year` = current calendar year (server local or IST), `nextSequence` = `1`, `lastIssuedInvoiceNumber` = `null`.
4. Persist and return.

Do **not** invent a second series. Do not change historical `orderNumber` values.

---

## 4. PUT — `PUT /api/admin/invoice-settings`

Admin sets the **next** number that will be issued. Subsequent invoices continue **upwards** (`+1` each time).

### Request body

```json
{
  "nextInvoiceNumber": "NA-2026-00100"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `nextInvoiceNumber` | **Yes** | Full next number in `NA-YYYY-NNNNN` format |

### Validation

1. Trim; reject if empty.
2. Must match `^NA-\d{4}-\d{5}$`.
3. Parse `year` and `sequence` (integer from the 5-digit part).
4. `sequence` must be `1…99999`.
5. **Collision:** If any order already has `orderNumber === nextInvoiceNumber`, return **`409`**.
6. Optionally (recommended): if any order exists with same year and a **higher** sequence than the requested next, still allow the set **only if** the exact next string is free — but prefer rejecting sets that would skip backwards into a gap that already has higher numbers issued for that year **only when** `nextInvoiceNumber` itself collides. Simplest safe rule: **reject only exact collisions** (`409`); allow jumping forward (e.g. from `00010` to `00100`).

### Success — `200`

```json
{
  "success": true,
  "message": "Invoice settings updated",
  "data": {
    "prefix": "NA",
    "year": 2026,
    "nextSequence": 100,
    "padding": 5,
    "nextInvoiceNumber": "NA-2026-00100",
    "lastIssuedInvoiceNumber": "NA-2026-00042",
    "updatedAt": "2026-08-13T06:41:00.000Z"
  }
}
```

`lastIssuedInvoiceNumber` is **unchanged** by PUT — it only updates when an order is created and a number is allocated.

### Errors

```json
{
  "success": false,
  "message": "Invoice number must match NA-YYYY-NNNNN (e.g. NA-2026-00001)",
  "errors": [{ "nextInvoiceNumber": "Invalid format" }]
}
```

```json
{
  "success": false,
  "message": "Invoice number NA-2026-00042 already exists on an order",
  "errors": [{ "nextInvoiceNumber": "Already used" }]
}
```

---

## 5. Allocation — used by BOTH order create paths

### Call sites (required)

| Endpoint | When |
|----------|------|
| `POST /api/orders` | Public checkout — on successful order create (before payment redirect is fine; number is reserved on the order document) |
| `POST /api/admin/orders` | Admin manual order — on successful create |

**Do not** allocate on status updates, payment webhooks alone, or cancelled drafts. Allocate **once** when the order document is first persisted with an `orderNumber`.

### Algorithm (atomic — required)

```text
1. Ensure settings document exists (bootstrap §3 if needed)
2. In one atomic update (findOneAndUpdate / transaction):
   a. Read current { prefix, year, nextSequence, padding }
   b. assigned = `${prefix}-${year}-${String(nextSequence).padStart(padding, "0")}`
   c. nextSequence = nextSequence + 1
      - If nextSequence would exceed 99999: reject create with 500/400 and alert — do not wrap silently
   d. lastIssuedInvoiceNumber = assigned
   e. updatedAt = now
3. Set order.orderNumber = assigned
4. Unique index on order.orderNumber must catch any race; on duplicate key, retry allocate once or fail cleanly
```

Pseudo (MongoDB-style):

```js
const updated = await InvoiceSettings.findOneAndUpdate(
  { _id: "default" },
  [
    {
      $set: {
        lastIssuedInvoiceNumber: {
          $concat: [
            "$prefix",
            "-",
            { $toString: "$year" },
            "-",
            {
              $substrCP: [
                { $concat: ["00000", { $toString: "$nextSequence" }] },
                { $subtract: [{ $strLenCP: { $concat: ["00000", { $toString: "$nextSequence" }] } }, 5] },
                5,
              ],
            },
          ],
        },
        nextSequence: { $add: ["$nextSequence", 1] },
        updatedAt: new Date(),
      },
    },
  ],
  { new: false }, // return pre-update doc to format assigned
);
// Format assigned from the pre-update nextSequence, then use it on the order.
```

Simpler acceptable approach: `findOneAndUpdate` with `$inc: { nextSequence: 1 }` returning the **pre-increment** document, then format from that document’s `year` / previous `nextSequence`.

### Manual vs online

| Path | Sequence |
|------|----------|
| Online `POST /api/orders` | Same counter |
| Manual `POST /api/admin/orders` | Same counter |

Example: settings next = `NA-2026-00100`

1. Admin creates manual order → `NA-2026-00100`, next becomes `00101`
2. Customer checks out online → `NA-2026-00101`, next becomes `00102`
3. Admin creates another → `NA-2026-00102`, …

No gaps intentionally from this feature (failed creates after allocation should either roll back the counter or leave a gap — **prefer allocate inside the same DB transaction as order insert** so a failed create does not consume a number).

### Client must not send `orderNumber`

- Ignore client-supplied `orderNumber` on create if present.
- Never let the storefront or admin form choose a custom format.

---

## 6. Year behaviour

- The **year in the number** is whatever was last set via PUT (or bootstrap), **not** necessarily “calendar year of orderDate”.
- Admin may set `NA-2027-00001` before financial-year rollover; then allocation continues in 2027 until they change it again.
- Do **not** auto-reset sequence on Jan 1 unless product later asks for it. Auto-reset would risk surprise duplicates; leave year changes to admin PUT.

---

## 7. Indexes

```text
orders.orderNumber          unique, required
invoiceSettings             singleton doc `_id: "default"`
```

---

## 8. What must NOT change

- Order tax / GST place-of-supply fields
- Customer phone upsert
- Insights revenue rules
- GSTR-1 inclusion rules (still uses `order.orderNumber` as invoice number)
- Expense / vendor invoice fields (`supplierInvoiceSerialNo` — unrelated)

---

## 9. Frontend contract (already built)

| UI | Behaviour |
|----|-----------|
| Master Data → Invoice Number | Load GET; form to set `nextInvoiceNumber`; save via PUT |
| Orders → Add Order drawer | Read-only preview of `nextInvoiceNumber` (refresh on open) |

Validation message if format wrong: must match `NA-YYYY-NNNNN`.

---

## 10. Checklist for backend

- [ ] Singleton `invoiceSettings` with bootstrap from max existing `orderNumber`
- [ ] `GET /api/admin/invoice-settings`
- [ ] `PUT /api/admin/invoice-settings` with format + collision checks
- [ ] Atomic allocate helper used by **both** `POST /api/orders` and `POST /api/admin/orders`
- [ ] Unique index on `order.orderNumber`
- [ ] Ignore client-supplied `orderNumber` on create
- [ ] Return allocated `orderNumber` on both create responses (unchanged response shape)
- [ ] Do not touch expense / Insights / GSTR-1 endpoints beyond reading existing `orderNumber`
