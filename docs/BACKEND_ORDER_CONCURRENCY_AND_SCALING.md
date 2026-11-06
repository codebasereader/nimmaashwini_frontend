# Backend — Concurrent Orders & Scaling (1,000–3,000 orders/day)

**Audience:** Backend team
**Status:** Required before the site is taken out of testing mode
**Scope:** `POST /api/orders`, payment callbacks / status checks / retry, stock, order numbers, notifications, admin reads
**Related:** [ORDER_CHECKOUT_SCHEMA.md](./ORDER_CHECKOUT_SCHEMA.md), [PAYMENT_CONFIRMATION_SCHEMA.md](./PAYMENT_CONFIRMATION_SCHEMA.md), [PAYMENT_RETRY_SCHEMA.md](./PAYMENT_RETRY_SCHEMA.md), [INVOICE_NUMBER_SCHEMA.md](./INVOICE_NUMBER_SCHEMA.md), [CUSTOMER_DATA_SCHEMA.md](./CUSTOMER_DATA_SCHEMA.md), [WHATSAPP_MARKETING_CAMPAIGNS_SCHEMA.md](./WHATSAPP_MARKETING_CAMPAIGNS_SCHEMA.md)

Stack assumed from the existing docs: Node.js on **AWS API Gateway + Lambda (serverless)**, **MongoDB Atlas** (mongoose), **PhonePe** Standard Checkout. If any of this differs, adapt the mechanisms but keep the guarantees in §1.

---

## 0. The real problem is correctness, not raw speed

1,000–3,000 orders/day is a **small** load for this stack:

| Measure | Value |
|---------|-------|
| Average rate | 3,000 ÷ 86,400 s ≈ **0.035 orders/second** |
| Realistic busy hour (festival, ad, WhatsApp campaign) | up to ~30–40% of a day's orders in one hour ≈ **0.3 orders/second** |
| **Design burst** (design to this) | **10 orders/second for 5 minutes**, 50 concurrent checkouts |
| Checkout requests (incl. retries, failed payments, bots) | assume **3–5×** the order count |

Throughput will not be the problem. What breaks at this scale is **simultaneity**: two customers buying the last bottle, a customer double-clicking Pay, and PhonePe's callback, the browser's status poll and a retry all updating the same order at the same moment. Every rule below exists to make those races safe.

---

## 1. Guarantees the system must make

| # | Guarantee |
|---|-----------|
| G1 | **No overselling.** Stock never goes below 0; two buyers can never both get the last unit. |
| G2 | **No duplicate orders** from double-clicks, network retries or refreshes. |
| G3 | **Unique order/invoice numbers**, no gaps caused by failed creates, no duplicates under any concurrency. |
| G4 | **Exactly-once side effects per paid order:** one stock commit, one customer-stats update, one WhatsApp confirmation, one invoice allocation. |
| G5 | **Payment state only moves forward** and only the first finaliser wins (`pending → paid`, never `paid → failed`). |
| G6 | **Abandoned checkouts release their stock** automatically, without ever releasing stock of an order that was actually paid. |
| G7 | **Admin reads/exports/reports cannot slow down checkout.** |
| G8 | **A PhonePe or notification outage degrades gracefully** (clear error / retry), never leaves orphaned stock or half-created orders. |

---

## 2. Order creation — `POST /api/orders`

### 2.1 Order of operations

Do **not** hold a database transaction open while calling PhonePe.

```text
1. Validate input and re-fetch products (price, active, maxQuantityPerOrder)      [no locks]
2. Idempotency check (§2.2)                                                        [one indexed read]
3. START short DB transaction
     a. Atomically reserve stock for every line (§3)
     b. Allocate order number (§4)
     c. Insert order  { paymentStatus: "initiated", stockState: "reserved",
                        reservedUntil: now + 30 min, idempotencyKey }
     d. Upsert customer by phone (atomic, per CUSTOMER_DATA_SCHEMA)
   COMMIT                                                                          [< ~100 ms]
4. Call PhonePe to create the payment (timeout 8 s, §6)                            [no locks]
5a. Success → save checkoutPageUrl on the order, return 201
5b. Failure → release the reservation (§3.3), mark order paymentStatus "FAILED",
              return a clear error (503 if PhonePe unreachable)
```

If the Lambda dies between 3 and 5, the order stays `initiated` with `reservedUntil` set, and the expiry job (§5) cleans it up. Nothing is lost permanently.

### 2.2 Idempotency (prevents duplicate orders)

- The frontend sends a header **`Idempotency-Key: <uuid v4>`** generated once per checkout attempt (a new key only when the cart or form changes).
- Store it on the order with a **unique index** `{ idempotencyKey: 1 }` (sparse).
- If the key already exists: return the **same response as the first call** (same `orderId`, same `checkoutPageUrl`) with `200`. Do not create anything.
- If two identical requests arrive at the same instant, the second one hits the unique-index error → catch it, load the existing order, return it.
- Keep keys for at least 24 hours.

### 2.3 Rate limiting and abuse

| Layer | Rule |
|-------|------|
| API Gateway stage throttle | e.g. 50 req/s steady, 100 burst (tune after load test) |
| `POST /api/orders` per IP | e.g. 10 per 5 minutes (WAF or in-app) → `429` with `Retry-After` |
| Per phone number | max 5 unpaid `initiated` orders open at once (stops stock hoarding by bots) |

---

## 3. Stock — atomic reserve, commit, release

### 3.1 Reserve (at order creation)

One conditional update **per line**, inside the transaction. The condition and the decrement happen in a single atomic operation; there must be **no** "read stock, then check, then write".

```js
const result = await Product.updateOne(
  {
    _id: productId,
    isActive: true,
    quantities: { $elemMatch: { value: variantId, stock: { $gte: qty } } },
  },
  { $inc: { "quantities.$.stock": -qty, stock: -qty } },
  { session },
);

if (result.modifiedCount !== 1) {
  throw new InsufficientStockError({ productId, variantId, requested: qty });
}
```

If any line fails, **abort the whole transaction** (all lines roll back) and return:

```json
{
  "success": false,
  "message": "Some items are no longer available in the requested quantity",
  "errors": [{ "items": "Herbal Hair Oil (200 ml): only 2 left" }]
}
```

with HTTP **`409`**. Include the remaining quantity so the storefront can adjust the cart.

> Multi-document transactions need an Atlas **replica set** (all dedicated Atlas tiers are). If transactions are unavailable, do the per-line atomic updates sequentially and **compensate** (re-increment) on any later failure — but transactions are strongly preferred.

### 3.2 State on the order

`stockState`: `reserved` → `committed` (payment completed) or `released` (failed / expired / cancelled). Only transitions listed here are allowed; each is a conditional update, using the pattern in §3.3 and §5.3.

Stock is treated as already decremented while `reserved`; "commit" just changes the flag. It does **not** decrement again.

### 3.3 Release

Release = re-increment the same quantities, **only if** the order moves `reserved → released` in the same atomic step:

```js
const order = await Order.findOneAndUpdate(
  { _id: orderId, stockState: "reserved", paymentStatus: { $ne: "COMPLETED" } },
  { $set: { stockState: "released", releasedAt: new Date() } },
  { new: true },
);
if (!order) return; // already released, committed or paid — do nothing
await restoreStock(order.items); // $inc +qty per line
```

This makes release safe to call from several places (payment failed, user cancelled, expiry job) without double-restoring.

### 3.4 Interaction with payment retry

[PAYMENT_RETRY_SCHEMA.md](./PAYMENT_RETRY_SCHEMA.md) says retry must not decrement stock again. Refine that rule:

- If `stockState = reserved` → retry does **not** touch stock.
- If `stockState = released` (the reservation expired or the payment failed and was released) → retry must **re-reserve** (§3.1). If stock is no longer available, return `409` and the order cannot be retried.

---

## 4. Order numbers

Per [INVOICE_NUMBER_SCHEMA.md](./INVOICE_NUMBER_SCHEMA.md): allocate from the single settings document with one atomic `findOneAndUpdate` + `$inc`, **inside the order-creation transaction**, so an aborted transaction does not burn a number.

- A single document increment is serialised by MongoDB; at 10 orders/second it is not a bottleneck.
- Unique index on `orders.orderNumber`. On a duplicate-key error (should never occur), retry the whole allocation once, then fail cleanly.
- The month/year prefix (`MON-YY-`) must be computed **at allocation time in IST**, not cached in the Lambda, so a long-lived container does not issue last month's prefix after midnight on the 1st.

---

## 5. Payment finalisation — one function, exactly once

### 5.1 The race

Today several things can update the same order at the same time:

1. PhonePe server callback / webhook
2. `GET /api/orders/check-status` called by the browser on `/payment-success`
3. Payment retry
4. The expiry job (§5.5)

### 5.2 Rule

All four must go through **one shared function** `finalizePayment(orderId, phonePeStatus)`.

### 5.3 Atomic winner pattern

```js
// Only ONE caller can flip pending → COMPLETED
const won = await Order.findOneAndUpdate(
  { _id: orderId, paymentStatus: { $ne: "COMPLETED" } },
  {
    $set: {
      paymentStatus: "COMPLETED",
      status: "confirmed",
      stockState: "committed",
      paidAt: new Date(),
      paymentResult: phonePeResult,
    },
  },
  { new: true },
);

if (!won) return await Order.findById(orderId); // somebody else finalised; just return current state

// Exactly-once side effects, only for the winner:
await enqueueOnce(orderId, "order_confirmation_whatsapp");
await enqueueOnce(orderId, "customer_stats_update");
```

For failures: `FAILED` may only be set when the order is **not** `COMPLETED` (condition in the filter). A late "failed" webhook must never overwrite a completed payment (G5).

### 5.4 Webhook / callback handling

- Verify the PhonePe signature / checksum first; reject with `401` otherwise.
- **Respond fast** (< 2 s). Do the minimum (update order via §5.3), push the rest to a queue.
- Treat every webhook as possibly **duplicated and out of order**. Deduplicate on PhonePe's transaction/event id (store processed ids with a unique index, TTL 30 days).
- `GET /api/orders/check-status` must be **safe to call repeatedly and concurrently**. It may ask PhonePe for status, but the DB write still goes through §5.3.

### 5.5 Expiry job (abandoned checkouts)

A scheduled job (EventBridge, every 5 minutes):

1. Find orders with `paymentStatus` in (`initiated`, `PENDING`) and `reservedUntil < now`.
2. For each, **ask PhonePe for the order's current status first.** If paid → run `finalizePayment` (do **not** release). If failed or not found → release stock (§3.3), set `paymentStatus: "FAILED"` or `"EXPIRED"`.
3. Process in small batches (e.g. 50), idempotent, safe to run twice concurrently.

### 5.6 Exactly-once notifications

Use a `notifications` collection (or SQS FIFO with deduplication id) with a **unique index on `(orderId, type)`**. The order-confirmation WhatsApp message is queued only if that insert succeeds. A retry or duplicate webhook can then never send a second message (the customer must get exactly one).

---

## 6. Lambda + MongoDB + PhonePe settings

### 6.1 Database connections (the usual serverless failure)

- Create the MongoDB client **once per Lambda container**, outside the handler, and reuse it. Never connect per request.
- Cap the pool: `maxPoolSize` ≈ 5–10 per container, `minPoolSize` 0–1, `maxIdleTimeMS` ≈ 60,000, `serverSelectionTimeoutMS` ≈ 5,000.
- **Connection budget:** `max concurrent Lambdas × maxPoolSize` must stay below ~50% of the Atlas tier's connection limit. Enforce with **reserved concurrency** on the order functions (e.g. 20–50) so a spike cannot exhaust connections.
- Use an Atlas **dedicated tier (M10 or higher)**, not a free/shared tier, which has low connection and operation limits. Confirm the current tier before launch.

### 6.2 Timeouts

| Item | Value |
|------|-------|
| API Gateway integration timeout | 29 s (hard max) |
| Lambda timeout for `POST /orders` | 20 s |
| PhonePe HTTP timeout | 8 s, one retry only for network errors, never retry a request that may have created a payment without checking status first |
| DB transaction | < 1 s typical; abort and retry the whole transaction on `TransientTransactionError` (max 3 attempts) |

### 6.3 Cold starts

Provisioned concurrency of 1–2 on `POST /orders` and the payment callback is enough at this volume and removes cold-start delay for most customers. Keep dependency bundles small.

### 6.4 Async work

Anything not needed to return the checkout URL goes to **SQS** (with a dead-letter queue and alarms): WhatsApp confirmation, emails, customer statistics, any analytics. Consumers must be idempotent (§5.6).

---

## 7. Indexes (verify they exist)

| Collection | Index | Purpose |
|------------|-------|---------|
| `orders` | `{ orderNumber: 1 }` **unique** | no duplicate numbers |
| `orders` | `{ idempotencyKey: 1 }` **unique, sparse** | duplicate-submit protection |
| `orders` | `{ createdAt: -1 }` | admin list, default sort |
| `orders` | `{ paymentStatus: 1, createdAt: -1 }`, `{ status: 1, createdAt: -1 }` | admin filters |
| `orders` | `{ paymentStatus: 1, reservedUntil: 1 }` | expiry job |
| `orders` | `{ "customer.contactNumber": 1 }` | search, "recent buyers" audience |
| `orders` | `{ merchantOrderId: 1 }` (if separate from `_id`) | payment callbacks |
| `customers` | `{ phone: 1 }` **unique** | atomic upsert |
| `notifications` | `{ orderId: 1, type: 1 }` **unique** | exactly-once messages |
| `processedWebhooks` | `{ eventId: 1 }` **unique**, TTL 30 d | webhook dedupe |

Admin order `search` must use indexed fields or anchored prefix matches — **no unanchored regex over the whole collection**.

---

## 8. Protecting checkout from other load

| Source | Rule |
|--------|------|
| Admin Excel export (`/admin/orders/export`, GSTR-1) | Cap date range (e.g. ≤ 12 months) and rows (e.g. ≤ 50,000); stream the output; set `maxTimeMS` (e.g. 30 s); use `readPreference: secondaryPreferred`. |
| Insights / GSTR-1 aggregations | Read from a secondary; cache results 60 s per filter combination. |
| Admin list endpoints | `limit ≤ 100`, always paginated. |
| `GET /api/products` (storefront + sitemap build) | Cache 30–60 s (API Gateway cache, CloudFront or in-memory). The displayed stock may be a few seconds stale; the order-time check in §3 is authoritative. |
| WhatsApp marketing campaigns | A campaign can send traffic to the site. Keep batch sizes as designed in the marketing doc so a campaign does not create an unexpected checkout spike. |

---

## 9. Error contract (frontend depends on this)

| HTTP | When | Body hint |
|------|------|-----------|
| `201` | Order created, `checkoutPageUrl` returned | — |
| `200` | Idempotent replay of an earlier successful create | same body as first response |
| `400` | Validation failure | `errors` map |
| `409` | Insufficient stock, or order not retryable | which items and how many are left |
| `429` | Rate limited | `Retry-After` header |
| `503` | PhonePe unreachable / temporarily unavailable | `Retry-After`; stock already released; safe to retry with the **same** idempotency key |

Never return `500` with a half-created order. Every failure path either completes or compensates (§2.1, §3.3).

---

## 10. Monitoring and alarms

Structured JSON logs on every order step with `orderId`, `orderNumber`, `idempotencyKey`, `requestId`.

| Alarm | Threshold (starting point) |
|-------|---------------------------|
| API 5xx rate | > 1% for 5 min |
| `POST /orders` p95 latency (excluding PhonePe) | > 1 s for 5 min |
| Lambda throttles on order functions | any, sustained 5 min |
| MongoDB connections | > 60% of tier limit |
| SQS dead-letter queue depth | > 0 |
| Orders stuck `initiated` for > 45 min | > 5 |
| Negative stock detected (`stock < 0` on any product/variant) | any — page someone |
| Duplicate webhook rate / signature failures | spike |

**Daily reconciliation job:** compare PhonePe settled/paid orders with `paymentStatus = COMPLETED` in the DB, and recompute expected stock (`initial + restocks − committed − currently reserved`) per variant. Report any mismatch to the owner.

Enable Atlas **point-in-time recovery** backups.

---

## 11. Load and race tests (acceptance criteria)

Run in staging with PhonePe in sandbox mode, using k6 or Artillery. **All must pass before go-live.**

| # | Scenario | Pass condition |
|---|----------|----------------|
| T1 | 50 concurrent checkouts for a variant with stock 10 | **Exactly 10** orders succeed, 40 get `409`, final stock is 0, never negative |
| T2 | Same request with the same `Idempotency-Key` sent 10× in parallel | Exactly **1** order, all 10 responses return that order |
| T3 | Payment callback, `check-status` (×5) and retry fire together for one order | Order finalised once; **one** confirmation message queued; stock committed once |
| T4 | Late `FAILED` webhook after `COMPLETED` | Order stays `COMPLETED` |
| T5 | Abandoned checkout, no payment | Stock restored after `reservedUntil` by the expiry job; a paid-but-late order is **not** released |
| T6 | Sustained 3,000 orders over 8 hours, plus a 10 orders/s burst for 5 minutes | p95 < 1 s (excluding PhonePe), error rate < 0.5%, no duplicate order numbers |
| T7 | Admin runs a large Excel export and the insights page during the burst | Checkout p95 unchanged |
| T8 | PhonePe sandbox timeout injected | `503`, stock released, retry with the same key works |
| T9 | Kill the Lambda between order insert and PhonePe call | Expiry job releases the stock; no order left reserved forever |

---

## 12. Frontend changes (to be done after the backend supports this)

Small, and I will make them once §2.2 and §9 exist:

- Generate one `Idempotency-Key` per checkout attempt and send it on `POST /orders`; keep it if the user retries after a `503` or network error.
- Show friendly messages for `409` (items changed — refresh cart), `429` (try again shortly) and `503`.
- Keep the Pay button disabled while submitting (already done) and prevent a second submit on Enter.
- Payment-success page: poll `check-status` with backoff instead of tight loops.

---

## 13. Checklist for backend

- [ ] Atomic stock reserve with conditional update inside a transaction (§3.1)
- [ ] `stockState` (`reserved` / `committed` / `released`) and `reservedUntil` on orders
- [ ] Idempotent release (§3.3) and retry re-reserve rule (§3.4)
- [ ] `Idempotency-Key` support with unique index and replay response (§2.2)
- [ ] Order number allocated inside the creation transaction; month prefix computed in IST at allocation time (§4)
- [ ] Single `finalizePayment` used by webhook, check-status, retry and expiry job (§5)
- [ ] Conditional-update "winner" pattern; `FAILED` can never overwrite `COMPLETED`
- [ ] Webhook signature check, fast response, dedupe by event id
- [ ] Expiry job that checks PhonePe before releasing (§5.5)
- [ ] `notifications` unique `(orderId, type)` so the WhatsApp confirmation is sent exactly once
- [ ] Shared MongoDB client per container, pool caps, reserved concurrency, dedicated Atlas tier (§6)
- [ ] Timeouts and a single safe retry for PhonePe calls (§6.2)
- [ ] SQS + DLQ for async side effects
- [ ] All indexes in §7 created
- [ ] Export/report limits, secondary reads and caching (§8)
- [ ] Rate limits at API Gateway / WAF and per phone (§2.3)
- [ ] Error contract in §9 implemented
- [ ] Alarms and daily reconciliation job (§10)
- [ ] Load/race tests T1–T9 passing in staging (§11)
