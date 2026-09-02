# Available Coupons — Public API Schema

**Audience:** Backend team  
**Status:** Frontend ready — endpoint **not found** until this is implemented  
**Auth:** None (public checkout)  
**Related:** [COUPON_SCHEMA.md](./COUPON_SCHEMA.md), [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md), [CART_SCHEMA.md](./CART_SCHEMA.md)

---

## Why this exists

On storefront checkout, customers click **View available**. The frontend calls:

```http
POST /api/coupons/available
Content-Type: application/json
```

If this route is missing, the UI shows **Failed to fetch** / **API not found**.

This endpoint must return coupons that are **valid right now** and give a **positive discount** for the submitted cart.

---

## Endpoint

| Item | Value |
|------|--------|
| Method | `POST` |
| Path | `/api/coupons/available` |
| Auth | **None** |
| CORS | Allow storefront origin (same as `POST /api/orders`) |

> Full API base used by frontend:  
> `https://<api-host>/api/coupons/available`

---

## Request body

```json
{
  "items": [
    {
      "productId": "6a475c66b203bc97e100aaa1",
      "quantity": 2,
      "unitPrice": 750
    },
    {
      "productId": "6a47552f736b4338f396dd25",
      "quantity": 1,
      "unitPrice": 450
    }
  ]
}
```

### Field reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | array | Yes | Current cart lines (may be empty → return empty list) |
| `items[].productId` | string | Yes | Catalog product MongoDB `_id` |
| `items[].quantity` | number | Yes | Integer ≥ 1 |
| `items[].unitPrice` | number | Yes | GST-inclusive unit price (INR) |

---

## Success response — `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "code": "ASHW7K2M9P",
        "discountType": "percent",
        "discountValue": 15,
        "discountAmount": 225,
        "appliesTo": "products",
        "endsAt": "2026-09-20T23:59:59.999Z",
        "message": "15% off eligible products"
      },
      {
        "code": "FLAT100",
        "discountType": "amount",
        "discountValue": 100,
        "discountAmount": 100,
        "appliesTo": "all",
        "endsAt": "2026-08-31T23:59:59.999Z",
        "message": "₹100 off eligible products"
      }
    ]
  }
}
```

### Response item fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Uppercase coupon code |
| `discountType` | `"amount"` \| `"percent"` | Yes | Same as coupon entity |
| `discountValue` | number | Yes | Configured amount or percent |
| `discountAmount` | number | Yes | **Computed for this cart** (INR, 2 decimals) |
| `appliesTo` | `"all"` \| `"products"` | Yes | Scope |
| `endsAt` | ISO datetime | Yes | Expiry for UI (“Valid till …”) |
| `message` | string | Yes | Short human label for the modal |

### Empty list (valid)

When nothing applies:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": []
  }
}
```

Frontend shows: *“No coupons available for your cart right now.”*

---

## Error responses

| Status | When |
|--------|------|
| `400` | Body invalid (e.g. `items` not an array) |
| `404` | Route not registered (**current frontend error**) |
| `500` | Unexpected server error |

Example:

```json
{
  "success": false,
  "message": "items must be an array"
}
```

---

## Algorithm (must match validate + order)

For each coupon in DB that passes filters below, compute discount for the request `items`, then include only if `discountAmount > 0`.

### Include coupon only if all are true

1. `isActive === true`
2. `now >= startsAt` and `now <= endsAt`
3. `maxUses == null` **or** `usedCount < maxUses`
4. Eligible cart subtotal > 0 (see math below)
5. Computed `discountAmount > 0`

### Discount math (same as validate)

1. **Eligible subtotal**  
   - If `appliesTo === "all"` → sum of `quantity × unitPrice` for **all** lines  
   - If `appliesTo === "products"` → sum only for lines whose `productId` is in `productIds`
2. If eligible subtotal is `0` → skip coupon  
3. If `discountType === "percent"` →  
   `discountAmount = round2(eligibleSubtotal × min(discountValue, 100) / 100)`  
4. If `discountType === "amount"` →  
   `discountAmount = round2(min(discountValue, eligibleSubtotal))`  
5. Cap: `discountAmount ≤` full cart subtotal (sum of all lines)

```text
round2(x) = Math.round(x * 100) / 100
```

### Sort (recommended)

Return `items` sorted by **`discountAmount` descending** (best savings first).

### `message` examples

| Type | Example |
|------|---------|
| percent | `"15% off eligible products"` |
| amount | `"₹100 off eligible products"` |

---

## Pseudocode

```javascript
async function availableCoupons({ items }) {
  const cartItems = Array.isArray(items) ? items : [];
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  });

  const result = [];

  for (const coupon of coupons) {
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) continue;

    const eligibleSubtotal = calcEligibleSubtotal(cartItems, coupon);
    if (eligibleSubtotal <= 0) continue;

    const orderSubtotal = cartItems.reduce(
      (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
      0,
    );

    const discountAmount = calcDiscountAmount(
      eligibleSubtotal,
      coupon.discountType,
      coupon.discountValue,
      orderSubtotal,
    );

    if (discountAmount <= 0) continue;

    result.push({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      appliesTo: coupon.appliesTo,
      endsAt: coupon.endsAt,
      message: formatMessage(coupon),
    });
  }

  result.sort((a, b) => b.discountAmount - a.discountAmount);

  return { success: true, message: "Success", data: { items: result } };
}
```

---

## Frontend contract notes

| Behavior | Detail |
|----------|--------|
| When called | Modal open on checkout (**View available**) |
| After select | Frontend still calls `POST /api/coupons/validate` with the chosen `code` before attaching to the order |
| Order place | `POST /api/orders` may include `couponCode`; backend **must re-validate** (never trust client `discountAmount`) |

Do **not** require admin JWT on this route.

---

## Checklist for backend

- [ ] Register `POST /api/coupons/available` (public, no auth)
- [ ] Accept `{ items: [{ productId, quantity, unitPrice }] }`
- [ ] Return `{ success, data: { items: [...] } }` (empty array OK)
- [ ] Filter: active + in date range + under max uses + positive discount for cart
- [ ] Use same discount math as `POST /api/coupons/validate`
- [ ] Sort by highest `discountAmount` first
- [ ] CORS works from the storefront origin
- [ ] Also implement `POST /api/coupons/validate` if not done yet (required to apply a selected code)

---

## Related admin APIs

Coupon CRUD (JWT) is documented in [COUPON_SCHEMA.md](./COUPON_SCHEMA.md):

- `GET/POST /api/admin/coupons`
- `GET/PUT/DELETE /api/admin/coupons/{id}`
