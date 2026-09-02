# GST Place of Supply — Backend Schema (Orders + Expenses)

**Audience:** Backend team  
**Status:** Proposed — frontend implemented against this contract  
**Company / place of supply (seller & recipient):** **Karnataka** (GSTIN state code `29`)  
**Related:** [ADMIN_MANUAL_ORDER_SCHEMA.md](./ADMIN_MANUAL_ORDER_SCHEMA.md), [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md), [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md), [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md)

This document defines how **CGST + SGST** vs **IGST** must be stored so GSTR-1 (outward) and purchase/expense GST reporting work correctly.

---

## Rule (apply everywhere)

| Counterparty state vs Karnataka | Tax type | Split |
|---------------------------------|----------|-------|
| **Same state** (Karnataka / `KA` / GSTIN starts with `29`) | `cgst_sgst` | Half of total GST rate each as CGST + SGST |
| **Other state** | `igst` | Full GST rate as IGST |

| Context | Counterparty used for place of supply |
|---------|----------------------------------------|
| **Orders (sales)** | Customer delivery `customer.state` |
| **Expenses (purchases)** | Vendor `billingAddress.state` (fallback: vendor GSTIN prefix) |

**Important:** Total GST % does **not** change — only the **split** changes. Example at 5%:

- Intra-state → **2.5% CGST + 2.5% SGST**
- Inter-state → **5% IGST**

At 18% (expenses only): **9% + 9%** or **18% IGST**.

---

## Tax type enum

```text
taxType: "cgst_sgst" | "igst"
```

| `taxType` | Persist | Zero out |
|-----------|---------|----------|
| `cgst_sgst` | `cgstRate`, `sgstRate`, `cgstAmount`, `sgstAmount` | `igstRate = 0`, `igstAmount = 0` |
| `igst` | `igstRate`, `igstAmount` | `cgstRate = 0`, `sgstRate = 0`, `cgstAmount = 0`, `sgstAmount = 0` |

Always also store:

- `taxRate` / `taxPercent` — total GST % (`5` for products; `5` or `18` for expense lines)
- `taxAmount` — total GST (= CGST+SGST **or** IGST)
- `taxable` / `taxableAmount` — value excluding GST

---

## State matching (normalize before compare)

Treat as **Karnataka (intra-state)** when any of these match (case-insensitive, trim spaces):

- `Karnataka`
- `KA`
- `29` (state code)
- Vendor/customer GSTIN first two characters = `29`

If state is missing and GSTIN is missing, frontend defaults to **intra-state (Karnataka)**. Backend should still prefer an explicit state when present.

---

## 1. Orders (sales) — GST-inclusive catalog prices

Catalog / cart `unitPrice` **already includes 5% GST**. Never multiply by `1.05` again. Only **extract** and **split**.

### Formula

```text
lineTotal  = round2(unitPrice × quantity)     // paid amount (incl. GST)
taxable    = round2(lineTotal / 1.05)         // excl. GST
taxAmount  = round2(lineTotal − taxable)      // included 5%

if customer.state is Karnataka (intra):
  taxType    = "cgst_sgst"
  cgstRate   = 2.5
  sgstRate   = 2.5
  igstRate   = 0
  cgstAmount = round2(taxAmount / 2)
  sgstAmount = round2(taxAmount − cgstAmount)
  igstAmount = 0

else (inter-state):
  taxType    = "igst"
  cgstRate   = 0
  sgstRate   = 0
  igstRate   = 5
  cgstAmount = 0
  sgstAmount = 0
  igstAmount = taxAmount
```

Document totals:

```text
taxableAmount = Σ line.taxable
taxAmount     = Σ line.taxAmount
cgstAmount    = Σ line.cgstAmount
sgstAmount    = Σ line.sgstAmount
igstAmount    = Σ line.igstAmount
subtotal = totalAmount = Σ line.lineTotal   // still GST-inclusive grand total
taxType       = "igst" if igstAmount > 0 and cgst/sgst are 0, else "cgst_sgst"
```

### Applies to

| Flow | Endpoint | Who computes |
|------|----------|--------------|
| Admin manual order | `POST /api/admin/orders` | Frontend sends full tax block; **backend should re-validate** from `customer.state` |
| Public checkout | `POST /api/orders` | Frontend now sends the same tax block; **backend must persist it** (or recompute from `customer.state` if omitted) |
| Order detail / list | `GET /api/admin/orders/:id` | Must return full tax block for UI + future GSTR-1 |

### Example — Karnataka customer (CGST + SGST)

```json
{
  "customer": {
    "name": "Priya Sharma",
    "state": "Karnataka",
    "city": "Bengaluru",
    "country": "India"
  },
  "items": [
    {
      "productId": "6a475c66b203bc97e100aaa1",
      "name": "Herbal Hair Oil",
      "variantId": "250ml",
      "quantity": 2,
      "unitPrice": 750,
      "taxRate": 5,
      "taxType": "cgst_sgst",
      "taxable": 1428.57,
      "taxAmount": 71.43,
      "cgstRate": 2.5,
      "sgstRate": 2.5,
      "igstRate": 0,
      "cgstAmount": 35.72,
      "sgstAmount": 35.71,
      "igstAmount": 0,
      "lineTotal": 1500
    }
  ],
  "taxableAmount": 1428.57,
  "taxAmount": 71.43,
  "taxType": "cgst_sgst",
  "cgstAmount": 35.72,
  "sgstAmount": 35.71,
  "igstAmount": 0,
  "cgstRate": 2.5,
  "sgstRate": 2.5,
  "igstRate": 0,
  "taxRate": 5,
  "subtotal": 1500,
  "totalAmount": 1500
}
```

### Example — Other state customer (IGST)

```json
{
  "customer": {
    "name": "Amit Verma",
    "state": "Maharashtra",
    "city": "Mumbai",
    "country": "India"
  },
  "items": [
    {
      "productId": "6a475c66b203bc97e100aaa1",
      "name": "Herbal Hair Oil",
      "variantId": "250ml",
      "quantity": 2,
      "unitPrice": 750,
      "taxRate": 5,
      "taxType": "igst",
      "taxable": 1428.57,
      "taxAmount": 71.43,
      "cgstRate": 0,
      "sgstRate": 0,
      "igstRate": 5,
      "cgstAmount": 0,
      "sgstAmount": 0,
      "igstAmount": 71.43,
      "lineTotal": 1500
    }
  ],
  "taxableAmount": 1428.57,
  "taxAmount": 71.43,
  "taxType": "igst",
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 71.43,
  "cgstRate": 0,
  "sgstRate": 0,
  "igstRate": 5,
  "taxRate": 5,
  "subtotal": 1500,
  "totalAmount": 1500
}
```

### Order field reference (tax block)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `taxType` | `"cgst_sgst"` \| `"igst"` | Yes | Derived from `customer.state` |
| `taxRate` | number | Yes | `5` for products |
| `taxableAmount` | number | Yes | Sum of line taxable |
| `taxAmount` | number | Yes | Total GST (CGST+SGST or IGST) |
| `cgstRate` | number | Yes | `2.5` or `0` |
| `sgstRate` | number | Yes | `2.5` or `0` |
| `igstRate` | number | Yes | `5` or `0` |
| `cgstAmount` | number | Yes | `0` when IGST |
| `sgstAmount` | number | Yes | `0` when IGST |
| `igstAmount` | number | Yes | `0` when CGST+SGST |
| `subtotal` / `totalAmount` | number | Yes | **Inclusive** grand total (revenue) |

Same fields on each `items[]` line (`taxable` instead of `taxableAmount` on lines for orders).

### Server behaviour (orders)

1. Persist `customer.state` and the full tax block on create (admin + public).
2. Prefer **server-side recompute** from inclusive `lineTotal` + `customer.state` so GSTR-1 is trustworthy.
3. Return the tax block on `GET /api/admin/orders/:id` (and ideally list if needed for exports).
4. Do **not** change `totalAmount` when switching CGST/SGST ↔ IGST — only the split fields change.
5. Legacy orders without `igst*` / `taxType`: treat as `cgst_sgst` if only CGST/SGST present; if only `taxAmount` exists, recompute split from stored `customer.state` when possible.

---

## 2. Expenses (purchases) — vendor place of supply

Company is in **Karnataka**. Compare against **vendor state**.

| Vendor state | Tax type |
|--------------|----------|
| Karnataka | `cgst_sgst` (e.g. 2.5+2.5 at 5%, or 9+9 at 18%) |
| Other state | `igst` (5% or 18%) |

Expense lines still use `taxPercent` / `taxRate` of **`5` or `18`**. Place of supply only controls the **split**.

### Vendor snapshot (required for audit / GSTR)

```json
"vendorSnapshot": {
  "id": "ObjectId",
  "name": "Vendor Name",
  "gstin": "29AAAAA0000A1Z5",
  "state": "Karnataka"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id`, `name` | Yes | Existing |
| `gstin` | No | Use prefix `29` as Karnataka fallback |
| `state` | **Yes (preferred)** | From `vendor.billingAddress.state` |

### Line + document tax fields (add to existing expense schema)

On each `items[]` and on the expense document:

| Field | Type | Notes |
|-------|------|-------|
| `taxType` | `"cgst_sgst"` \| `"igst"` | From vendor place of supply |
| `taxPercent` / `taxRate` | `5` \| `18` | Unchanged |
| `taxableAmount` / `netAmount` | number | Unchanged |
| `taxAmount` | number | Total GST |
| `cgstRate`, `sgstRate`, `igstRate` | number | Half rate / full rate / `0` as applicable |
| `cgstAmount`, `sgstAmount`, `igstAmount` | number | Split amounts; unused side = `0` |
| `totalAmount` | number | taxable + tax |

### Example — Karnataka vendor, 5%

```json
{
  "withTax": true,
  "vendorId": "...",
  "vendorSnapshot": {
    "id": "...",
    "name": "Local Supplies",
    "gstin": "29BBBBB1111B1Z5",
    "state": "Karnataka"
  },
  "amountType": "total",
  "items": [
    {
      "itemName": "Packaging",
      "taxPercent": 5,
      "taxRate": 5,
      "taxType": "cgst_sgst",
      "taxableAmount": 952.38,
      "taxAmount": 47.62,
      "cgstRate": 2.5,
      "sgstRate": 2.5,
      "igstRate": 0,
      "cgstAmount": 23.81,
      "sgstAmount": 23.81,
      "igstAmount": 0,
      "totalAmount": 1000
    }
  ],
  "taxableAmount": 952.38,
  "taxAmount": 47.62,
  "taxType": "cgst_sgst",
  "cgstAmount": 23.81,
  "sgstAmount": 23.81,
  "igstAmount": 0,
  "cgstRate": 2.5,
  "sgstRate": 2.5,
  "igstRate": 0,
  "totalAmount": 1000
}
```

### Example — Other-state vendor, 5%

```json
{
  "withTax": true,
  "vendorSnapshot": {
    "id": "...",
    "name": "Mumbai Traders",
    "gstin": "27CCCCC2222C1Z5",
    "state": "Maharashtra"
  },
  "items": [
    {
      "itemName": "Raw material",
      "taxPercent": 5,
      "taxType": "igst",
      "taxableAmount": 952.38,
      "taxAmount": 47.62,
      "cgstRate": 0,
      "sgstRate": 0,
      "igstRate": 5,
      "cgstAmount": 0,
      "sgstAmount": 0,
      "igstAmount": 47.62,
      "totalAmount": 1000
    }
  ],
  "taxType": "igst",
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 47.62,
  "igstRate": 5,
  "taxAmount": 47.62,
  "totalAmount": 1000
}
```

### RCM

Reverse charge does **not** change the split. Still store CGST+SGST or IGST for returns; `amount` payable to vendor remains taxable value when `reverseCharge: true`.

### Server behaviour (expenses)

1. Persist tax split fields on create/update and return them on `GET /api/admin/expenses/:id`.
2. Prefer recomputing split from vendor state / GSTIN when validating.
3. Require vendor `state` (or GSTIN) for taxed expenses when possible — warn/reject incomplete place of supply if you enforce server-side.

---

## 3. Suggested Mongo fields

### Order

```text
taxType: String           // "cgst_sgst" | "igst"
taxRate: Number           // 5
taxableAmount: Number
taxAmount: Number
cgstRate: Number
sgstRate: Number
igstRate: Number
cgstAmount: Number
sgstAmount: Number
igstAmount: Number
totalAmount: Number       // inclusive
customer.state: String

items[]: same tax fields (taxable instead of taxableAmount)
```

### Expense

```text
taxType, taxAmount, taxableAmount, totalAmount
cgstRate, sgstRate, igstRate
cgstAmount, sgstAmount, igstAmount
vendorSnapshot.state
vendorSnapshot.gstin

items[]: taxPercent/taxRate, taxType, taxableAmount, taxAmount,
         cgst*/sgst*/igst*, totalAmount
```

---

## 4. GSTR-1 readiness (next section)

With this schema, outward supplies can be bucketed later as:

| GSTR-1 style bucket | Filter |
|---------------------|--------|
| B2B / B2C intra-state | `taxType === "cgst_sgst"` |
| B2B / B2C inter-state | `taxType === "igst"` |
| Taxable value | `taxableAmount` |
| CGST / SGST / IGST columns | respective `*Amount` fields |

Do **not** invent a second tax amount — `taxAmount` is always the sum of the active split.

A dedicated GSTR-1 / GSTR-3B reporting API can be added in a follow-up; this schema is the prerequisite.

---

## 5. Acceptance checklist

### Orders

- [ ] Karnataka customer → `taxType: cgst_sgst`, CGST 2.5% + SGST 2.5%, `igstAmount: 0`
- [ ] Other-state customer → `taxType: igst`, IGST 5%, CGST/SGST amounts `0`
- [ ] `totalAmount` equals sum of inclusive line totals (tax not added on top)
- [ ] Admin create + public checkout both persist the tax block
- [ ] `GET` order by id returns tax block for Order Details UI

### Expenses

- [ ] Karnataka vendor → CGST + SGST at half of line rate
- [ ] Other-state vendor → IGST at full line rate (5 or 18)
- [ ] `vendorSnapshot.state` stored
- [ ] `GET` expense by id returns full split
- [ ] RCM still stores split; payable `amount` = taxable when RCM on

### Validation

- [ ] `taxAmount ≈ cgstAmount + sgstAmount + igstAmount` (within rounding)
- [ ] Exactly one mode active: either CGST+SGST or IGST, not both non-zero

---

## 6. Frontend already sending

| Surface | Behaviour |
|---------|-----------|
| Admin Add Order | Split follows `customer.state`; payload includes `taxType` + `igst*` |
| Admin Order Details | Shows CGST+SGST **or** IGST from stored fields |
| Public checkout payload | Same tax block derived from `customer.state` |
| Expense form (with tax) | Split follows vendor state/GSTIN; payload includes `taxType` + `igst*` + `vendorSnapshot.state` |
