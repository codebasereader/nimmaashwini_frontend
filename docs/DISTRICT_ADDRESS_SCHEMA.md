# District field on customer / vendor addresses

**Audience:** Backend team  
**Status:** Frontend ready (Aug 2026)  
**Related:** `ORDER_CHECKOUT_SCHEMA.md`, `ADMIN_MANUAL_ORDER_SCHEMA.md`, `CUSTOMER_DATA_SCHEMA.md`, `ADMIN_PURCHASE_SCHEMA.md`

---

## Summary

Frontend now autofills and submits **city**, **district**, and **state** from Indian pincode lookup (India Post API).

Previously only `city` + `state` were sent. `city` used to be filled with the postal **District** value. Those are now separate fields.

| Field | Source (India Post) | Required on domestic orders? |
|-------|---------------------|------------------------------|
| `city` | `Block` if present, else post-office `Name`, else `District` | Yes |
| `district` | `District` | Yes |
| `state` | `State` | Yes (unchanged; still drives GST place of supply) |

---

## What backend must do

1. **Accept** optional/required `district` on order customer payloads and vendor billing addresses.
2. **Persist** `district` on order documents and customer address snapshots.
3. **Return** `district` in order detail, customer detail, and vendor APIs.
4. Keep **backward compatibility**: older records without `district` should still load (`district` may be `null` / omitted).
5. Do **not** change GST logic — place of supply still uses `customer.state` / vendor `state` only.

---

## Affected endpoints

| Flow | Method | Path | Where `district` lives |
|------|--------|------|------------------------|
| Public checkout / place order | `POST` | `/api/orders` | `customer.district` |
| Admin manual order | `POST` | `/api/admin/orders` | `customer.district` |
| Order detail / list | `GET` | `/api/admin/orders`, `/api/admin/orders/:id` | `customer.district` |
| Customer profile / snapshot | `GET` | `/api/admin/customers/:id` | `address.district` |
| Vendor create / update | `POST`/`PUT` | `/api/admin/vendors` | `billingAddress.district` |
| Vendor detail | `GET` | `/api/admin/vendors/:id` | `billingAddress.district` |

Exact paths may match your existing naming; the field placement is what matters.

---

## Request shape (orders)

Add `district` next to `city` / `state`:

```json
{
  "customer": {
    "name": "Ananya Rao",
    "contactNumber": "9876543210",
    "alternateNumber": "9800011122",
    "address": "12, 2nd Cross, RR Nagar",
    "landmark": "Near Arch",
    "pincode": "560098",
    "city": "Rajarajeshwari Nagar",
    "district": "Bengaluru",
    "state": "Karnataka",
    "country": "India"
  }
}
```

### Validation (recommended)

| Field | Domestic orders | International / optional vendors |
|-------|-----------------|----------------------------------|
| `customer.city` | required, non-empty string | as today |
| `customer.district` | **required**, non-empty string | optional / omit |
| `customer.state` | required (unchanged) | as today |
| `customer.pincode` | 6-digit Indian (unchanged) | as today |

If you prefer softer rollout: accept `district` as optional for 1 release, then make it required once admin + checkout are both live.

Frontend currently **requires** district on domestic checkout and admin manual orders.

---

## Vendor billing address

```json
{
  "billingAddress": {
    "line1": "Warehouse Road",
    "line2": "",
    "city": "Peenya",
    "district": "Bengaluru Urban",
    "state": "Karnataka",
    "pincode": "560058",
    "country": "India"
  }
}
```

`district` can stay optional for vendors if you want, but please **store and return** it when sent.

---

## Persistence / schema sketch

```js
customer: {
  // ...existing fields
  pincode: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  district: { type: String, required: false, trim: true }, // prefer required for new domestic orders
  state: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
}
```

Same for:

- Order `customer` snapshot
- Customer `address` snapshot (latest shipping)
- Vendor `billingAddress`

---

## Response shape

Echo `district` wherever you already return city/state:

```json
{
  "customer": {
    "pincode": "560098",
    "city": "Rajarajeshwari Nagar",
    "district": "Bengaluru",
    "state": "Karnataka",
    "country": "India"
  }
}
```

Admin customer detail address display expects:

```text
city, district, state, pincode
```

---

## Error responses

Prefer field-keyed errors so the checkout UI can highlight the district input:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "customer.district": "District is required"
  }
}
```

---

## Migration notes

| Existing data | Action |
|---------------|--------|
| Orders / customers without `district` | Leave as-is; API returns `null` or omits field |
| Old `city` values that were actually postal District | No automatic rewrite required |
| Search by city | Optional: also search `district` if you have address search |

No backfill is required for launch. New checkout + admin orders will populate `district` going forward.

---

## Out of scope / unchanged

- GST CGST/SGST vs IGST still based on **`state` only**
- Pincode format rules unchanged
- Invoice / GSTR-1 place of supply unchanged
- Frontend does pincode lookup itself (India Post); backend does **not** need a pincode API unless you want server-side validation later

---

## Frontend checklist (already done)

- [x] Checkout form: City / District / State autofill + submit
- [x] Admin Add Order: City / District / State autofill + submit
- [x] Vendor form: District field on billing address
- [x] Customer detail UI shows district when present

---

## Backend checklist

- [ ] Add `district` to order customer schema + create validation
- [ ] Persist on public `POST /api/orders` and admin `POST /api/admin/orders`
- [ ] Return on order GET / list / detail
- [ ] Add to customer address snapshot
- [ ] Add to vendor `billingAddress` create/update/get
- [ ] Confirm old records without `district` do not 500
- [ ] Smoke test: place domestic order with `district` and read it back in admin

---

## Contact

If checkout returns `400` for unknown field `district`, strip/reject is wrong — please **accept and store** the field. Frontend is already sending it.
