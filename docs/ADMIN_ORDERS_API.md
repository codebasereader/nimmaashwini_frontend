# Admin Orders API — Frontend Integration

**Status:** Implemented  
**Auth:** Admin JWT required  
**Related:** [FRONTEND_PAYMENT_INTEGRATION.md](./FRONTEND_PAYMENT_INTEGRATION.md), [API.md](./API.md)

Use these endpoints in the admin panel to list, view, filter, create (manual), and update customer orders.

**Manual / offline create:** see [ADMIN_MANUAL_ORDER_SCHEMA.md](./ADMIN_MANUAL_ORDER_SCHEMA.md) for `POST /api/admin/orders` (`manual_entry: true`, GST 5%, completed + paid).

---

## Auth

All admin order endpoints require:

```http
Authorization: Bearer <admin_jwt_token>
```

Get the token from **POST `/api/auth/login`** (admin user).

| HTTP | Meaning |
|------|---------|
| `401` | Missing / invalid token |
| `403` | Logged in but not an admin |

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/orders` | Paginated order list |
| `GET` | `/api/admin/orders/{id}` | Single order detail |
| `POST` | `/api/admin/orders` | Create manual order (see [ADMIN_MANUAL_ORDER_SCHEMA.md](./ADMIN_MANUAL_ORDER_SCHEMA.md)) |
| `PUT` | `/api/admin/orders/{id}/status` | Update admin order status |

---

## 1. List orders

### `GET /api/admin/orders`

### Query parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number (≥ 1) |
| `limit` | number | `20` | Page size (1–100) |
| `status` | string | — | Filter by order status |
| `paymentStatus` | string | — | Filter by payment status |
| `search` | string | — | Search `orderNumber`, customer `name`, `contactNumber`, or `city` |
| `fromDate` | string | — | Start date filter, `YYYY-MM-DD`, inclusive on `createdAt` |
| `toDate` | string | — | End date filter, `YYYY-MM-DD`, inclusive on `createdAt` |

### Status values

**`status`**

| Value | Meaning |
|-------|---------|
| `pending` | Created, payment not completed |
| `completed` | Fulfilled / completed order |
| `cancelled` | Cancelled |

**`paymentStatus`**

| Value | Meaning |
|-------|---------|
| `initiated` | Checkout started, awaiting payment |
| `COMPLETED` | Paid |
| `FAILED` | Payment failed / abandoned |

### Example requests

```http
GET /api/admin/orders
Authorization: Bearer <token>
```

```http
GET /api/admin/orders?page=1&limit=20&status=confirmed
Authorization: Bearer <token>
```

```http
GET /api/admin/orders?paymentStatus=COMPLETED&search=Priya
Authorization: Bearer <token>
```

```http
GET /api/admin/orders?fromDate=2026-08-01&toDate=2026-08-31&status=pending
Authorization: Bearer <token>
```

### Success response — `200`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "6a476abc123def4567890123",
        "orderNumber": "NA-2026-00042",
        "status": "confirmed",
        "paymentStatus": "COMPLETED",
        "customer": {
          "name": "Priya Sharma",
          "contactNumber": "+91 98765 43210",
          "alternateNumber": "",
          "address": "42, Temple Road, Jayanagar 4th Block",
          "landmark": "Near Nimma Ashwini Store",
          "pincode": "560041",
          "city": "Bengaluru",
          "state": "Karnataka",
          "country": "India"
        },
        "items": [
          {
            "productId": "6a475c66b203bc97e100aaa1",
            "slug": "herbal-hair-oil",
            "name": "Herbal Hair Oil",
            "variantId": "250ml",
            "variantLabel": "250 ml",
            "quantity": 1,
            "unitPrice": 750,
            "lineTotal": 750
          }
        ],
        "subtotal": 750,
        "currency": "INR",
        "orderType": "domestic",
        "createdAt": "2026-07-03T10:15:00.000Z",
        "updatedAt": "2026-07-03T10:20:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

Orders are sorted by **newest first** (`createdAt` descending).

### Date preset behaviour used by frontend

Frontend sends explicit `fromDate` / `toDate` for these presets:

| Preset | Backend receives |
|--------|------------------|
| `Today` | `fromDate = today`, `toDate = today` |
| `Yesterday` | both set to yesterday |
| `This Month` | first day of current month → today |
| `3 Months` | first day of month, 2 months ago → today |
| `6 Months` | first day of month, 5 months ago → today |
| `1 Year` | first day of month, 11 months ago → today |

Backend should:

1. Treat both dates as **inclusive**.
2. Reject invalid ranges with `400` if `fromDate > toDate`.
3. Filter against order `createdAt` in business timezone.

---

## 2. Get order by ID

### `GET /api/admin/orders/{id}`

`{id}` is the MongoDB order id (same as `data.id` / `merchantOrderId` from checkout).

### Example request

```http
GET /api/admin/orders/6a476abc123def4567890123
Authorization: Bearer <token>
```

### Success response — `200`

Same order shape as list items, plus **`paymentResult`** (gateway details):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "6a476abc123def4567890123",
    "orderNumber": "NA-2026-00042",
    "status": "confirmed",
    "paymentStatus": "COMPLETED",
    "customer": {
      "name": "Priya Sharma",
      "contactNumber": "+91 98765 43210",
      "alternateNumber": "",
      "address": "42, Temple Road, Jayanagar 4th Block",
      "landmark": "Near Nimma Ashwini Store",
      "pincode": "560041",
      "city": "Bengaluru",
      "state": "Karnataka",
      "country": "India"
    },
    "items": [
      {
        "productId": "6a475c66b203bc97e100aaa1",
        "slug": "herbal-hair-oil",
        "name": "Herbal Hair Oil",
        "variantId": "250ml",
        "variantLabel": "250 ml",
        "quantity": 1,
        "unitPrice": 750,
        "lineTotal": 750
      }
    ],
    "subtotal": 750,
    "currency": "INR",
    "orderType": "domestic",
    "paymentResult": {
      "status": "COMPLETED",
      "paymentDate": "2026-07-03T10:18:00.000Z",
      "phonepeResponse": {}
    },
    "createdAt": "2026-07-03T10:15:00.000Z",
    "updatedAt": "2026-07-03T10:20:00.000Z"
  }
}
```

### Error responses

| HTTP | When |
|------|------|
| `400` | Invalid order id |
| `401` | Unauthorized |
| `403` | Not admin |
| `404` | Order not found |

---

## 3. Update order status

### `PUT /api/admin/orders/{id}/status`

Admin can update order status from the Orders page.

### Allowed status values

```text
pending | completed | cancelled
```

### Request body

```json
{
  "status": "cancelled"
}
```

### Success response — `200`

Return the updated order object in the same shape as `GET /api/admin/orders/{id}` so frontend can refresh the row and drawer immediately.

```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "6a476abc123def4567890123",
    "orderNumber": "NA-2026-00042",
    "status": "cancelled",
    "paymentStatus": "COMPLETED",
    "customer": {
      "name": "Priya Sharma",
      "contactNumber": "+91 98765 43210"
    },
    "subtotal": 750,
    "currency": "INR",
    "createdAt": "2026-07-03T10:15:00.000Z",
    "updatedAt": "2026-08-04T08:30:00.000Z"
  }
}
```

### Revenue rule (critical)

If an order is marked `cancelled`, it must be excluded from all revenue and sales aggregations, including:

1. Admin Insights revenue charts
2. Total sales cards
3. Product analysis revenue
4. Any dashboard / reporting totals derived from orders

Recommended rule:

- only count orders with `status = completed` in revenue
- do **not** count `pending`
- do **not** count `cancelled`

### Frontend confirmation behaviour

When admin changes a status to `cancelled`, frontend shows an extra confirmation dialog before calling this endpoint.

### Validation / error responses

| HTTP | When |
|------|------|
| `400` | Invalid order id or invalid status |
| `401` | Unauthorized |
| `403` | Not admin |
| `404` | Order not found |
| `409` | Optional: transition not allowed |

Example invalid status:

```json
{
  "success": false,
  "message": "Invalid order status"
}
```

```json
{
  "success": false,
  "message": "Order not found"
}
```

---

## Frontend usage examples

### Fetch order list (React)

```javascript
async function fetchOrders({ page = 1, limit = 20, status, paymentStatus, search } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  if (paymentStatus) params.set('paymentStatus', paymentStatus);
  if (search) params.set('search', search);

  const res = await fetch(`${API_BASE_URL}/api/admin/orders?${params}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load orders');
  }

  return json.data; // { items, pagination }
}
```

### Fetch order detail

```javascript
async function fetchOrderById(orderId) {
  const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load order');
  }

  return json.data;
}
```

---

## Suggested admin UI

### Orders list page

- Table columns: `orderNumber`, customer name, phone, `subtotal`, `status`, `paymentStatus`, `createdAt`
- Filters: status dropdown, payment status dropdown, search box
- Pagination using `data.pagination`
- Row click → order detail page

### Order detail page

- Customer shipping block
- Line items table
- Totals (`subtotal`, `currency`)
- Status badges (`status`, `paymentStatus`)
- Optional: show `paymentResult.paymentDate`

### Badge colors (suggested)

| Field | Value | UI hint |
|-------|-------|---------|
| `status` | `pending` | Warning / yellow |
| `status` | `confirmed` | Success / green |
| `status` | `shipped` | Info / blue |
| `status` | `delivered` | Success |
| `status` | `cancelled` | Danger / red |
| `paymentStatus` | `initiated` | Neutral |
| `paymentStatus` | `COMPLETED` | Green |
| `paymentStatus` | `FAILED` | Red |

---

## Checklist

- [ ] Login as admin and store JWT
- [ ] Call `GET /api/admin/orders` with `Authorization` header
- [ ] Show paginated table from `data.items`
- [ ] Wire filters: `status`, `paymentStatus`, `search`
- [ ] On row click, call `GET /api/admin/orders/{id}`
- [ ] Show full customer + items + payment info on detail page
- [ ] Handle `401` by redirecting to admin login

---

## Notes

1. There is **no public** “my orders” API yet — these are admin-only.
2. `paymentStatus` values are case-sensitive (`COMPLETED` / `FAILED` uppercase; `initiated` lowercase).
3. List does **not** include `paymentResult`; detail does.
4. Updating order status (shipped / delivered) is **not** included yet — ask backend if needed.
