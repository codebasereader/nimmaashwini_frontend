# WhatsApp Order Confirmation (MSG91) — Backend Spec

**Audience:** Backend team
**Scope:** ONE WhatsApp message per successful order. Nothing else. No marketing, no other notifications.
**Provider:** MSG91 WhatsApp (Meta Cloud API underneath)
**Related:** [PAYMENT_CONFIRMATION_SCHEMA.md](./PAYMENT_CONFIRMATION_SCHEMA.md), [BACKEND_ORDER_CONCURRENCY_AND_SCALING.md](./BACKEND_ORDER_CONCURRENCY_AND_SCALING.md) (§5.5 exactly-once notifications)

---

## 1. Rules

1. Send **exactly one** message per order, **only** after payment is confirmed (`paymentStatus = COMPLETED`).
2. Never send for: failed / pending / cancelled payments, international orders (they go through WhatsApp manually), or any other event.
3. **Manual orders** entered by admin (`manual_entry = true`): do **not** send automatically (the team already spoke to the customer). Keep a config flag `WHATSAPP_CONFIRM_MANUAL_ORDERS=false`.
4. A WhatsApp failure must **never** fail, delay or roll back the order or the payment redirect. Send asynchronously.
5. Duplicates are impossible by design (see §3).

---

## 2. Trigger point

Fire from the **single payment-finalise function** (the one place that moves an order to `COMPLETED`, shared by the PhonePe callback, `GET /api/orders/check-status` and the retry flow):

```
finalizePayment(orderId, COMPLETED)
  └─ if this call is the one that flipped the order to COMPLETED (modifiedCount === 1)
        └─ enqueueOrderConfirmation(orderId)
```

Only the call that actually changes the state enqueues; later callbacks/polls see the order already `COMPLETED` and do nothing.

---

## 3. Exactly-once guard

Collection `notifications`, **unique index on `{ orderId: 1, type: 1 }`**.

```js
// type is always "ORDER_CONFIRMATION"
try {
  await notifications.insertOne({
    orderId, type: "ORDER_CONFIRMATION",
    status: "QUEUED", attempts: 0, createdAt: new Date(),
  });
} catch (e) {
  if (e.code === 11000) return;   // already queued/sent — do nothing
  throw e;
}
// then push to the queue (SQS) / invoke the sender asynchronously
```

Statuses: `QUEUED → SENT | FAILED`. Store `providerMessageId`, `lastError`, `sentAt`.

---

## 4. Message (approved text)

Template name: **`order_confirmation_with_delivery`** — language `en` (confirm exact name/language with the approved MSG91 template).
Category: **UTILITY** (it is a transactional confirmation of a purchase; do not add promotional wording).

Body:

```
Hello {{1}}, your order is confirmed! 🎉

Thank you for shopping with Ashwini Natural Products. Here is your order summary:

Order No: {{2}}
Items: {{3}}
Amount Paid: {{4}}
Delivery Address: {{5}}
Expected Delivery: {{6}}

Our team is carefully packing your products. Please keep your phone reachable for the delivery partner's call.

For any help, contact us on whatsapp : +91 6363250586.
```

Footer: `Nimma Ashwini · Traditional Natural Care` (optional — keep whatever was submitted for approval)
Button: URL button "🌐 Visit website" → `https://nimmaashwini.com`

> The template text submitted to MSG91/Meta must match the text above **exactly**. Any later wording change needs a new template and a new approval.

### Variables

| Var | Source | Example | Rules |
|-----|--------|---------|-------|
| `{{1}}` | `customer.name` | `Priya` | First name or full name; trim; max ~30 chars |
| `{{2}}` | `orderNumber` | `OCT-26-9176` | |
| `{{3}}` | `items[]` | `Herbal Hair Oil (200 ml) × 2, Ragi Malt × 1` | `name (variantLabel) × quantity`, joined by `, `. If longer than ~200 chars: first 3 items + `+ N more` |
| `{{4}}` | `totalAmount` | `₹1,347` | `en-IN` formatting, `₹` prefix |
| `{{5}}` | `customer` address | `42, Temple Road, Jayanagar, Bengaluru - 560041` | `address, landmark?, city, state - pincode` on **one line** |
| `{{6}}` | config | `5–7 working days` | Env `DELIVERY_ESTIMATE_TEXT` (client to confirm the wording) |

**Meta restrictions on variables:** no newline characters, no tab characters, and no more than 4 consecutive spaces inside any variable. Strip/replace them before sending (replace `\n` with `, `). Variables must not be empty — use a fallback (`Customer`, `—`).

---

## 5. Recipient phone number

- Source: `customer.contactNumber`.
- Normalise to `91XXXXXXXXXX` (digits only): strip spaces, `+`, `-`; drop a leading `0`; if 10 digits starting 6–9, prefix `91`. Validate `^91[6-9][0-9]{9}$`.
- Invalid number → mark notification `FAILED` with `lastError = "invalid_phone"`, do not retry, do not throw.
- Do **not** fall back to `alternateNumber` unless the client asks for it.

---

## 6. MSG91 request

Use the MSG91 WhatsApp "send template" (bulk/outbound) API with the template name, namespace, language, recipient and component values. **Exact URL, header (`authkey`) and payload shape must be taken from the MSG91 dashboard / docs for the account** — verify before coding. Shape, for orientation only:

```json
{
  "integrated_number": "<WHATSAPP_NUMBER>",
  "content_type": "template",
  "payload": {
    "messaging_product": "whatsapp",
    "type": "template",
    "template": {
      "name": "order_confirmation_with_delivery",
      "language": { "code": "en", "policy": "deterministic" },
      "namespace": "<TEMPLATE_NAMESPACE>",
      "to_and_components": [{
        "to": ["91XXXXXXXXXX"],
        "components": {
          "body_1": { "type": "text", "value": "Priya" },
          "body_2": { "type": "text", "value": "OCT-26-9176" },
          "body_3": { "type": "text", "value": "…" },
          "body_4": { "type": "text", "value": "₹1,347" },
          "body_5": { "type": "text", "value": "…" },
          "body_6": { "type": "text", "value": "5–7 working days" }
        }
      }]
    }
  }
}
```

### Environment variables

| Key | Purpose |
|-----|---------|
| `MSG91_AUTH_KEY` | API key (secret; never commit, never log) |
| `MSG91_WHATSAPP_NUMBER` | Integrated WhatsApp number |
| `MSG91_TEMPLATE_NAME` | `order_confirmation_with_delivery` |
| `MSG91_TEMPLATE_NAMESPACE` | From MSG91 |
| `MSG91_TEMPLATE_LANGUAGE` | `en` |
| `DELIVERY_ESTIMATE_TEXT` | `5–7 working days` |
| `WHATSAPP_CONFIRM_ENABLED` | Kill switch (`true`/`false`) |
| `WHATSAPP_CONFIRM_MANUAL_ORDERS` | default `false` |

---

## 7. Retries and failures

- Retry on network errors / 5xx / 429 only: up to 3 attempts, backoff 30 s → 2 min → 10 min. Then `FAILED`.
- Do **not** retry on 4xx (invalid number, template not approved, parameter mismatch) — log and mark `FAILED`.
- The retry reuses the same `notifications` row; it never inserts a second one.
- Send directly (no promotional batching, no pausing logic) — this is one message per order, at most a few thousand a day.

---

## 8. Delivery status (optional but recommended)

If MSG91 provides a delivery webhook, add `POST /api/webhooks/msg91-whatsapp` to update the `notifications` row (`DELIVERED`, `READ`, `FAILED` with reason). Verify the webhook secret/signature as MSG91 documents. This is for visibility only — never resend because of a status.

---

## 9. Admin visibility (small)

Add `whatsappConfirmation: { status, sentAt, lastError }` to the admin order detail response (`GET /api/admin/orders/:id`), so the team can see whether the customer got the message. A "Resend" action is optional; if built, it must be admin-only and logged.

---

## 10. Acceptance checklist

- [ ] Template approved in MSG91/Meta with the exact text in §4; name, namespace, language put in env.
- [ ] One message sent for a normal paid website order.
- [ ] Callback + status poll + retry all arriving for one order → still exactly one message.
- [ ] Failed / pending / cancelled payment → no message.
- [ ] International and manual orders → no message.
- [ ] Order and redirect still succeed when MSG91 is down or the number is invalid.
- [ ] Variables contain no newlines/tabs; long item lists are truncated; no empty variable.
- [ ] `WHATSAPP_CONFIRM_ENABLED=false` stops all sending without a deploy.
- [ ] Auth key is not present in logs or the repo.
