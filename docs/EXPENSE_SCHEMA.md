# Expense Tracker & Expense Categories — API Schema

**Audience:** Backend team  
**Status:** Proposed (frontend implemented against these contracts)  
**Auth:** Admin JWT required on all endpoints  
**Related:** [ADMIN_PURCHASE_SCHEMA.md](./ADMIN_PURCHASE_SCHEMA.md), **[GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md)** (vendor state → CGST+SGST vs IGST), **[EXPENSE_FILTERS_EXPORT_SCHEMA.md](./EXPENSE_FILTERS_EXPORT_SCHEMA.md)** (date / search / vendor filters + Excel & PDF export)

Use this document to design schemas and CRUD APIs for:

1. **Expense Categories** (master data — same pattern as Vendors / Master Products)
2. **Expenses** (simple expense **or** GST expense with vendor + line items)

Bank/transaction details are optional free text on the expense — no bank-account master required.

---

## Critical: Edit flow = GET by ID

On every **Edit**, the frontend does **not** reuse the list-row object. It calls:

```http
GET /api/admin/expenses/{id}
GET /api/admin/expense-categories/{id}
Authorization: Bearer <admin_jwt_token>
```

and populates the form only after this response.

| UI action | API called first |
|-----------|------------------|
| Edit Expense | `GET /api/admin/expenses/{id}` |
| Edit Expense Category (master page or expense drawer) | `GET /api/admin/expense-categories/{id}` |

### GET by ID response shape

```json
{
  "success": true,
  "data": {
    "id": "ObjectId",
    "...": "full entity including items[], payment, category/vendor snapshots"
  }
}
```

### What list vs detail should return

| Endpoint | May be slim | Must include on GET by ID |
|----------|-------------|---------------------------|
| Expenses list | date, amount/total, category/vendor name, `isPaid`, payment type | full `items[]`, tax summary, notes, TDS, nested `payment`, category + vendor refs |
| Expense categories list | name, `isActive` | description, `isActive`, timestamps |

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
| `404` | ID not found (return this on GET by ID) |
| `409` | Delete blocked (e.g. category still used by expenses) |

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

Mutations should return:

```json
{
  "success": true,
  "data": { }
}
```

---

## Entity overview

| Entity | Purpose | Notes |
|--------|---------|-------|
| **ExpenseCategory** | Master data for classifying expenses | CRUD from Master Data page **and** per-line category on taxed expenses |
| **Expense** | Single expense record | Without tax: simple amount. With tax: vendor + invoice meta + `items[]` + totals |
| **Vendor** | Party for taxed expenses | Existing `/api/admin/vendors` — searchable + quick-add from expense drawer |

**Note:** Product catalog **Categories** (`/api/categories`) are separate from **Expense Categories** (`/api/admin/expense-categories`).

Payment bank info is stored as optional free text (`bankDetails` / `transactionDetails`), not a bank-account FK.

---

## Endpoint cheat sheet

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/expense-categories` | List / search |
| `GET` | `/api/admin/expense-categories/{id}` | Get one (required for Edit) |
| `POST` | `/api/admin/expense-categories` | Create |
| `PUT` | `/api/admin/expense-categories/{id}` | Update |
| `DELETE` | `/api/admin/expense-categories/{id}` | Delete |
| `GET` | `/api/admin/expenses` | List / filter |
| `GET` | `/api/admin/expenses/export` | Download Excel / PDF (same filters) — see [EXPENSE_FILTERS_EXPORT_SCHEMA.md](./EXPENSE_FILTERS_EXPORT_SCHEMA.md) |
| `GET` | `/api/admin/expenses/{id}` | Get one (required for Edit) |
| `POST` | `/api/admin/expenses` | Create |
| `PUT` | `/api/admin/expenses/{id}` | Update |
| `DELETE` | `/api/admin/expenses/{id}` | Delete |
| `GET` | `/api/admin/vendors` | Existing — vendor search (`?search=`) |
| `POST` | `/api/admin/vendors` | Existing — quick-add from expense drawer |

---

## 1. Expense Categories (master data)

Same UX pattern as **Vendors** / **Master Products**.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/expense-categories` | List / search |
| `GET` | `/api/admin/expense-categories/{id}` | Get one (required for Edit) |
| `POST` | `/api/admin/expense-categories` | Create |
| `PUT` | `/api/admin/expense-categories/{id}` | Update |
| `DELETE` | `/api/admin/expense-categories/{id}` | Delete |

### Query params (list)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page (≥ 1) |
| `limit` | number | Page size (1–100) |
| `search` | string | Match `name`, `description` |
| `isActive` | boolean | Optional filter |

### Schema

```json
{
  "id": "ObjectId",
  "name": "string (required, unique per org)",
  "description": "string",
  "isActive": true,
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

### Create / Update payload

```json
{
  "name": "Travel",
  "description": "Flights, cab, lodging",
  "isActive": true
}
```

### Delete rules

- Prefer soft-delete (`isActive: false`) **or** hard delete with `409` if any expense (or expense item) references this category.

---

## 2. Expenses

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/expenses` | List / filter |
| `GET` | `/api/admin/expenses/{id}` | Full expense for edit |
| `POST` | `/api/admin/expenses` | Create |
| `PUT` | `/api/admin/expenses/{id}` | Update |
| `DELETE` | `/api/admin/expenses/{id}` | Delete |

### Query params (list)

Full filter + export contract: **[EXPENSE_FILTERS_EXPORT_SCHEMA.md](./EXPENSE_FILTERS_EXPORT_SCHEMA.md)**.

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page (≥ 1) |
| `limit` | number | Page size (1–100) |
| `search` | string | Match notes / vendor / invoice serial / item name / categories |
| `categoryId` | ObjectId | Filter by header category (no-tax) or item category |
| `vendorId` | ObjectId | Exact vendor filter |
| `withTax` / `isTaxable` | boolean | Filter taxed expenses |
| `isPaid` | boolean | Filter paid / unpaid |
| `fromDate` | `YYYY-MM-DD` | Start date — `expenseDate` ≥ (inclusive) |
| `toDate` | `YYYY-MM-DD` | End date — `expenseDate` ≤ (inclusive) |
| `paymentType` | string | UPI / Cash / Card / … |

### Two UI modes (matches Swipe-style drawer)

| Mode | Toggle | Shape |
|------|--------|-------|
| **Without tax** | Create with tax = off | Single `amount` + date + category + notes + payment |
| **With tax** | Create with tax = on | Vendor + invoice meta + **line items** + tax summary + payment |

---

### Full schema — without tax

```json
{
  "id": "ObjectId",
  "amount": 1250.5,
  "currency": "INR",
  "expenseDate": "2026-08-05",
  "categoryId": "ObjectId",
  "categorySnapshot": {
    "id": "ObjectId",
    "name": "Travel"
  },
  "notes": "Client site visit",
  "withTax": false,
  "isTaxable": false,
  "tdsApplicable": false,
  "tdsPercent": null,
  "tdsAmount": null,
  "isPaid": true,
  "paymentDate": "2026-08-05",
  "paymentNotes": "Paid via UPI",
  "paymentType": "UPI",
  "bankDetails": "HDFC · UTR 1234567890",
  "transactionDetails": "HDFC · UTR 1234567890",
  "payment": {
    "paymentDate": "2026-08-05",
    "paymentNotes": "Paid via UPI",
    "paymentType": "UPI",
    "bankDetails": "HDFC · UTR 1234567890",
    "transactionDetails": "HDFC · UTR 1234567890"
  },
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

### Full schema — with tax (GET by ID must return this)

```json
{
  "id": "ObjectId",
  "amount": 1180,
  "currency": "INR",
  "expenseDate": "2026-08-05",
  "notes": "GST purchase",
  "withTax": true,
  "isTaxable": true,
  "vendorId": "ObjectId",
  "vendorSnapshot": {
    "id": "ObjectId",
    "name": "ABC Suppliers",
    "gstin": "29AAAAA0000A1Z5"
  },
  "supplierInvoiceDate": "2026-08-05",
  "supplierInvoiceSerialNo": "INV-2041",
  "invoiceId": "INV-2041",
  "amountType": "total",
  "items": [
    {
      "itemName": "Office supplies",
      "categoryId": "ObjectId",
      "categorySnapshot": {
        "id": "ObjectId",
        "name": "Stationery"
      },
      "taxPercent": 18,
      "taxRate": 18,
      "taxableAmount": 1000,
      "netAmount": 1000,
      "taxAmount": 180,
      "totalAmount": 1180
    }
  ],
  "taxableAmount": 1000,
  "netAmount": 1000,
  "taxAmount": 180,
  "totalAmount": 1180,
  "roundOff": false,
  "roundOffAmount": 0,
  "reverseCharge": false,
  "reverseChargeMechanism": false,
  "tdsApplicable": false,
  "tdsPercent": null,
  "tdsAmount": null,
  "isPaid": true,
  "paymentDate": "2026-08-05",
  "paymentNotes": "Paid via UPI",
  "paymentType": "UPI",
  "bankDetails": "HDFC · UTR 1234567890",
  "transactionDetails": "HDFC · UTR 1234567890",
  "payment": {
    "paymentDate": "2026-08-05",
    "paymentNotes": "Paid via UPI",
    "paymentType": "UPI",
    "bankDetails": "HDFC · UTR 1234567890",
    "transactionDetails": "HDFC · UTR 1234567890"
  },
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

---

### Create / Update — without tax

```json
{
  "amount": 1250.5,
  "currency": "INR",
  "expenseDate": "2026-08-05",
  "categoryId": "ObjectId",
  "categorySnapshot": { "id": "ObjectId", "name": "Travel" },
  "notes": "Client site visit",
  "withTax": false,
  "isTaxable": false,
  "tdsApplicable": false,
  "isPaid": true,
  "paymentDate": "2026-08-05",
  "paymentType": "UPI",
  "bankDetails": "Optional bank / UTR notes",
  "transactionDetails": "Optional bank / UTR notes",
  "payment": {
    "paymentDate": "2026-08-05",
    "paymentType": "UPI",
    "bankDetails": "Optional bank / UTR notes",
    "transactionDetails": "Optional bank / UTR notes"
  }
}
```

### Create / Update — with tax

```json
{
  "amount": 1180,
  "currency": "INR",
  "expenseDate": "2026-08-05",
  "notes": "GST purchase",
  "withTax": true,
  "isTaxable": true,
  "vendorId": "ObjectId",
  "vendorSnapshot": {
    "id": "ObjectId",
    "name": "ABC Suppliers",
    "gstin": "29AAAAA0000A1Z5"
  },
  "supplierInvoiceDate": "2026-08-05",
  "supplierInvoiceSerialNo": "INV-2041",
  "invoiceId": "INV-2041",
  "amountType": "total",
  "items": [
    {
      "itemName": "Office supplies",
      "categoryId": "ObjectId",
      "categorySnapshot": { "id": "ObjectId", "name": "Stationery" },
      "taxPercent": 18,
      "taxRate": 18,
      "taxableAmount": 1000,
      "netAmount": 1000,
      "taxAmount": 180,
      "totalAmount": 1180
    }
  ],
  "taxableAmount": 1000,
  "netAmount": 1000,
  "taxAmount": 180,
  "totalAmount": 1180,
  "roundOff": false,
  "roundOffAmount": 0,
  "reverseCharge": false,
  "reverseChargeMechanism": false,
  "tdsApplicable": false,
  "isPaid": true,
  "paymentDate": "2026-08-05",
  "paymentType": "UPI",
  "bankDetails": "Optional bank / UTR notes",
  "transactionDetails": "Optional bank / UTR notes",
  "payment": {
    "paymentDate": "2026-08-05",
    "paymentType": "UPI",
    "bankDetails": "Optional bank / UTR notes",
    "transactionDetails": "Optional bank / UTR notes"
  }
}
```

---

### Field rules

#### Common

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `amount` | number | **Yes** | Payable amount. Without tax = entered amount. With tax = `totalAmount`, **except under RCM** = taxable (vendor payable) |
| `currency` | string | No | Default `INR` |
| `expenseDate` | `YYYY-MM-DD` | **Yes** | |
| `notes` | string | No | |
| `withTax` / `isTaxable` | boolean | No | Accept either alias |
| `tdsApplicable` | boolean | No | |
| `isPaid` | boolean | No | Default `true` in UI |
| `paymentDate` | `YYYY-MM-DD` | If paid | |
| `paymentType` | enum | If paid | `UPI \| Cash \| Card \| Net Banking \| Cheque \| EMI` |
| `bankDetails` / `transactionDetails` | string | No | Optional free text (bank / UTR / txn notes). Accept either alias |
| `payment` | object | No | Nested mirror of payment fields |

#### Without tax only

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `categoryId` | ObjectId | No | Header-level category |
| `categorySnapshot` | object | No | `{ id, name }` |

#### With tax only

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vendorId` | ObjectId | **Yes** | Must exist |
| `vendorSnapshot` | object | No | `{ id, name, gstin?, state? }` — **include `state`** for place of supply |
| `supplierInvoiceDate` | `YYYY-MM-DD` | No | |
| `supplierInvoiceSerialNo` / `invoiceId` | string | No | Accept either alias |
| `amountType` | enum | **Yes** | `total` \| `taxable` (UI labels: **Total Amount** / **Taxable Amount**) |
| `items` | array | **Yes** | At least one line with amount `> 0` |
| `taxableAmount` / `netAmount` | number | **Yes** | Sum of item taxable — accept either alias |
| `taxAmount` | number | **Yes** | Sum of item tax (GST liability; under RCM this is paid by recipient) |
| `taxType` | enum | **Yes** | `cgst_sgst` \| `igst` |
| `cgstAmount`, `sgstAmount`, `igstAmount` | number | **Yes** | Document-level GST split |
| `cgstRate`, `sgstRate`, `igstRate` | number | **Yes** | Rates matching `taxType` |
| `totalAmount` | number | **Yes** | Invoice total = taxable + tax (+ round off) |
| `roundOff` | boolean | No | When true, totals are rounded to nearest rupee |
| `roundOffAmount` | number | No | Difference applied by round-off |
| `reverseCharge` / `reverseChargeMechanism` | boolean | No | Accept either alias. When true: GST under RCM; `amount` = vendor payable (taxable); still store `taxAmount` / `totalAmount` for returns |

#### Expense item (`items[]`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `itemName` | string | No | Recommended |
| `categoryId` | ObjectId | No | Per-line expense category (UI: searchable + add) |
| `categorySnapshot` | object | No | `{ id, name }` |
| `taxPercent` / `taxRate` | number | **Yes** | Allowed: **`5`** or **`18`** |
| `taxType` | enum | **Yes** | `cgst_sgst` \| `igst` — from vendor place of supply ([GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md)) |
| `taxableAmount` / `netAmount` | number | **Yes** | Pre-tax line value |
| `taxAmount` | number | **Yes** | Line GST total |
| `cgstRate`, `sgstRate`, `igstRate` | number | **Yes** | Half rate / half rate / full rate; unused side `0` |
| `cgstAmount`, `sgstAmount`, `igstAmount` | number | **Yes** | Split amounts; unused side `0` |
| `totalAmount` | number | **Yes** | Line total incl. tax |

---

### Amount type math

| `amountType` | User enters on each line | Derived |
|--------------|--------------------------|---------|
| `total` | `totalAmount` + `taxPercent` | `taxable = total / (1 + rate/100)`, `tax = total − taxable` |
| `taxable` | `taxableAmount` + `taxPercent` | `tax = taxable × rate/100`, `total = taxable + tax` |

Document totals:

```text
taxableAmount = Σ item.taxableAmount
taxAmount     = Σ item.taxAmount
totalAmount   = taxableAmount + taxAmount
if roundOff: totalAmount = round(totalAmount); persist roundOffAmount

if reverseCharge:
  amount = roundOff ? round(taxableAmount) : taxableAmount   # pay vendor
else:
  amount = totalAmount
```

### Reverse Charge Mechanism (RCM)

| Behavior | Detail |
|----------|--------|
| Flag | `reverseCharge: true` (alias `reverseChargeMechanism`) |
| Line tax | Still calculated from 5%/18% |
| Vendor payable (`amount`) | Taxable value only |
| GST liability | `taxAmount` — paid by recipient to government |
| UI | Expandable panel with tax liability + pay-vendor summary |

---

### Unpaid expenses

When `isPaid = false`, omit or null out payment fields / nested `payment`.

### Without-tax expenses

When `withTax = false`, omit vendor, invoice, `amountType`, `items`, tax summary, round-off, reverse charge.

---

## 3. Suggested MongoDB / DB indexes

```text
expenseCategories:
  - { name: 1 } unique (or unique per tenant)
  - { isActive: 1 }

expenses:
  - { expenseDate: -1 }
  - { vendorId: 1, expenseDate: -1 }
  - { categoryId: 1, expenseDate: -1 }
  - { "items.categoryId": 1 }
  - { withTax: 1, expenseDate: -1 }
  - { reverseCharge: 1 }
  - { isPaid: 1, expenseDate: -1 }
  - { supplierInvoiceSerialNo: 1 }
  - { createdAt: -1 }
```

---

## 4. Validation summary for backend

| Rule | Detail |
|------|--------|
| Amount | Required, `> 0` |
| Expense date | Required, valid date |
| Vendor | Required when `withTax` |
| Amount type | `total` \| `taxable` when taxed |
| Items | ≥ 1 when taxed; each tax % must be `5` or `18` |
| Tax math | Recalculate / verify line + document totals |
| RCM | If `reverseCharge`, `amount` should match taxable (vendor payable); keep `taxAmount` / `totalAmount` |
| Category | If provided (header or line), must exist |
| Payment type | Enum when paid |
| Bank details | Optional string |
| TDS | If applicable, percent/amount ≥ 0 |
| Delete category | Block or soft-delete when referenced by expenses/items |

---

## 5. Frontend routes (implemented)

| Route | Page |
|-------|------|
| `/admin/expenses` | Expense list + Swipe-style drawer (~70% width) |
| `/admin/expense-categories` | Expense category master |
| `/admin/vendors` | Vendor master (also quick-add from taxed expense) |

Drawer behaviour:

- **Create with tax** toggles between simple and GST/item form
- With tax: vendor search + **Add New Vendor?**, invoice fields, item table with **category search + add**, Tax 5%/18%, summary, round off, reverse charge panel, TDS, payments
- Payments: optional **Bank / Transaction Details** textarea (no bank dropdown)
- Attachments are **not** collected or sent

---

## 6. Implementation order (recommended)

1. `ExpenseCategory` CRUD + GET by ID  
2. `Expense` CRUD + GET by ID supporting both modes (especially `items[]`, RCM, `bankDetails`)  
3. Ensure vendors list supports `?search=`  
4. List filters (`fromDate`, `toDate`, `search`, `vendorId`, `withTax`, `isPaid`) + `summary`  
5. Export `GET /api/admin/expenses/export?format=xlsx|pdf` (see [EXPENSE_FILTERS_EXPORT_SCHEMA.md](./EXPENSE_FILTERS_EXPORT_SCHEMA.md))

---

## Example error responses

```json
{
  "success": false,
  "message": "Vendor is required when creating an expense with tax",
  "errors": [
    { "field": "vendorId", "message": "Required when withTax is true" }
  ]
}
```

```json
{
  "success": false,
  "message": "taxPercent must be 5 or 18",
  "errors": [
    { "field": "items[0].taxPercent", "message": "Allowed values: 5, 18" }
  ]
}
```

```json
{
  "success": false,
  "message": "Cannot delete category: it is used by 4 expenses"
}
```
