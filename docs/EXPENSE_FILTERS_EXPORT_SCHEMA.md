# Expense List Filters & Export — Backend Schema

**Audience:** Backend team  
**Status:** Proposed (frontend will implement against these contracts)  
**Auth:** Admin JWT required on all endpoints  
**Related:** [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md) (CRUD + entity shape), [GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md)

This document defines:

1. **List filters** for `GET /api/admin/expenses` — date range, search, vendor
2. **Export / download** — Excel (`.xlsx`) and PDF for the **same filtered set**

Filters used on the list page and on export **must share one query contract**. Export must never invent a different filter meaning than list.

---

## Auth

```http
Authorization: Bearer <admin_jwt_token>
```

| HTTP | Meaning |
|------|---------|
| `401` | Missing / invalid token |
| `403` | Logged in but not an admin |
| `400` | Invalid filter / date range / export format |
| `404` | Export with no matching rows is **not** a 404 — return empty file or `200` with empty table (see §4) |

---

## 1. Endpoint cheat sheet

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/expenses` | Paginated list with filters |
| `GET` | `/api/admin/expenses/export` | Download Excel or PDF for the **current filters** |
| `GET` | `/api/admin/vendors` | Existing — vendor dropdown / typeahead (`?search=`) |

---

## 2. Shared filter query params

Used by **both** list and export. All params are optional unless noted. Omit or send empty string = no filter on that dimension.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `fromDate` | `YYYY-MM-DD` | No | **Start date** — inclusive. Filter on `expenseDate` |
| `toDate` | `YYYY-MM-DD` | No | **End date** — inclusive. Filter on `expenseDate` |
| `search` | string | No | Free-text search (see §2.2) |
| `vendorId` | ObjectId | No | Exact match on expense `vendorId` |
| `page` | number | No | List only. Default `1`. Ignored on export |
| `limit` | number | No | List only. Default `20` (max `100`). Ignored on export |
| `format` | enum | **Export only** | `xlsx` \| `pdf` (required on export endpoint) |

### Optional filters (already in [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md) — keep supported)

| Param | Type | Description |
|-------|------|-------------|
| `categoryId` | ObjectId | Header category (no-tax) **or** any `items[].categoryId` |
| `withTax` / `isTaxable` | boolean | Taxed vs non-taxed expenses |
| `isPaid` | boolean | Paid / unpaid |
| `paymentType` | string | `UPI` \| `Cash` \| `Card` \| `Net Banking` \| `Cheque` \| `EMI` |

### Validation rules

1. Dates must be valid `YYYY-MM-DD`.
2. If **both** `fromDate` and `toDate` are present and `fromDate > toDate` → `400`.
3. Either date alone is allowed (`fromDate` only = “on or after”; `toDate` only = “on or before”).
4. Date filter is **inclusive** on both ends, evaluated in business timezone **`Asia/Kolkata`** against `expenseDate` (not `createdAt`).
5. `vendorId` must be a valid ObjectId if provided; unknown id → empty result set (not `400`).
6. `search` should be trimmed; case-insensitive; ignore if empty after trim.
7. Filters **combine with AND** (narrow the set). Within `search`, fields combine with OR.

### Example — list

```http
GET /api/admin/expenses?fromDate=2026-08-01&toDate=2026-08-31&search=INV-2041&vendorId=66a1b2c3d4e5f67890123456&page=1&limit=20
Authorization: Bearer <admin_jwt_token>
```

### Example — export Excel / PDF

```http
GET /api/admin/expenses/export?format=xlsx&fromDate=2026-08-01&toDate=2026-08-31&vendorId=66a1b2c3d4e5f67890123456
GET /api/admin/expenses/export?format=pdf&fromDate=2026-08-01&toDate=2026-08-31&search=office
Authorization: Bearer <admin_jwt_token>
```

---

## 2.1 Start date / end date (`fromDate`, `toDate`)

| Rule | Detail |
|------|--------|
| Field | `expenseDate` stored as `YYYY-MM-DD` (or date-only) |
| Inclusive | Expense on `fromDate` **and** on `toDate` both included |
| Timezone | Compare calendar dates in `Asia/Kolkata` — do not shift a date-only field with UTC midnight bugs |
| UI labels | Start date → `fromDate`, End date → `toDate` |

```text
expenseDate >= fromDate  AND  expenseDate <= toDate
```

---

## 2.2 Search filter (`search`)

Case-insensitive partial match (`contains`) across any of:

| Field | Applies to |
|-------|------------|
| `notes` | All expenses |
| `supplierInvoiceSerialNo` / `invoiceId` | Taxed expenses |
| `vendorSnapshot.name` / linked vendor name | Taxed (and any row with vendor) |
| `categorySnapshot.name` | No-tax header category |
| `items[].itemName` | Taxed line items |
| `items[].categorySnapshot.name` | Taxed line categories |
| `paymentNotes` / `payment.paymentNotes` | Optional |
| `bankDetails` / `transactionDetails` | Optional |

Recommended Mongo-style approach:

- Text index on relevant string fields, **or**
- `$or` of case-insensitive regexes for MVP (escape user input)

Do **not** require the admin to pick a “search field” — one box searches all of the above.

---

## 2.3 Vendor filter (`vendorId`)

| Rule | Detail |
|------|--------|
| Match | Exact equality on `vendorId` |
| Scope | Typically taxed expenses; no-tax rows without vendor simply won’t match |
| UI | Dropdown / typeahead fed by `GET /api/admin/vendors?search=` |
| Clear | Omit `vendorId` to show all vendors |

Vendor name search alone is **not** a substitute for `vendorId` — use `search` for free-text name match, `vendorId` for exact party filter.

---

## 3. List response (`GET /api/admin/expenses`)

Same envelope as [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md). Prefer:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ObjectId",
        "expenseDate": "2026-08-05",
        "amount": 1180,
        "totalAmount": 1180,
        "withTax": true,
        "isTaxable": true,
        "vendorId": "ObjectId",
        "vendorSnapshot": {
          "id": "ObjectId",
          "name": "ABC Suppliers",
          "gstin": "29AAAAA0000A1Z5"
        },
        "categorySnapshot": null,
        "supplierInvoiceSerialNo": "INV-2041",
        "notes": "GST purchase",
        "isPaid": true,
        "paymentType": "UPI"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 42,
    "summary": {
      "count": 42,
      "totalAmount": 125000.5,
      "paidAmount": 110000,
      "unpaidAmount": 15000.5
    }
  }
}
```

### `summary` (recommended)

Compute over the **full filtered set**, not just the current page — so the UI can show “42 expenses · ₹1,25,000.50” while paginating.

| Field | Meaning |
|-------|---------|
| `count` | Number of matching expenses (= `total`) |
| `totalAmount` | Sum of payable `amount` (or `totalAmount` for taxed non-RCM; use same payable field as list column) |
| `paidAmount` | Sum where `isPaid = true` |
| `unpaidAmount` | Sum where `isPaid = false` |

Sort default: `expenseDate` descending, then `createdAt` descending.

---

## 4. Export / download

### Endpoint

```http
GET /api/admin/expenses/export?format=xlsx|pdf&fromDate=&toDate=&search=&vendorId=&...
Authorization: Bearer <admin_jwt_token>
```

| Param | Required | Notes |
|-------|----------|-------|
| `format` | **Yes** | `xlsx` or `pdf` |
| All §2 filters | No | Same semantics as list |
| `page` / `limit` | — | **Ignored** — export always returns **all** matching rows |

### Response headers

**Excel**

```http
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="expenses_2026-08-01_2026-08-31.xlsx"
```

**PDF**

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="expenses_2026-08-01_2026-08-31.pdf"
```

### Filename convention

```text
expenses_{fromDate|all}_{toDate|all}.{xlsx|pdf}
```

Examples:

- `expenses_2026-08-01_2026-08-31.xlsx`
- `expenses_all_2026-08-31.pdf` (only `toDate` set)
- `expenses_all_all.xlsx` (no date filter)

### Empty result set

Return `200` with a valid file that has headers + zero data rows (and optional “No expenses found” note on PDF). Do **not** return `404`.

### Max rows (optional guard)

If you need a hard cap (e.g. 10,000 rows), return `400` with a clear message asking the admin to narrow filters — do not silently truncate.

---

## 4.1 Excel (`.xlsx`) column layout

One sheet named **`Expenses`**.

| Col | Header | Source |
|-----|--------|--------|
| A | Date | `expenseDate` |
| B | Vendor | `vendorSnapshot.name` or `—` |
| C | Category | Header `categorySnapshot.name`, or first/joined item categories, or `—` |
| D | Invoice No. | `supplierInvoiceSerialNo` / `invoiceId` or `—` |
| E | Notes | `notes` |
| F | Taxable | `taxableAmount` / `netAmount` (blank if no-tax) |
| G | Tax | `taxAmount` (blank if no-tax) |
| H | CGST | `cgstAmount` |
| I | SGST | `sgstAmount` |
| J | IGST | `igstAmount` |
| K | Total / Amount | Payable `amount` (same as UI Amount column) |
| L | Paid | `Yes` / `No` from `isPaid` |
| M | Payment Type | `paymentType` |
| N | Payment Date | `paymentDate` |
| O | With Tax | `Yes` / `No` |
| P | RCM | `Yes` / `No` from `reverseCharge` |

**Footer row (last row):**

| Label | Value |
|-------|-------|
| Count | Number of data rows |
| Total Amount | Sum of column K |

Optional second sheet **`Summary`**:

| Metric | Value |
|--------|-------|
| From date | filter or `All` |
| To date | filter or `All` |
| Search | applied string or empty |
| Vendor | vendor name resolved from `vendorId`, or `All` |
| Expense count | |
| Total amount | |
| Paid amount | |
| Unpaid amount | |

Numbers as numeric cells (not pre-formatted strings). Dates as `YYYY-MM-DD` text or Excel date serials — be consistent.

---

## 4.2 PDF layout

Portrait or landscape A4. Suggested structure:

1. **Title:** `Expense Report`
2. **Filter line:** `From: …  To: …  Vendor: …  Search: …` (show `All` when unset)
3. **Generated at:** ISO datetime in `Asia/Kolkata`
4. **Table** with columns (narrower set than Excel is fine):

| Date | Vendor | Category | Invoice | Amount | Paid | Payment |

5. **Footer totals:** count + total amount (+ paid / unpaid if space)

Use the same filtered dataset and the same payable `amount` definition as Excel / list. Do not recompute GST differently from stored expense fields.

---

## 4.3 Alternative: JSON-for-client-export (optional)

If you prefer client-built Excel/PDF (like GSTR-1), also support:

```http
GET /api/admin/expenses?fromDate=…&toDate=…&search=…&vendorId=…&all=true
```

| Param | Behavior |
|-------|----------|
| `all=true` | Return **every** matching row unpaginated; `summary` still over full set |

**Preferred for this feature:** dedicated `/export` that streams binary files so PDF generation stays server-side and both formats stay consistent. Frontend can still call `/export?format=xlsx` and `/export?format=pdf` from Download buttons.

---

## 5. Frontend UX contract (what UI will send)

| UI control | Query param |
|------------|-------------|
| Start date picker | `fromDate` |
| End date picker | `toDate` |
| Search box (debounced) | `search` |
| Vendor dropdown | `vendorId` |
| Download Excel | `GET …/export?format=xlsx` + current filters |
| Download PDF | `GET …/export?format=pdf` + current filters |

Changing any filter reloads the list (`page` resets to `1`). Export uses the **current** filters, not only the visible page.

---

## 6. Suggested indexes

```text
expenses:
  - { expenseDate: -1 }
  - { vendorId: 1, expenseDate: -1 }
  - { vendorId: 1, expenseDate: -1, createdAt: -1 }
  - text index (optional): notes, supplierInvoiceSerialNo, vendorSnapshot.name,
    categorySnapshot.name, items.itemName, items.categorySnapshot.name
```

---

## 7. Error responses

```json
{
  "success": false,
  "message": "fromDate must be before or equal to toDate",
  "errors": [
    { "field": "fromDate", "message": "Invalid range" }
  ]
}
```

```json
{
  "success": false,
  "message": "format is required and must be xlsx or pdf",
  "errors": [
    { "field": "format", "message": "Allowed values: xlsx, pdf" }
  ]
}
```

```json
{
  "success": false,
  "message": "Too many rows to export (max 10000). Narrow the date range or filters."
}
```

---

## 8. Implementation order

1. Extend `GET /api/admin/expenses` with `fromDate`, `toDate`, `search`, `vendorId` (+ `summary`).
2. Add `GET /api/admin/expenses/export?format=xlsx` (same filter query).
3. Add `format=pdf` on the same export endpoint.
4. Confirm vendor list `GET /api/admin/vendors?search=` for the filter dropdown.

---

## 9. Backend checklist

- [ ] `fromDate` / `toDate` inclusive on `expenseDate`, `Asia/Kolkata`
- [ ] `400` when `fromDate > toDate`
- [ ] `search` case-insensitive across notes, invoice no., vendor name, categories, item names
- [ ] `vendorId` exact match
- [ ] Filters AND together; search fields OR within search
- [ ] List `summary` over full filtered set (not page slice)
- [ ] Export ignores pagination and applies identical filters
- [ ] `format=xlsx` and `format=pdf` both work
- [ ] Correct `Content-Type` + `Content-Disposition` attachment filenames
- [ ] Empty filter result → empty file with headers, not `404`
- [ ] Payable amount column matches list UI (`amount`)
