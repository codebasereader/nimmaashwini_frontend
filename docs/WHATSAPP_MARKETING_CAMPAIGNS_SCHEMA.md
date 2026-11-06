# WhatsApp Marketing Campaigns — Backend Schema

**Audience:** Backend team
**Status:** Proposed — admin frontend will be built against this contract
**Admin UI:** `/admin/whatsapp/*` (Contacts, Templates, Campaigns)
**Provider:** MSG91 WhatsApp (Meta Cloud API underneath)
**Related:** [API.md](./API.md), [CUSTOMER_DATA_SCHEMA.md](./CUSTOMER_DATA_SCHEMA.md), [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md)

This document specifies how the admin sends **promotional (Marketing-category) WhatsApp messages** to a large customer list (~28,000 numbers) **in controlled batches**, so the business WhatsApp number is not rate-limited, flagged for spam, or blocked.

> **Scope note — verify provider details.** MSG91 request/response shapes in this document are indicative. Before implementing, confirm every MSG91 endpoint, field name and webhook payload against the current MSG91 WhatsApp documentation and the MSG91 dashboard for our account. Where this document says *(verify)*, do not assume.

---

## 0. Non-negotiable rules

| # | Rule | Why |
|---|------|-----|
| 1 | **Marketing content is sent only with an approved Marketing-category template.** Never free text, never a Utility template. | Meta classifies by content. Promotional content under Utility is re-categorised or rejected, and misuse risks restrictions on the number. |
| 2 | **The MSG91 auth key lives only on the backend** (env / secrets manager). Never sent to or stored in the browser. | Security. |
| 3 | **Sending is queue-driven on the backend.** The admin UI only creates and controls campaigns. A campaign must keep running with no browser open. | Campaigns span days. |
| 4 | **Send only to contacts with `status = active`.** `opted_out`, `invalid`, `not_on_whatsapp` are never messaged. | Consent + quality rating. |
| 5 | **Opt-outs are honoured immediately and permanently** (until the customer opts back in). | Consent, Meta policy. |
| 6 | **Order-confirmation / transactional messages must not be delayed or blocked by campaigns.** Separate code path and queue; a marketing pause or throttle never affects them. | The same WhatsApp number is used for both. |
| 7 | **Hard ceilings are enforced server-side**, even if the client sends larger values (see §6). | Protect the number. |
| 8 | Every send is **idempotent**: one message per (`campaignId`, `contactId`), enforced by a unique index. | No duplicate sends on retries. |

---

## Auth

```http
Authorization: Bearer <admin_jwt_token>
```

All endpoints below are admin-only.

| HTTP | Meaning |
|------|---------|
| `401` | Missing / invalid token |
| `403` | Logged in but not an admin |
| `400` | Validation failure |
| `404` | Resource not found |
| `409` | State conflict (e.g. start a campaign that is already running) |

Responses use the standard envelope:

```json
{ "success": true, "message": "Success", "data": { } }
```

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "Reason" }] }
```

---

## 1. Endpoint cheat sheet

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/whatsapp/contacts/import` | Import a chunk of cleaned contacts |
| `GET` | `/api/admin/whatsapp/contacts` | List / search contacts |
| `GET` | `/api/admin/whatsapp/contacts/summary` | Counts by status |
| `PUT` | `/api/admin/whatsapp/contacts/{id}/status` | Manually set status (e.g. opt-out) |
| `GET` | `/api/admin/whatsapp/templates` | List templates |
| `POST` | `/api/admin/whatsapp/templates` | Create template + submit to MSG91/Meta |
| `GET` | `/api/admin/whatsapp/templates/{id}` | Template detail |
| `POST` | `/api/admin/whatsapp/templates/{id}/sync` | Pull latest approval status from MSG91 |
| `POST` | `/api/admin/whatsapp/uploads/media` | Upload header image for a template |
| `GET` | `/api/admin/whatsapp/campaigns` | List campaigns |
| `POST` | `/api/admin/whatsapp/campaigns` | Create campaign (draft) |
| `GET` | `/api/admin/whatsapp/campaigns/{id}` | Campaign detail + live stats |
| `PUT` | `/api/admin/whatsapp/campaigns/{id}` | Edit a **draft** campaign |
| `POST` | `/api/admin/whatsapp/campaigns/{id}/test-send` | Send to internal test numbers |
| `POST` | `/api/admin/whatsapp/campaigns/{id}/start` | Snapshot audience and start |
| `POST` | `/api/admin/whatsapp/campaigns/{id}/pause` | Pause |
| `POST` | `/api/admin/whatsapp/campaigns/{id}/resume` | Resume |
| `POST` | `/api/admin/whatsapp/campaigns/{id}/approve-next-batch` | Release the next batch (manual mode) |
| `POST` | `/api/admin/whatsapp/campaigns/{id}/stop` | Stop permanently |
| `GET` | `/api/admin/whatsapp/campaigns/{id}/batches` | Per-batch stats |
| `GET` | `/api/admin/whatsapp/campaigns/{id}/messages` | Per-message results (paginated, filterable) |
| `GET` | `/api/admin/whatsapp/campaigns/{id}/messages/export` | Excel/CSV of results (optional, v2) |
| `PUT` | `/api/admin/whatsapp/settings` | Global marketing settings + kill switch |
| `GET` | `/api/admin/whatsapp/settings` | Read settings |
| `POST` | `/api/webhooks/msg91/whatsapp` | **Inbound** MSG91 webhook (delivery reports + replies) — not admin-authenticated; verify signature/secret *(verify)* |

---

## 2. Data model

Suggested collections (adapt to the existing DB).

### 2.1 `whatsappContacts`

```json
{
  "id": "6a...",
  "name": "Sachin",
  "phone": "919876543210",
  "status": "active",
  "source": "excel_import_2026-10",
  "optedOutAt": null,
  "optOutReason": null,
  "lastMessagedAt": null,
  "createdAt": "2026-10-27T10:00:00.000Z",
  "updatedAt": "2026-10-27T10:00:00.000Z"
}
```

| Field | Notes |
|-------|-------|
| `phone` | **Unique index.** Normalised E.164 digits without `+`: `91` + 10-digit number (see §3). |
| `status` | `active` · `opted_out` · `invalid` · `not_on_whatsapp` |
| `source` | Free text tag for where the contact came from |
| `lastMessagedAt` | Last marketing send; used for frequency capping (§6) |

### 2.2 `whatsappTemplates`

```json
{
  "id": "6a...",
  "name": "diwali_offer_2026",
  "language": "en",
  "category": "MARKETING",
  "header": { "type": "image", "mediaUrl": "https://.../banner.jpg" },
  "body": "Hi {{1}}, our Diwali collection is here! Enjoy {{2}} on herbal hair oils till {{3}}.",
  "footer": "Reply STOP to unsubscribe",
  "buttons": [
    { "type": "url", "text": "Shop now", "url": "https://nimmaashwini.com" },
    { "type": "quick_reply", "text": "Stop promotions" }
  ],
  "variables": [
    { "index": 1, "label": "Customer name", "source": "contact.name", "fallback": "there" },
    { "index": 2, "label": "Offer", "source": "static" },
    { "index": 3, "label": "Last date", "source": "static" }
  ],
  "status": "approved",
  "rejectionReason": null,
  "providerTemplateId": "msg91-template-id",
  "createdAt": "2026-10-27T10:00:00.000Z",
  "updatedAt": "2026-10-27T10:20:00.000Z"
}
```

| Field | Notes |
|-------|-------|
| `name` | Lowercase letters, digits, underscores. **Unique per language.** Cannot change after submission. |
| `category` | **Always `MARKETING`** for this module. Reject any other value with `400`. |
| `header.type` | `none` · `image` (v1). `video` / `document` optional later. |
| `body` | Max 1024 chars. Variables `{{1}}`…`{{n}}` numbered from 1, each used once, not adjacent, not first/last word (Meta rule). |
| `footer` | Max 60 chars. **Required for this module** and must contain an opt-out hint (e.g. "Reply STOP to unsubscribe") unless a `quick_reply` "Stop promotions" button exists. |
| `buttons` | Up to 3 for v1. Types: `url` (static), `quick_reply`, `phone_number`. |
| `variables[].source` | `contact.name` (filled per recipient) or `static` (value supplied at campaign level). |
| `status` | `draft` · `pending` · `approved` · `rejected` · `paused` · `disabled` (mirror what MSG91/Meta report) |

Only templates with `status = approved` can be attached to a campaign.

### 2.3 `whatsappCampaigns`

```json
{
  "id": "6a...",
  "name": "Diwali offer — wave 1",
  "templateId": "6a...",
  "variableValues": { "2": "15% off", "3": "5 Nov" },
  "audience": { "type": "all_active", "recentBuyerDays": null, "limit": null },
  "status": "running",
  "mode": "manual_approve",
  "sendPlan": {
    "batchSize": 100,
    "batchGapMinutes": 20,
    "ratePerSecond": 3,
    "dailyCap": 200,
    "window": { "startHour": 10, "endHour": 19, "timezone": "Asia/Kolkata" },
    "autoRamp": { "enabled": false, "growthFactor": 2, "maxDailyCap": 1000 }
  },
  "safety": {
    "pauseIfFailureRatePct": 5,
    "pauseIfEcosystemBlockRatePct": 3,
    "pauseIfOptOutRatePct": 2,
    "minMessagesForHealthCheck": 50,
    "healthCheckDelayMinutes": 30
  },
  "stats": {
    "total": 28300, "queued": 28000, "sent": 300, "delivered": 280, "read": 120,
    "failed": 10, "optedOut": 2, "skipped": 0
  },
  "currentBatchNo": 3,
  "pausedReason": null,
  "createdBy": "admin-user-id",
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2026-10-27T10:00:00.000Z",
  "updatedAt": "2026-10-27T10:00:00.000Z"
}
```

| Field | Notes |
|-------|-------|
| `status` | `draft` · `running` · `paused` · `completed` · `stopped` · `failed` |
| `mode` | `manual_approve` — after each batch the campaign waits until an admin calls `approve-next-batch`. `auto` — the next batch is released automatically **only if the previous batch passed its health check** (§5.4). |
| `audience.type` | `all_active` · `recent_buyers` (contacts whose phone matches an order created in the last `recentBuyerDays`) · `selected` (explicit `contactIds`, for tests/small sends) |
| `audience.limit` | Optional cap on audience size |
| `sendPlan.*` | Subject to the hard ceilings in §6 |
| `stats` | Maintained incrementally; also derivable from `whatsappCampaignMessages` |

### 2.4 `whatsappCampaignMessages`

One row per recipient, created when the campaign is **started** (audience snapshot).

```json
{
  "id": "6a...",
  "campaignId": "6a...",
  "contactId": "6a...",
  "phone": "919876543210",
  "batchNo": 3,
  "status": "delivered",
  "providerMessageId": "wamid.HBg...",
  "errorCode": null,
  "errorMessage": null,
  "queuedAt": "...", "sentAt": "...", "deliveredAt": "...", "readAt": null, "failedAt": null
}
```

| Field | Notes |
|-------|-------|
| `status` | `queued` · `sending` · `sent` · `delivered` · `read` · `failed` · `skipped` |
| `batchNo` | Assigned at snapshot time (1-based). Batch = `batchSize` consecutive rows in priority order (§5.1). |
| `skipped` | Contact became `opted_out`/`invalid` after the snapshot, or was frequency-capped |

**Indexes:** unique `(campaignId, contactId)`; `(campaignId, status, batchNo)`; `providerMessageId`; `phone`.

### 2.5 `whatsappSettings` (singleton)

```json
{
  "marketingEnabled": true,
  "globalDailyCap": 1000,
  "minDaysBetweenMarketing": 7,
  "qualityRating": "GREEN",
  "messagingTier": 1000,
  "updatedAt": "..."
}
```

`marketingEnabled = false` is the **kill switch**: all running campaigns pause with reason `kill_switch`; nothing marketing is sent. Transactional messages are unaffected.
`qualityRating` (`GREEN` / `YELLOW` / `RED`) and `messagingTier` are read from MSG91/Meta if an API exists *(verify)*; otherwise the admin sets them manually and the engine trusts them. `YELLOW` or `RED` auto-pauses all campaigns.

---

## 3. Phone normalisation (server is authoritative)

The frontend cleans the Excel before upload, but the **server must re-normalise and re-validate every number**.

Input is digits only after stripping spaces, `+`, `-`, `(`, `)`.

| Input | Result |
|-------|--------|
| 10 digits starting 6–9 | `91` + number |
| 11 digits starting `0` | drop the `0`, then as above |
| 12 digits starting `91` and rest starting 6–9 | keep |
| anything else (6, 9 digits etc.) | **invalid** — reject, do not store as active |

Final valid pattern: `^91[6-9][0-9]{9}$`.

Real data profile of the client's file (28,614 rows): 28,418 with 10 digits, 99 with 12, 14 with 11, 21 too short, 62 blank, ~200 duplicates → about **28,300 usable unique numbers**.

---

## 4. Endpoints

### 4.1 Import contacts — `POST /api/admin/whatsapp/contacts/import`

The browser parses the Excel and uploads **chunks of up to 1,000 rows**.

```json
{
  "source": "excel_import_2026-10",
  "contacts": [
    { "name": "Sachin", "phone": "9876543210" },
    { "name": "Priya", "phone": "+91 98765 43211" }
  ]
}
```

**Success `200`:**

```json
{
  "success": true,
  "message": "Import processed",
  "data": {
    "received": 2, "created": 1, "duplicates": 1, "invalid": 0,
    "invalidRows": [{ "index": 5, "phone": "98765", "reason": "Invalid phone" }]
  }
}
```

Rules: upsert by normalised `phone`; never overwrite `opted_out` back to `active` via import; existing contacts keep their status; cap 1,000 per call (`400` above).

### 4.2 List contacts — `GET /api/admin/whatsapp/contacts`

Query: `page`, `limit` (≤100), `status`, `search` (name or phone). Returns `{ items, pagination }` like other admin lists.

### 4.3 Contacts summary — `GET /api/admin/whatsapp/contacts/summary`

```json
{ "total": 28300, "active": 28100, "opted_out": 150, "invalid": 20, "not_on_whatsapp": 30 }
```

### 4.4 Templates

**Create — `POST /api/admin/whatsapp/templates`**

Body = template fields from §2.2 (`name`, `language`, `header`, `body`, `footer`, `buttons`, `variables`). Server:

1. Validates Meta text rules and that `category` is `MARKETING` (force it; ignore client value).
2. Saves as `draft`, then submits to MSG91 for approval *(verify the MSG91 create-template endpoint and the media-header requirements)*, sets `status = pending` and stores `providerTemplateId`.

**Sync — `POST /api/admin/whatsapp/templates/{id}/sync`** — fetch current status/rejection reason from MSG91 and update. Also run a periodic job (e.g. every 15 min) for `pending` templates.

**Media — `POST /api/admin/whatsapp/uploads/media`** — `multipart/form-data` image upload (JPG/PNG, ≤ 5 MB). Store (e.g. S3) and return a public HTTPS `url`. Meta requires a sample for the header at submission time; the same URL (or a per-send media id) is used when sending *(verify how MSG91 expects the header image at send time)*.

### 4.5 Campaign lifecycle

State machine:

```text
draft ──start──▶ running ◀──resume── paused
                   │  ▲                 ▲
                   │  └──approve-next── │ (manual mode waits in "running" with awaitingApproval=true)
                   ├──pause────────────┘
                   ├──stop───▶ stopped
                   └──all sent──▶ completed
```

| Endpoint | Behaviour |
|----------|-----------|
| `POST /campaigns` | Validates template is `approved`, variables complete, send plan within ceilings. Creates `draft`. |
| `PUT /campaigns/{id}` | Only while `draft`; otherwise `409`. |
| `POST /campaigns/{id}/test-send` | Body `{ "phones": ["9876543210"] }` (max 5). Sends the real template immediately to those numbers, outside the audience and outside batches. Not counted in stats. Required before `start` unless `settings.requireTestBeforeStart = false`. |
| `POST /campaigns/{id}/start` | Snapshots the audience (§5.1), creates `whatsappCampaignMessages`, sets `running`. `409` if not `draft`, template not approved, or marketing disabled. |
| `POST /campaigns/{id}/pause` / `resume` | Manual. `resume` re-checks kill switch and quality rating. |
| `POST /campaigns/{id}/approve-next-batch` | Manual mode: releases exactly one batch. `409` if the previous batch is still sending. |
| `POST /campaigns/{id}/stop` | Irreversible. Remaining `queued` messages become `skipped`. |

### 4.6 Results

**`GET /campaigns/{id}/batches`**

```json
[
  { "batchNo": 1, "size": 100, "sent": 100, "delivered": 96, "read": 40, "failed": 4,
    "failureRatePct": 4.0, "startedAt": "...", "finishedAt": "...", "healthy": true }
]
```

**`GET /campaigns/{id}/messages`** — paginated; filters: `status`, `batchNo`, `errorCode`, `search` (phone/name). Used for the failure-reason table.

### 4.7 Settings — `GET/PUT /api/admin/whatsapp/settings`

Body/fields as §2.5. `PUT` validates ceilings; changing `marketingEnabled` to `false` immediately pauses running campaigns.

---

## 5. Sending engine

### 5.1 Audience snapshot (on `start`)

1. Select contacts per `audience`, **only `status = active`**.
2. Exclude contacts messaged by marketing within `minDaysBetweenMarketing` days (`lastMessagedAt`).
3. **Priority order** (lowest spam risk first): contacts matching a recent order (newest order first), then the rest in a stable order.
4. Create one `whatsappCampaignMessages` row per contact with `status = queued` and `batchNo = ceil(position / batchSize)`.

### 5.2 Scheduler tick

Run every minute (e.g. EventBridge → Lambda/worker). For each `running` campaign:

1. If `settings.marketingEnabled = false` → pause (`kill_switch`).
2. If `qualityRating` is `YELLOW`/`RED` → pause (`quality_rating`).
3. If outside the send window (`window.startHour`–`endHour`, IST) → do nothing.
4. If today's marketing sends (across all campaigns) ≥ `min(dailyCap, globalDailyCap, messagingTier safety margin)` → do nothing.
5. Determine the batch to send:
   - **manual_approve:** only if `awaitingApproval = false` (set by `approve-next-batch`; reset to true when the batch completes).
   - **auto:** only if the previous batch is `healthy` (§5.4) and at least `batchGapMinutes` have passed since it finished.
6. Send up to `ratePerSecond` messages per second for the batch (§5.3), re-checking each contact is still `active` immediately before sending (skip otherwise).
7. When the batch's messages are all `sent`/`failed`, mark the batch finished and record `finishedAt`.

### 5.3 Sending a message (MSG91) *(verify all details)*

Indicative bulk-template request (confirm against MSG91 docs):

```http
POST https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/
authkey: <MSG91_AUTH_KEY>
Content-Type: application/json
```

```json
{
  "integrated_number": "<our WhatsApp number>",
  "content_type": "template",
  "payload": {
    "messaging_product": "whatsapp",
    "type": "template",
    "template": {
      "name": "diwali_offer_2026",
      "language": { "code": "en", "policy": "deterministic" },
      "namespace": "<MSG91 namespace>",
      "to_and_components": [
        { "to": ["919876543210"],
          "components": {
            "header_1": { "type": "image", "value": "https://.../banner.jpg" },
            "body_1": { "type": "text", "value": "Sachin" },
            "body_2": { "type": "text", "value": "15% off" },
            "body_3": { "type": "text", "value": "5 Nov" }
          } }
      ]
    }
  }
}
```

- Store the returned provider message id on the row (`status = sent`).
- Variable value for `contact.name` falls back to the template's `fallback` when the name is empty.
- Variable values must not contain line breaks/tabs/4+ spaces (Meta rule).
- **Retries:** retry only transient errors (network, 5xx, provider throttling) with exponential backoff, max 3 attempts. **Never retry** policy/ecosystem errors or "not on WhatsApp"; mark `failed` and move on.
- Mark `not_on_whatsapp` on the contact when the error indicates an undeliverable number (e.g. Meta code `131026`) *(verify code list)*.

### 5.4 Health check and auto-pause

After a batch finishes and `healthCheckDelayMinutes` have passed (so delivery reports arrive), compute for that batch (needs ≥ `minMessagesForHealthCheck` messages):

| Signal | Default pause threshold |
|--------|-------------------------|
| `failed / sent` | > 5% |
| "Meta chose not to deliver for ecosystem engagement" errors (e.g. code `131049`) *(verify)* | > 3% |
| Opt-outs (STOP replies / button) within the window / `delivered` | > 2% |

If any threshold is exceeded → set campaign `paused`, `pausedReason = "unhealthy_batch"`, and notify admins (email/SMS/webhook — implementation choice). In `auto` mode a batch is `healthy` only when none of the thresholds is exceeded. Admins can still `resume` manually after reviewing.

### 5.5 Auto-ramp (optional)

If `autoRamp.enabled`: at the start of each new day, `dailyCap = min(maxDailyCap, previousDayCap * growthFactor)` **only if** all of yesterday's batches were healthy. Otherwise keep the same cap. Never exceed hard ceilings (§6).

---

## 6. Hard ceilings (enforced server-side)

| Limit | Value | Notes |
|-------|-------|-------|
| Batch size | ≤ 500 (default 100) | |
| Rate | ≤ 10 messages/second | |
| Daily cap | ≤ `min(settings.globalDailyCap, current Meta messaging tier)` | Meta limits unique users per rolling 24h |
| First campaign day | ≤ 200 | warm-up |
| Send window | 08:00–20:00 IST max | default 10:00–19:00 |
| Test send | ≤ 5 numbers | |
| Frequency cap | 1 marketing message per contact per `minDaysBetweenMarketing` days (default 7) | |
| Audience per campaign | ≤ 30,000 | |

Suggested ramp for the first list (client can change): Day 1: 2 × 100 · Day 2: ~500 · Day 3: ~1,000 · then double while healthy, never above the Meta tier.

---

## 7. Webhooks (MSG91 → backend) *(verify payload shape and signature mechanism)*

`POST /api/webhooks/msg91/whatsapp`

**Delivery reports** — update `whatsappCampaignMessages` by `providerMessageId`:

| Provider status | Our status |
|-----------------|-----------|
| sent | `sent` |
| delivered | `delivered` (+ `deliveredAt`) |
| read | `read` (+ `readAt`) |
| failed | `failed` (+ `errorCode`, `errorMessage`) |

Recompute `stats` incrementally. Webhook handler must be idempotent and out-of-order tolerant (never move `read` back to `delivered`).

**Inbound replies** — if the text (case-insensitive, trimmed) is one of `STOP`, `UNSUBSCRIBE`, `CANCEL`, `NO` + the quick-reply button payload "Stop promotions":

1. Set contact `status = opted_out`, `optedOutAt = now`, `optOutReason = "customer_reply"`.
2. Mark any still-`queued` messages for that contact `skipped`.
3. Optionally send one plain acknowledgement ("You've been unsubscribed.") — allowed inside the 24-hour customer-service window.

Reject webhook calls that fail verification with `401`. Respond `200` quickly; process asynchronously.

---

## 8. Transactional separation (same WhatsApp number)

- Order-confirmation sends use their own function/queue and **ignore** `marketingEnabled`, daily caps and windows.
- Marketing and transactional share only the MSG91 credentials and number. A rate-limited MSG91 response on marketing must not block order messages (separate retry/backoff).
- Because quality rating and tier are **per number**, a poor marketing quality rating lowers capacity for order messages too. That is why the auto-pause rules in §5.4 and the kill switch exist; the admin UI will show quality rating prominently.

---

## 9. Environment / config

| Variable | Purpose |
|----------|---------|
| `MSG91_AUTH_KEY` | Provider API key (secret) |
| `MSG91_WHATSAPP_NUMBER` | Integrated sender number |
| `MSG91_WEBHOOK_SECRET` | Webhook verification *(verify mechanism)* |
| `WHATSAPP_MEDIA_BUCKET` | Storage for header images |
| `WHATSAPP_TIMEZONE` | Default `Asia/Kolkata` |

---

## 10. Checklist for backend

- [ ] Collections + indexes from §2 (unique `phone`, unique `(campaignId, contactId)`)
- [ ] Phone normalisation (§3) shared by import, test-send and audience selection
- [ ] Contacts import / list / summary / status endpoints
- [ ] Template create → submit to MSG91, sync endpoint + periodic status job, media upload
- [ ] Force `category = MARKETING`; require opt-out footer or "Stop promotions" button
- [ ] Campaign CRUD, `test-send`, `start` (audience snapshot with buyer-first priority), `pause`, `resume`, `approve-next-batch`, `stop`
- [ ] Scheduler tick with window, daily cap, kill switch, quality-rating gate
- [ ] MSG91 sender with rate limiting, retry only transient errors
- [ ] Per-batch health check + auto-pause + admin notification
- [ ] Webhook: delivery reports + opt-out handling (idempotent, verified)
- [ ] Hard ceilings (§6) enforced regardless of client input
- [ ] Settings singleton with kill switch; quality rating/tier source decided
- [ ] Transactional order-confirmation path isolated (§8)
- [ ] Results endpoints (`batches`, `messages`) for the admin dashboard
