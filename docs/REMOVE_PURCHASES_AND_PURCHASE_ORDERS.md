# Remove Purchases & Purchase Orders — Backend Notice

**Audience:** Backend team  
**Status:** Required — frontend already applied this change  
**Date:** 2026-08-05  
**Related:** [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md), [INSIGHTS_SCHEMA.md](./INSIGHTS_SCHEMA.md), [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md)

---

## Summary

The admin frontend has **restored Expenses** and **removed Purchases + Purchase Orders**.

Backend must match so APIs and Insights stay aligned.

| Module | Action |
|--------|--------|
| **Expenses** | **Keep / restore** — live |
| **Expense categories** | **Keep / restore** — live |
| **Purchases** (vendor bills / `INV-…`) | **Remove** |
| **Purchase Orders** (`PO-…`) | **Remove** |
| **Vendors** | **Keep** (master data; no longer PO-linked UI) |
| **Master products** | **Keep** (master data) |
| **Orders / Catalog / Insights** | **Keep** (Insights: sales + expenses; no purchases) |

---

## Why

Frontend now has:

- Routes: `/admin/expenses`, `/admin/expense-categories`
- No routes for `/admin/purchases` or `/admin/purchase-orders`
- Insights chart / totals for **sales** and **expenses** only (no `purchases`)

---

## Endpoints to remove

Stop implementing / delete these routes (return `404` or remove from router):

### Purchases (vendor invoices)

| Method | Path |
|--------|------|
| `GET` | `/api/admin/purchases` |
| `GET` | `/api/admin/purchases/{id}` |
| `POST` | `/api/admin/purchases` |
| `PUT` | `/api/admin/purchases/{id}` |
| `DELETE` | `/api/admin/purchases/{id}` |

### Purchase Orders

| Method | Path |
|--------|------|
| `GET` | `/api/admin/purchase-orders` |
| `GET` | `/api/admin/purchase-orders/{id}` |
| `POST` | `/api/admin/purchase-orders` |
| `PUT` | `/api/admin/purchase-orders/{id}` |
| `DELETE` | `/api/admin/purchase-orders/{id}` |

Also remove any **PO → Purchase conversion** jobs or helpers.

---

## Endpoints to keep (expenses)

Implement / keep per [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md):

### Expenses

| Method | Path |
|--------|------|
| `GET` | `/api/admin/expenses` |
| `GET` | `/api/admin/expenses/{id}` |
| `POST` | `/api/admin/expenses` |
| `PUT` | `/api/admin/expenses/{id}` |
| `DELETE` | `/api/admin/expenses/{id}` |

### Expense categories

| Method | Path |
|--------|------|
| `GET` | `/api/admin/expense-categories` |
| `GET` | `/api/admin/expense-categories/{id}` |
| `POST` | `/api/admin/expense-categories` |
| `PUT` | `/api/admin/expense-categories/{id}` |
| `DELETE` | `/api/admin/expense-categories/{id}` |

### Also keep

| Area | Paths |
|------|--------|
| Vendors | `/api/admin/vendors` |
| Master products | `/api/admin/master-products` |
| Orders | `/api/orders`, `/api/admin/orders` |
| Catalog / categories | `/api/admin/products`, `/api/categories` |
| Insights | `/api/admin/insights`, `/api/admin/insights/product-analysis` |

---

## Data / collections

| Collection / model | Action |
|--------------------|--------|
| `expenses` | **Keep** |
| `expensecategories` / `expense_categories` | **Keep** |
| `purchases` (invoice docs with `invoiceNumber`) | Deprecate → archive or drop |
| `purchaseorders` / `purchase_orders` | Deprecate → archive or drop |
| Indexes / jobs only for purchases or POs | Remove |

If soft-deleting purchase data for a transition:

1. Mark purchase / PO models deprecated.
2. Stop writing new purchase/PO documents.
3. Stop including them in Insights.
4. Hard-delete after an agreed retention window.

---

## Insights changes (required)

### Remove from `GET /api/admin/insights`

| Field path | Remove |
|------------|--------|
| `data.totals.purchases` | Yes |
| `data.reportsSeries[].purchases` | Yes |

### Keep / restore

| Field | Notes |
|-------|--------|
| `totals.sales` | From completed paid orders |
| `totals.expenses` | Sum of expenses in date range |
| `totals.indirectIncome` | Keep (or `0`) |
| `reportsSeries[].sales` | Keep |
| `reportsSeries[].expenses` | Keep |
| `kpis.cashOut` | Prefer **expenses paid** in range (no purchase/PO amounts) |
| `kpis.cashIn` | Orders / payments received |
| Payment mix | May include expense payments; **not** purchase/PO payments |

### Example `totals` / series

```json
{
  "totals": {
    "sales": 125000.5,
    "expenses": 18320,
    "indirectIncome": 4000
  },
  "reportsSeries": [
    {
      "date": "2026-07-01",
      "label": "01 Jul",
      "sales": 8000,
      "expenses": 900,
      "indirectIncome": 0
    }
  ]
}
```

See [INSIGHTS_SCHEMA.md](./INSIGHTS_SCHEMA.md).

---

## Clarification: what was removed

| Name | Example number | Status |
|------|----------------|--------|
| **Purchase** | `INV-1` | Vendor bill — **removed** |
| **Purchase Order** | `PO-1` | Vendor PO — **removed** |
| **Expense** | — | Business expense — **live** |

---

## Acceptance checklist (backend)

- [ ] All `/api/admin/purchases*` routes removed or permanently `404`
- [ ] All `/api/admin/purchase-orders*` routes removed or permanently `404`
- [ ] `/api/admin/expenses*` works (list, get by id, create, update, delete)
- [ ] `/api/admin/expense-categories*` works
- [ ] Vendors + master products still available
- [ ] Insights omits `purchases` from `totals` and `reportsSeries`
- [ ] Insights includes `expenses` in `totals` and `reportsSeries`
- [ ] `cashOut` / payment mix do not include purchase or PO amounts
- [ ] No cron / export still depends on purchases or purchase-orders collections

---

## Frontend status

Already applied on the admin frontend:

- Expenses + expense categories UI restored
- Purchase Orders nav/route/API client removed
- Purchases remain absent
- Backend notice file renamed intent: this document replaces the earlier “remove expenses” notice
