# Admin Master Data — API Schema

**Audience:** Backend team  
**Status:** Proposed (frontend implemented against these contracts)  
**Auth:** Admin JWT required on all endpoints  
**Related:** [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md), [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md), [REMOVE_PURCHASES_AND_PURCHASE_ORDERS.md](./REMOVE_PURCHASES_AND_PURCHASE_ORDERS.md), [PRODUCT_SCHEMA.md](./PRODUCT_SCHEMA.md)

Use this document for **Vendors**, **Master Products**, **Units**, **Users**, plus **Categories** and storefront **Catalog Products**.

> **Removed from product:** Purchases and Purchase Orders. See [REMOVE_PURCHASES_AND_PURCHASE_ORDERS.md](./REMOVE_PURCHASES_AND_PURCHASE_ORDERS.md). Do not implement `/api/admin/purchases*` or `/api/admin/purchase-orders*`.

---

## Critical: Edit flow = GET by ID

On every **Edit** (and View for catalog products), the frontend does **not** reuse the list-row object. It calls:

```http
GET /api/<resource>/{id}
Authorization: Bearer <admin_jwt_token>
```

and populates the form only after this response.

| UI action | API called first |
|-----------|------------------|
| Edit Vendor | `GET /api/admin/vendors/{id}` |
| Edit Master Product | `GET /api/admin/master-products/{id}` |
| Edit User | `GET /api/admin/users/{id}` |
| Edit / View Catalog Product | `GET /api/admin/products/{id}` |
| Edit Category | `GET /api/categories/{id}` |
| Edit Expense / Expense Category | See [EXPENSE_SCHEMA.md](./EXPENSE_SCHEMA.md) |

### GET by ID response shape

```json
{
  "success": true,
  "data": {
    "id": "ObjectId",
    "...": "full entity including nested relations needed for the form"
  }
}
```

### What list vs detail should return

| Endpoint | May be slim | Must include on GET by ID |
|----------|-------------|---------------------------|
| Vendors list | name, company, phone, gstin | full `billingAddress`, tags, notes |
| Master products list | name, unit, prices, stock | all price/tax/unit/HSN/description fields |
| Users list | name, email, role | phone, isActive (never password) |
| Catalog products list | name, cover, price | full quantities, images, specs, benefits |
| Categories list | name, image | description, sortOrder, isActive |

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

| Entity | Purpose |
|--------|---------|
| **Vendor** | Supplier contacts |
| **Master Product** | Inventory / pricing master |
| **Unit** | Primary units (PCS, KGS, …) |
| **User** | Admin panel users |

**Note:** Storefront catalog products (`/admin/products`) are separate from master products (`/admin/master-products`).

---

## Endpoint cheat sheet (GET by ID required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/vendors/{id}` | Full vendor for edit |
| `GET` | `/api/admin/master-products/{id}` | Full master product for edit |
| `GET` | `/api/admin/users/{id}` | Full user for edit |
| `GET` | `/api/admin/products/{id}` | Full catalog product for edit/view |
| `GET` | `/api/categories/{id}` | Full category for edit |
| `GET` | `/api/admin/units` | Unit master list (optional) |

Plus list / create / update / delete for each resource below.

---

## 1. Vendors

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/vendors` | List / search |
| `GET` | `/api/admin/vendors/{id}` | Get one (required for Edit) |
| `POST` | `/api/admin/vendors` | Create |
| `PUT` | `/api/admin/vendors/{id}` | Update |
| `DELETE` | `/api/admin/vendors/{id}` | Delete |

### Query params (list)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page (≥ 1) |
| `limit` | number | Page size (1–100) |
| `search` | string | Match `name`, `company`, `gstin`, `tags`, `phone`, `email` |

### Schema

```json
{
  "id": "ObjectId",
  "name": "string (required)",
  "phone": "string",
  "email": "string",
  "company": "string",
  "gstin": "string",
  "tags": ["string"],
  "notes": "string",
  "billingAddress": {
    "line1": "string",
    "line2": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "country": "string"
  },
  "isActive": true,
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

---

## 2. Units (master)

Frontend has defaults (`PCS`, `KGS`, `G`, `L`, `ML`, `BOX`, `PKT`) if this API is not ready.

| Method | Path |
|--------|------|
| `GET` | `/api/admin/units` |
| `POST` | `/api/admin/units` |
| `PUT` | `/api/admin/units/{id}` |
| `DELETE` | `/api/admin/units/{id}` |

```json
{ "id": "pcs", "code": "PCS", "name": "Pieces", "isActive": true, "sortOrder": 0 }
```

---

## 3. Master Products

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/master-products` | List / search |
| `GET` | `/api/admin/master-products/{id}` | Get one (required for Edit) |
| `POST` | `/api/admin/master-products` | Create |
| `PUT` | `/api/admin/master-products/{id}` | Update |
| `DELETE` | `/api/admin/master-products/{id}` | Delete |

Default `taxRate = 5`. Store both selling prices:

```text
incl = excl * (1 + taxRate / 100)
excl = incl / (1 + taxRate / 100)
```

```json
{
  "id": "ObjectId",
  "type": "product | service",
  "name": "Coconut",
  "sellingPriceExclTax": 38.0952381,
  "sellingPriceInclTax": 40,
  "purchasePriceExclTax": 30,
  "taxRate": 5,
  "primaryUnitId": "kgs",
  "hsnSac": "0801",
  "barcode": "",
  "category": "Produce",
  "description": "",
  "stock": 50,
  "isActive": true
}
```

---

## 4. Users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/users` | List |
| `GET` | `/api/admin/users/{id}` | Get one (required for Edit) |
| `POST` | `/api/admin/users` | Create |
| `PUT` | `/api/admin/users/{id}` | Update |
| `DELETE` | `/api/admin/users/{id}` | Delete |

```json
{
  "id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "role": "admin | staff | viewer",
  "isActive": true
}
```

Never return password. On update, password is optional.

---

## 5. Catalog products & categories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/products/{id}` | Full catalog product for Edit / View |
| `GET` | `/api/categories/{id}` | Full category for Edit |

Ensure GET by ID returns the complete product (quantities, images, specs, benefits).

---

## 6. Frontend route ↔ API map

| Admin UI | Route | List API | Detail (Edit) API |
|----------|-------|----------|-------------------|
| Expenses | `/admin/expenses` | `GET /admin/expenses` | `GET /admin/expenses/{id}` |
| Expense Categories | `/admin/expense-categories` | `GET /admin/expense-categories` | `GET /admin/expense-categories/{id}` |
| Vendors | `/admin/vendors` | `GET /admin/vendors` | `GET /admin/vendors/{id}` |
| Master Products | `/admin/master-products` | `GET /admin/master-products` | `GET /admin/master-products/{id}` |
| Users | `/admin/users` | `GET /admin/users` | `GET /admin/users/{id}` |
| Catalog | `/admin/products` | `GET /admin/products` | `GET /admin/products/{id}` |
| Categories | `/admin/categories` | `GET /categories` | `GET /categories/{id}` |

### UI behaviour

1. Click **Edit** → frontend sends **only the id** to GET-by-ID → form fills from that response.
2. **Create** opens drawer without a prior GET.

---

## 7. Error shape

```json
{
  "success": false,
  "message": "Not found",
  "errors": {}
}
```

Use `404` when `{id}` does not exist.

---

**Frontend status:** Purchases and Purchase Orders UI removed. Expenses restored. Master data (vendors, master products, users, catalog, categories) still uses GET-by-ID on Edit.
