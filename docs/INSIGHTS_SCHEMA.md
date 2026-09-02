# Insights Dashboard — API Schema

**Audience:** Backend team  
**Status:** Proposed (frontend implemented against these contracts)  
**Auth:** Admin JWT required on all endpoints  
**UI route:** `/admin/insights`  
**Charts:** Recharts (Area / Pie / Bar / Line)  
**Related:** [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md), [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md), [REMOVE_PURCHASES_AND_PURCHASE_ORDERS.md](./REMOVE_PURCHASES_AND_PURCHASE_ORDERS.md)

Use this document to design aggregated APIs for the **Insights** dashboard: KPI cards, reports overview chart, payments breakdown, pending invoices, weekly revenue, and product analysis — all filterable by **start and end dates**.

---

## Auth

```http
Authorization: Bearer <admin_jwt_token>
```

| HTTP | Meaning |
|------|---------|
| `401` | Missing / invalid token |
| `403` | Logged in but not an admin |
| `400` | Invalid date range (`fromDate` > `toDate`, bad format) |

Success envelope:

```json
{
  "success": true,
  "data": { }
}
```

---

## Date filtering (critical)

All Insights sections accept ISO dates:

| Param | Type | Required | Format |
|-------|------|----------|--------|
| `fromDate` | string | **Yes** | `YYYY-MM-DD` |
| `toDate` | string | **Yes** | `YYYY-MM-DD` |

Rules:

1. `fromDate` and `toDate` are **inclusive** (full days in business timezone, prefer `Asia/Kolkata`).
2. Reject if `fromDate > toDate` with `400`.
3. Frontend defaults to **current calendar month** on load.
4. **Reports Overview**, **Payments**, and **Pending Invoices** use the **overview** date range.
5. **Weekly Revenue** is always the **last 7 calendar days ending today** (ignore overview range, or return this window inside the overview response).
6. **Product Analysis** has its **own** independent `fromDate` / `toDate`.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/insights` | Overview KPIs + charts for one date range |
| `GET` | `/api/admin/insights/product-analysis` | Product ranking + trend for a (possibly different) range |

### Query examples

```http
GET /api/admin/insights?fromDate=2026-07-01&toDate=2026-07-15
GET /api/admin/insights/product-analysis?fromDate=2026-07-01&toDate=2026-07-15
```

---

## 1. Overview — `GET /api/admin/insights`

### Response shape

```json
{
  "success": true,
  "data": {
    "fromDate": "2026-07-01",
    "toDate": "2026-07-15",
    "kpis": {
      "cashIn": 125000.5,
      "cashOut": 84320,
      "productsSold": 312,
      "customers": 48,
      "pendingInvoicesAmount": 22000,
      "invoicesCreated": 37
    },
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
      },
      {
        "date": "2026-07-02",
        "label": "02 Jul",
        "sales": 5200,
        "expenses": 1200,
        "indirectIncome": 500
      }
    ],
    "paymentsBreakdown": [
      { "label": "UPI", "amount": 45000, "count": 22 },
      { "label": "Cash", "amount": 12000, "count": 8 },
      { "label": "Card", "amount": 8000, "count": 5 },
      { "label": "Net Banking", "amount": 5000, "count": 2 }
    ],
    "pendingInvoices": [
      {
        "id": "ObjectId",
        "invoiceNumber": "INV-1042",
        "customerName": "Ravi Traders",
        "amount": 8500,
        "dueDate": "2026-07-20",
        "status": "pending"
      }
    ],
    "weeklyRevenue": [
      { "date": "2026-07-09", "label": "Thu", "revenue": 4200 },
      { "date": "2026-07-10", "label": "Fri", "revenue": 6100 },
      { "date": "2026-07-11", "label": "Sat", "revenue": 0 },
      { "date": "2026-07-12", "label": "Sun", "revenue": 1800 },
      { "date": "2026-07-13", "label": "Mon", "revenue": 7400 },
      { "date": "2026-07-14", "label": "Tue", "revenue": 5100 },
      { "date": "2026-07-15", "label": "Wed", "revenue": 3900 }
    ]
  }
}
```

---

### 1.1 KPI cards (`kpis`)

| Field | Type | UI label | Suggested calculation |
|-------|------|----------|------------------------|
| `cashIn` | number | Cash In | Sum of payments **received** in range (orders paid, other cash-in) |
| `cashOut` | number | Cash Out | Expenses paid in range (no purchases / POs) |
| `productsSold` | number | Products Sold | Sum of order line quantities for paid/confirmed orders in range |
| `customers` | number | Customers | Distinct customers with at least one order in range |
| `pendingInvoicesAmount` | number | Pending Invoices | Sum of open / unpaid invoice amounts (**as of now**, or as of `toDate`) |
| `invoicesCreated` | number | Invoices Created | Count of invoices/orders created with `createdAt` in range |

All money fields in **INR**. Use `0` when empty (do not omit).

---

### 1.2 Totals (`totals`) — right-side colored cards

Filtered by overview `fromDate`–`toDate`.

| Field | UI | Source |
|-------|-----|--------|
| `sales` | Total Sales | Gross sales / invoice totals in range |
| `expenses` | Total Expenses | Sum of `expenses.amount` where `expenseDate` in range |
| `indirectIncome` | Total Indirect Income | Optional; return `0` until that module exists |

---

### 1.3 Reports series (`reportsSeries`) — Area chart

Time-bucketed series for the overview range.

| Field | Type | Notes |
|-------|------|-------|
| `date` | `YYYY-MM-DD` | Bucket start / day key |
| `label` | string | Short axis label (`01 Jul`, `W1`, …) |
| `sales` | number | |
| `expenses` | number | |
| `indirectIncome` | number | optional, default 0 |

**Bucketing rules**

| Range length | Bucket |
|--------------|--------|
| ≤ 31 days | **Daily** |
| 32–90 days | **Weekly** |
| > 90 days | **Monthly** |

Always return **contiguous buckets** (fill missing days/weeks with zeros) so the chart has a continuous X axis.

Return `[]` when there is truly no activity **and** you prefer empty state — **or** return zero-filled buckets. Frontend shows **“No data”** when the array is empty **or** every metric is `0` across all points (either is fine; empty array is simplest).

---

### 1.4 Payments breakdown (`paymentsBreakdown`) — Pie chart

Aggregate paid amounts in range by payment method.

```json
{ "label": "UPI", "amount": 45000, "count": 22 }
```

Suggested labels (align with payment type enums):

```text
UPI | Cash | Card | Net Banking | Cheque | EMI | Other
```

Sources can include order payments + expense payments marked paid in range. Return `[]` for empty state.

---

### 1.5 Pending invoices (`pendingInvoices`)

List of currently unpaid / overdue invoices (limit **10**, highest amount or earliest due first).

```json
{
  "id": "ObjectId",
  "invoiceNumber": "INV-1042",
  "customerName": "Ravi Traders",
  "amount": 8500,
  "dueDate": "2026-07-20",
  "status": "pending"
}
```

Return `[]` → UI shows **“No Pending Invoices”**.

---

### 1.6 Weekly revenue (`weeklyRevenue`) — Bar chart

Exactly **7 points**, last 7 days ending **today** (not governed by overview filter).

```json
{ "date": "2026-07-15", "label": "Wed", "revenue": 3900 }
```

Fill missing days with `revenue: 0`.

---

## 2. Product analysis — `GET /api/admin/insights/product-analysis`

Independent date range from the overview section.

### Response shape

```json
{
  "success": true,
  "data": {
    "fromDate": "2026-07-01",
    "toDate": "2026-07-15",
    "series": [
      {
        "date": "2026-07-01",
        "label": "01 Jul",
        "revenue": 8000,
        "unitsSold": 42
      },
      {
        "date": "2026-07-02",
        "label": "02 Jul",
        "revenue": 5200,
        "unitsSold": 28
      }
    ],
    "products": [
      {
        "productId": "ObjectId",
        "name": "Ragi Malt Powder",
        "unitsSold": 120,
        "revenue": 42000,
        "ordersCount": 35
      },
      {
        "productId": "ObjectId",
        "name": "Coconut Oil",
        "unitsSold": 80,
        "revenue": 28000,
        "ordersCount": 22
      }
    ]
  }
}
```

### Field notes

| Field | UI | Notes |
|-------|-----|-------|
| `series[]` | Line chart (Revenue) | Same bucketing rules as `reportsSeries`; frontend charts `revenue` |
| `series[].unitsSold` | optional | Useful for future dual-axis; table uses aggregate products |
| `products[]` | Ranking table | Top products by `revenue` desc; limit **10–20** |
| `products[].unitsSold` | Units column | Sum of quantities |
| `products[].revenue` | Revenue column | Sum of line totals |

Return empty arrays when no sales → UI empty states.

---

## 3. Aggregation source map (recommended)

| Metric | Prefer reading from |
|--------|---------------------|
| Sales / cash in / invoices | Orders (confirmed / paid) |
| Expenses / expense cash out | Expenses (`expenseDate`, `isPaid`) |
| Products sold / product analysis | Order line items × catalog / master products |
| Customers | Distinct `userId` / customer on orders |
| Pending invoices | Orders / invoices with unpaid status |
| Payment mix | Payment records on orders + expenses |

Use consistent money rounding: **2 decimal places**.

---

## 4. Frontend behaviour (already implemented)

| UI section | Filter | Chart / widget |
|------------|--------|----------------|
| 6 KPI cards | Overview range | Number cards |
| Reports Overview | Overview **Apply** | Recharts **AreaChart** (`sales`, `expenses`) |
| Total Sales / Expenses / Indirect Income | Overview range | Colored total cards |
| Payments | Overview range | Recharts **PieChart** |
| Pending Invoices | Snapshot list | List |
| Weekly Revenue | Last 7 days | Recharts **BarChart** |
| Product Analysis | **Separate** Apply | Recharts **LineChart** + products table |

Route: `/admin/insights`  
Nav: **Insights** in admin sidebar.

---

## 5. Empty vs error

| Case | Backend | Frontend |
|------|---------|----------|
| Valid range, no activity | `200` with zeros / empty arrays | “No data” empty states |
| Invalid dates | `400` + message | Error banner |
| Auth failure | `401` / `403` | Existing auth redirect / error |

Do **not** return `404` for empty dashboards.

---

## 6. Implementation order (recommended)

1. `GET /api/admin/insights` with `kpis` + `totals` only  
2. Add `reportsSeries` (daily buckets)  
3. Add `paymentsBreakdown`, `pendingInvoices`, `weeklyRevenue`  
4. `GET /api/admin/insights/product-analysis`  
5. Weekly/monthly bucketing for longer ranges  

---

## 7. Example error response

```json
{
  "success": false,
  "message": "fromDate must be before or equal to toDate",
  "errors": [
    { "field": "fromDate", "message": "Invalid range" }
  ]
}
```
