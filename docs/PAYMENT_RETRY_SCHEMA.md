# Payment Retry — Backend Contract

**Audience:** Backend team  
**Status:** Frontend ready — endpoint required for “Try Again” without re-entering address  
**Auth:** None (public; same trust model as place-order + confirmation)  
**Related:** [FRONTEND_PAYMENT_INTEGRATION.md](./FRONTEND_PAYMENT_INTEGRATION.md), [PAYMENT_CONFIRMATION_SCHEMA.md](./PAYMENT_CONFIRMATION_SCHEMA.md), [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md)

---

## Problem

When PhonePe payment fails or is cancelled, the user lands on:

```text
/payment-failure?merchantOrderId={orderId}
```

**Try Again** must restart payment for the **same order** (same customer, items, coupon, totals) and open a new PhonePe `checkoutPageUrl`.

It must **not** send the user back to `/checkout` to create a second order (duplicate orders + double stock reservation).

Stock is already reserved on the original `POST /api/orders`. Retry must **not** decrement stock again.

---

## Endpoint

| Item | Value |
|------|--------|
| Method | `POST` |
| Path | `/api/orders/retry-payment` |
| Auth | **None** |
| CORS | Same as `POST /api/orders` |

Frontend base: `{API_URL}/orders/retry-payment`  
(API_URL already includes `/api/`)

---

## Request

```json
{
  "merchantOrderId": "6a87fdafa68e1c84cd171d05"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `merchantOrderId` | string | Yes | Order MongoDB `_id` (same id used in PhonePe redirects) |

Aliases (optional, if you want to be liberal): `orderId`, `id` — frontend sends `merchantOrderId` only.

---

## Success response — `200 OK`

```json
{
  "success": true,
  "message": "Payment restarted",
  "data": {
    "id": "6a87fdafa68e1c84cd171d05",
    "orderNumber": "NA-2026-91685",
    "checkoutPageUrl": "https://mercury-uat.phonepe.com/transact/..."
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Same order id |
| `orderNumber` | Yes | Existing order number (unchanged) |
| `checkoutPageUrl` | Yes | **New** PhonePe hosted checkout URL |

Frontend does:

```javascript
window.location.assign(data.checkoutPageUrl);
```

---

## Error responses

| Status | When | Example `message` |
|--------|------|-------------------|
| `400` | Missing / empty `merchantOrderId` | `merchantOrderId is required` |
| `404` | Order not found | `Order not found` |
| `409` | Payment already `COMPLETED` / order already confirmed | `Payment already completed for this order` |
| `409` | Order cancelled / not eligible for retry | `This order cannot be paid again` |
| `409` | Optional stock re-check fails | `Insufficient stock for …` |
| `502` | PhonePe session creation failed | `Failed to initiate payment` |

Example:

```json
{
  "success": false,
  "message": "Payment already completed for this order"
}
```

---

## Backend rules (required)

1. Load order by `merchantOrderId` (= order `id`).
2. Allow retry only when `paymentStatus` is **not** `COMPLETED` (allow `FAILED`, `initiated`, and similar unpaid states) and order is not in a terminal cancelled/paid-confirmed state.
3. **Do not** create a new order document.
4. **Do not** change line items, customer, coupon, or `totalAmount` (use existing payable amount, including any `discountAmount`).
5. **Do not** decrement (or increment) stock again for a normal retry.
6. Create a **new PhonePe payment session** for `order.totalAmount` (and currency).
7. Persist whatever PhonePe merchant/transaction refs you need for the new session (overwrite or append history — your choice; check-status must still resolve this `merchantOrderId`).
8. Keep redirects identical to the original flow:
   - Success → `{FRONTEND_URL}/payment-success?merchantOrderId={orderId}`
   - Failure → `{FRONTEND_URL}/payment-failure?merchantOrderId={orderId}`
9. Set/keep `paymentStatus` to `initiated` (or equivalent) when the new session starts.

---

## Pseudocode

```javascript
async function retryPayment({ merchantOrderId }) {
  const id = String(merchantOrderId || "").trim();
  if (!id) return badRequest("merchantOrderId is required");

  const order = await Order.findById(id);
  if (!order) return notFound("Order not found");

  if (order.paymentStatus === "COMPLETED" || order.status === "confirmed") {
    return conflict("Payment already completed for this order");
  }

  if (order.status === "cancelled") {
    return conflict("This order cannot be paid again");
  }

  // Optional: soft stock check without mutating qty again
  // await assertStockStillAvailable(order.items);

  const checkoutPageUrl = await phonePe.createPayment({
    merchantOrderId: String(order._id),
    amount: order.totalAmount,
    currency: order.currency || "INR",
  });

  if (!checkoutPageUrl) {
    return badGateway("Failed to initiate payment");
  }

  order.paymentStatus = "initiated";
  await order.save();

  return {
    success: true,
    message: "Payment restarted",
    data: {
      id: String(order._id),
      orderNumber: order.orderNumber,
      checkoutPageUrl,
    },
  };
}
```

---

## Frontend behaviour

| Situation | UI |
|-----------|-----|
| `merchantOrderId` present | **Try Again** → `POST /api/orders/retry-payment` → redirect to PhonePe |
| No `merchantOrderId` | Link to `/checkout` (cannot retry same order) |
| Retry API error | Show `message`; offer **Back to checkout** + WhatsApp |

Until this route exists, Try Again will show a network / not-found error (then user can use checkout fallback).

---

## Checklist for backend

- [ ] Register `POST /api/orders/retry-payment` (public)
- [ ] Return fresh `checkoutPageUrl` for the **same** order id
- [ ] Block retry when already paid (`409`)
- [ ] Do not double-reserve stock
- [ ] Same PhonePe redirect URLs as initial payment
- [ ] CORS works from storefront origin
- [ ] Smoke test: fail payment → Try Again → PhonePe opens → pay → same `orderNumber` on success page
