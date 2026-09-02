# Admin Orders Export — Backend Schema

**Audience:** Backend team
**Status:** Proposed (frontend has a client-side fallback live now; this doc specs the server endpoint to replace it)
**Auth:** Admin JWT required
**Related:** [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md) (list/detail/status endpoints + filter semantics), [EXPENSE_FILTERS_EXPORT_SCHEMA.md](./EXPENSE_FILTERS_EXPORT_SCHEMA.md) (same pattern, already shipped for expenses)

The admin Orders page needs an **Excel download for the selected date range** (and other active filters) with the full order record — customer, items, tax, coupon, and payment info — not just the columns shown in the table.

Frontend already calls this endpoint. Until it exists (or on any error), frontend automatically falls back to paging through `GET /api/admin/orders` and building the same workbook client-side — so this is not a blocker, but the client fallback is slower for large ranges and can't include anything not already returned by the list endpoint (see §3 below).

---

## 1. Endpoint

```http
GET /api/admin/orders/export?format=xlsx&fromDate=&toDate=&status=&paymentStatus=&search=
Authorization: Bearer <admin_jwt_token>
```

| Param | Required | Notes |
|-------|----------|-------|
| `format` | **Yes** | Only `xlsx` for now |
| `fromDate` | No | `YYYY-MM-DD`, inclusive, filters `createdAt` — same semantics as list (see [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md#1-list-orders)) |
| `toDate` | No | `YYYY-MM-DD`, inclusive |
| `status` | No | `pending` \| `completed` \| `cancelled` |
| `paymentStatus` | No | `initiated` \| `COMPLETED` \| `FAILED` |
| `search` | No | Same free-text match as list (`orderNumber`, customer `name`/`contactNumber`/`city`) |
| `page` / `limit` | — | **Ignored** — export always returns **all** matching rows for the filtered range |

Filters must mean exactly what they mean on `GET /api/admin/orders` — export is "download what I'm currently looking at," never a different query.

### Validation

Same rules as list: reject `fromDate > toDate` with `400`; invalid `status`/`paymentStatus` values → `400`.

---

## 2. Response

```http
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="orders_2026-08-01_2026-08-31.xlsx"
```

### Filename convention

```text
orders_{fromDate|all}_{toDate|all}.xlsx
```

- `orders_2026-08-01_2026-08-31.xlsx`
- `orders_all_2026-08-31.xlsx` (only `toDate` set)
- `orders_all_all.xlsx` (no date filter)

### Empty result set

Return `200` with a valid workbook that has headers and zero data rows. Do **not** return `404`.

### Max rows (optional guard)

If a hard cap is needed (e.g. 20,000 rows), return `400` with a message asking the admin to narrow the date range — do not silently truncate.

---

## 3. Important: fields needed that the list endpoint may not return today

Per [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md), `GET /api/admin/orders` (list) omits `paymentResult`, and its example response doesn't show `discountAmount`, `couponCode`, or the tax breakdown (`taxableAmount`, `cgstAmount`, `sgstAmount`, `igstAmount`, `taxAmount`, `taxType`) — only `GET /api/admin/orders/{id}` (detail) is documented as including `paymentResult`.

**Please confirm which of these are already present on list rows.** If the export endpoint is implemented by querying the same order collection directly (not going through the list serializer), this is moot — just include everything in §4 below. But if export reuses the list query/serializer, make sure it includes:

- `paymentResult.status`, `paymentResult.paymentDate`
- `discountAmount`, `couponCode`
- `taxableAmount`, `cgstAmount`, `sgstAmount`, `igstAmount`, `taxAmount`, `taxType`, `cgstRate`, `sgstRate`, `igstRate`

so the export doesn't have blank columns for data that actually exists on the order.

---

## 4. Excel (`.xlsx`) column layout

One sheet named **`Orders`**, one row per order (not one row per line item — items are summarized in one column).

| Col | Header | Source |
|-----|--------|--------|
| A | Order # | `orderNumber` |
| B | Order Date | `orderDate` or `createdAt`, date only |
| C | Status | `status` |
| D | Payment Status | `paymentStatus` |
| E | Order Type | `orderType` |
| F | Manual Entry | `Yes` / `No` from `manual_entry` |
| G | Customer Name | `customer.name` |
| H | Phone | `customer.contactNumber` |
| I | Alternate Phone | `customer.alternateNumber` |
| J | Address | `customer.address` + `customer.landmark`, comma-joined |
| K | City | `customer.city` |
| L | State | `customer.state` |
| M | Pincode | `customer.pincode` |
| N | Country | `customer.country` |
| O | Items | Each line as `Name (Variant) xQty`, semicolon-joined |
| P | Item Count | `items.length` |
| Q | Subtotal | `subtotal` |
| R | Discount | `discountAmount` (0 if none) |
| S | Coupon Code | `couponCode` (blank if none) |
| T | Taxable | `taxableAmount` (blank if order has no tax) |
| U | CGST | `cgstAmount` |
| V | SGST | `sgstAmount` |
| W | IGST | `igstAmount` |
| X | Tax Total | `taxAmount` |
| Y | Total Amount | `totalAmount` |
| Z | Currency | `currency` |
| AA | Gateway Status | `paymentResult.status` |
| AB | Payment Date | `paymentResult.paymentDate` |
| AC | Created | `createdAt` |
| AD | Updated | `updatedAt` |

**Footer row (last row):**

| Label | Value |
|-------|-------|
| Count | Number of data rows (includes cancelled orders) |
| Total Amount (excl. cancelled) | Sum of column Y for orders where `status != cancelled` — matches the revenue-exclusion rule in [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md#revenue-rule-critical) |

Numbers as numeric cells (not pre-formatted strings). Dates as `YYYY-MM-DD` text or Excel date serials — be consistent. Sort rows by `createdAt` descending (matches list default).

---

## 5. Checklist

- [ ] `GET /api/admin/orders/export?format=xlsx` implemented, admin-JWT gated
- [ ] Filters (`fromDate`, `toDate`, `status`, `paymentStatus`, `search`) match list semantics exactly
- [ ] Response includes all fields in §4, confirmed against §3
- [ ] Filename follows the convention in §2
- [ ] Empty result → `200` with header-only workbook, not `404`
- [ ] `fromDate > toDate` → `400`
