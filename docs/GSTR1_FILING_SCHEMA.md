# GSTR-1 Filing Report — Backend Schema

**Audience:** Backend team
**Status:** Proposed — frontend implemented against this contract
**Related:** [GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md) (CGST/SGST vs IGST split rules), [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md), [ADMIN_MANUAL_ORDER_SCHEMA.md](./ADMIN_MANUAL_ORDER_SCHEMA.md), [INSIGHTS_SCHEMA.md](./INSIGHTS_SCHEMA.md)

This document defines 3 new read-only reporting endpoints that power the admin **GSTR-1 Filing** page: **Consolidated**, **B2CS**, and **HSN (B2C)**. Together they give a filer everything needed to prepare a GSTR-1 return for a date range.

---

## 1. Scope — which orders are included

All 3 endpoints operate over the same base filter. **Do not** invent a different definition per endpoint.

| Filter | Value |
|--------|-------|
| `status` | `"completed"` |
| `paymentStatus` | `"COMPLETED"` |
| Date field | `orderDate` (fallback to `createdAt` if `orderDate` is absent) |
| Date range | Inclusive of both `fromDate` and `toDate`, `YYYY-MM-DD`, business timezone (Asia/Kolkata) |

This matches the definition already used for revenue elsewhere in the app (Insights). Orders that are `pending` or `cancelled`, or whose payment did not complete, must **never** appear in a GSTR-1 report.

### Critical rule — do not recompute GST independently

Every taxable/CGST/SGST/IGST figure in these reports must be produced by **summing the tax fields already persisted on the order and its line items** (`taxableAmount`/`taxable`, `cgstAmount`, `sgstAmount`, `igstAmount`, `taxRate`) — the same fields already returned by `GET /api/admin/orders/:id` and documented in [GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md). Do **not** re-derive place-of-supply or re-split tax with separate logic here — that would risk this report disagreeing with the order/invoice itself, which is unacceptable for a legal filing.

### Legacy / incomplete orders

Some orders in a date range may predate the GST place-of-supply work and lack a persisted tax breakdown (no `taxAmount` stored). These orders must be:

1. **Excluded** from all 3 reports' `items` and `summary` totals.
2. **Counted** in `summary.incompleteOrders` on every response, so the admin UI can warn the filer to fix them before filing (never silently guessed or defaulted).

---

## 2. Common conventions

- Auth: Admin JWT (`Authorization: Bearer <token>`), same as all other `/admin/*` endpoints.
- Envelope: `{ "success": true, "data": { "items": [...], "pagination": {...}, "summary": {...} } }` (matches the Insights convention).
- Query params common to all 3 endpoints:

| Param | Required | Type | Notes |
|-------|----------|------|-------|
| `fromDate` | Yes | `YYYY-MM-DD` | Inclusive start |
| `toDate` | Yes | `YYYY-MM-DD` | Inclusive end |
| `page` | No | number | Default `1`. Ignored when `all=true` |
| `limit` | No | number | Default `25`. Ignored when `all=true` |
| `all` | No | boolean | When `true`, return **every** matching row unpaginated (used by the frontend's Excel export) — `pagination` in the response should reflect the full unpaginated count in this case |

- `400` if `fromDate` is missing, `toDate` is missing, or `fromDate > toDate`.

### `summary` — always reflects the FULL filtered dataset

**Important:** `summary` must be computed over **every** matching row for the date range, regardless of `page`/`limit`. It is not a per-page total. The frontend displays `summary` as a KPI strip and per-tab grand-total bar even while only one page of `items` is loaded, and reuses it for the Excel grand-total row.

```json
"summary": {
  "totalOrders": 320,
  "totalInvoiceValue": 480000.00,
  "totalTaxableValue": 457142.86,
  "totalCgstAmount": 11190.48,
  "totalSgstAmount": 11190.47,
  "totalIgstAmount": 0.00,
  "incompleteOrders": 2
}
```

Fields not meaningful to a given endpoint (e.g. `totalInvoiceValue` for B2CS) should still be present, set to `0`, for a stable shape across all 3 endpoints.

---

## 3. Endpoint 1 — Consolidated (invoice register)

`GET /api/admin/gstr1/consolidated?fromDate=&toDate=&page=&limit=&all=`

One row **per dispatched order** in the range — effectively an invoice register.

### Field-by-field math

| Field | Derivation |
|-------|------------|
| `receiverName` | `order.customer.name` |
| `orderNumber` | `order.orderNumber` (this **is** the invoice number — shared sequence `NA-YYYY-NNNNN`; see [INVOICE_NUMBER_SCHEMA.md](./INVOICE_NUMBER_SCHEMA.md)) |
| `invoiceDate` | `order.orderDate \|\| order.createdAt`, returned as `YYYY-MM-DD` |
| `invoiceValue` | `order.totalAmount \|\| order.subtotal` (GST-inclusive grand total, unchanged) |
| `placeOfSupply` | `order.customer.state`, normalized (see §6) |
| `taxRate` | `order.taxRate` (currently always `5`) |
| `taxableValue` | `order.taxableAmount` |
| `cgstAmount` | `order.cgstAmount` (`0` when `taxType = "igst"`) |
| `sgstAmount` | `order.sgstAmount` (`0` when `taxType = "igst"`) |
| `igstAmount` | `order.igstAmount` (`0` when `taxType = "cgst_sgst"`) |

**Identity check (must hold within rounding paisa):**

```
taxableValue + cgstAmount + sgstAmount + igstAmount ≈ invoiceValue
```

Sort: `invoiceDate` ascending, then `orderNumber` ascending.

### Example item

```json
{
  "orderId": "6a9f...",
  "orderNumber": "NA-2026-00042",
  "receiverName": "Priya Sharma",
  "invoiceDate": "2026-08-04",
  "invoiceValue": 1500.00,
  "placeOfSupply": "Karnataka",
  "taxRate": 5,
  "taxableValue": 1428.57,
  "cgstAmount": 35.72,
  "sgstAmount": 35.71,
  "igstAmount": 0.00
}
```

### Example response

```json
{
  "success": true,
  "data": {
    "items": [ /* as above */ ],
    "pagination": {
      "total": 320, "page": 1, "limit": 25, "totalPages": 13,
      "hasNextPage": true, "hasPrevPage": false
    },
    "summary": {
      "totalOrders": 320,
      "totalInvoiceValue": 480000.00,
      "totalTaxableValue": 457142.86,
      "totalCgstAmount": 11190.48,
      "totalSgstAmount": 11190.47,
      "totalIgstAmount": 0.00,
      "incompleteOrders": 2
    }
  }
}
```

---

## 4. Endpoint 2 — B2CS (grouped by State + Tax Rate)

`GET /api/admin/gstr1/b2cs?fromDate=&toDate=&all=`

GSTR-1's B2CS section reports small B2C supplies **consolidated by place of supply and tax rate** rather than per-invoice (since this storefront has no B2B/registered customers, every sale is B2C). Group the same order set from §1 by `(placeOfSupply, taxRate)`.

### Field-by-field math

| Field | Derivation |
|-------|------------|
| `numberOfOrders` | Count of orders in this `(placeOfSupply, taxRate)` bucket |
| `placeOfSupply` | Bucket key — normalized state name |
| `taxRate` | Bucket key — e.g. `5` |
| `taxableValue` | `Σ order.taxableAmount` for orders in the bucket |

Sort: `placeOfSupply` ascending.

**Cross-check:** `Σ items[].numberOfOrders == summary.totalOrders` and `Σ items[].taxableValue == summary.totalTaxableValue` (within rounding).

### Example item

```json
{
  "placeOfSupply": "Karnataka",
  "taxRate": 5,
  "numberOfOrders": 50,
  "taxableValue": 71428.50
}
```

Pagination applies only if there are many state buckets (unlikely in practice, but keep the same envelope shape for consistency — `all=true` still works the same way).

---

## 5. Endpoint 3 — HSN (B2C) (grouped by Product/Catalogue Name)

`GET /api/admin/gstr1/hsn-summary?fromDate=&toDate=&page=&limit=&all=`

**Note:** catalog products do not carry an HSN/SAC code today (only internal Master Products do — see [GST_PLACE_OF_SUPPLY_SCHEMA.md](./GST_PLACE_OF_SUPPLY_SCHEMA.md) HSN discussion). This tab therefore groups by the **snapshot product name stored on each order line at time of sale** (`order.items[].name`), not by HSN code, and not by a live product lookup — this correctly reflects what was actually invoiced even if a product is later renamed or removed from the catalog.

### Field-by-field math

Group all order **line items** (from the same order set as §1) by `item.name`:

| Field | Derivation |
|-------|------------|
| `productName` | `item.name` (the grouping key) |
| `totalQuantity` | `Σ item.quantity` |
| `totalValue` | `Σ item.lineTotal` (GST-inclusive) |
| `rate` | `item.taxRate` (currently always `5` — flat rate across the catalog) |
| `taxableValue` | `Σ item.taxable` |
| `igstAmount` | `Σ item.igstAmount` |
| `cgstAmount` | `Σ item.cgstAmount` |
| `sgstAmount` | `Σ item.sgstAmount` |

**Identity check:** `taxableValue + igstAmount + cgstAmount + sgstAmount ≈ totalValue`.

Sort: `productName` ascending.

### Example item

```json
{
  "productName": "Herbal Hair Oil",
  "totalQuantity": 120,
  "totalValue": 90000.00,
  "rate": 5,
  "taxableValue": 85714.29,
  "igstAmount": 1500.00,
  "cgstAmount": 1392.86,
  "sgstAmount": 1392.85
}
```

### Forward-compat note

If HSN/SAC codes are added to catalog products in the future, add an optional `hsn` field to this item shape without breaking the existing contract (frontend already reads fields by name, not by position).

---

## 6. State normalization (must match order-level GST logic)

Group/compare states using the **same alias rules** already used to decide CGST/SGST vs IGST on the order itself (`src/lib/gst.js` on the frontend):

- Treat `"Karnataka"`, `"KA"`, and GSTIN prefix `29` as the same state.
- Trim and normalize casing/whitespace before grouping (`"karnataka "` and `"Karnataka"` must land in the same B2CS bucket).
- If `customer.state` is missing entirely on an order, default to **Karnataka** (matches the existing frontend default) rather than dropping the order.

Using different normalization here than what was used to persist `taxType`/`cgstAmount`/`igstAmount` on the order would silently produce a B2CS report that doesn't reconcile with the Consolidated tab — avoid this by sharing one normalization function server-side.

---

## 7. Acceptance checklist

- [ ] All 3 endpoints only include orders with `status: "completed"` and `paymentStatus: "COMPLETED"`
- [ ] Date filtering uses `orderDate` with `createdAt` fallback, inclusive on both ends
- [ ] No endpoint recomputes GST — all tax figures are sums of persisted order/line fields
- [ ] Orders missing a persisted tax breakdown are excluded from `items`/`summary` and counted in `summary.incompleteOrders`
- [ ] `summary` reflects the entire filtered dataset, not just the current page
- [ ] `all=true` returns every matching row unpaginated on all 3 endpoints
- [ ] Consolidated: `taxableValue + cgstAmount + sgstAmount + igstAmount ≈ invoiceValue` for every row
- [ ] B2CS: grouped by normalized `(placeOfSupply, taxRate)`; `Σ numberOfOrders == summary.totalOrders`
- [ ] HSN (B2C): grouped by order-line snapshot `item.name` (not a live product lookup); `taxableValue + igstAmount + cgstAmount + sgstAmount ≈ totalValue` for every row
- [ ] State normalization matches the aliases used for order-level CGST/SGST vs IGST decisions (`Karnataka` / `KA` / GSTIN prefix `29`)

---

## 8. Frontend already sending / expecting

| Surface | Behaviour |
|---------|-----------|
| GSTR-1 Filing page (admin) | Loads all 3 endpoints for the selected date range on load and on "Apply"; each tab paginates independently with `page`/`limit=25` |
| KPI strip + per-tab grand total | Reads `summary` from the normal paginated response (not `all=true`) |
| "Download Excel" | Calls all 3 endpoints once more with `all=true` to fetch the full dataset, then builds a formatted 3-sheet workbook client-side |
