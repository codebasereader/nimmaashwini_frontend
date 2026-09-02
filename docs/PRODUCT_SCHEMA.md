# Product Schema — Frontend Contract

Schema proposal for the Nimmaaishwini product API, aligned with the admin panel product form.

**Audience:** Backend team  
**Status:** Proposed extension to existing `POST /api/admin/products` and `PUT /api/admin/products/{id}`  
**Related:** [API.md](./API.md)

---

## Summary of changes

| Area | Current API | Proposed |
|------|-------------|----------|
| Pack sizes | `sizes[]` (label, value, price, stock) | **`quantities[]`** with unit (ml/g/kg/l), per-variant max order |
| Specifications | `specifications[]` (heading, description) | Same shape — admin now sends dynamically |
| Benefits | `benefits[]` (heading, description) | Same shape — admin now sends dynamically |
| Base price | `price` required | Keep required — frontend sends **lowest variant price** |
| Total stock | `stock` optional | Keep — frontend sends **sum of all variant stocks** |

---

## Full product payload (create / update)

```json
{
  "name": "Ragi Malt Powder",
  "tagline": "Wholesome morning nutrition",
  "description": "Traditional malted ragi powder for the whole family.",
  "highlights": [
    "100% natural ingredients",
    "No artificial preservatives"
  ],
  "category": "665f1a2b3c4d5e6f7a8b9c0d",
  "images": [
    {
      "key": "products/uuid-front.jpg",
      "url": "https://nimmaaishwini.s3.ap-south-1.amazonaws.com/products/uuid-front.jpg",
      "alt": "Ragi Malt Powder",
      "sortOrder": 0
    }
  ],
  "quantities": [
    {
      "amount": 250,
      "unit": "g",
      "label": "250 g",
      "value": "250g",
      "price": 199,
      "stock": 80,
      "maxQuantityPerOrder": 3,
      "sortOrder": 0
    },
    {
      "amount": 500,
      "unit": "g",
      "label": "500 g",
      "value": "500g",
      "price": 349,
      "stock": 45,
      "maxQuantityPerOrder": 2,
      "sortOrder": 1
    },
    {
      "amount": 200,
      "unit": "ml",
      "label": "200 ml",
      "value": "200ml",
      "price": 149,
      "stock": 30,
      "maxQuantityPerOrder": 5,
      "sortOrder": 2
    }
  ],
  "price": 149,
  "stock": 155,
  "maxQuantityPerOrder": 3,
  "specifications": [
    {
      "heading": "Net Weight",
      "description": "250 g / 500 g",
      "sortOrder": 0
    },
    {
      "heading": "Ingredients",
      "description": "Ragi, Cardamom, Natural sweeteners",
      "sortOrder": 1
    },
    {
      "heading": "Preparation",
      "description": "Mix with warm milk or water",
      "sortOrder": 2
    },
    {
      "heading": "Shelf Life",
      "description": "12 months in airtight container",
      "sortOrder": 3
    },
    {
      "heading": "Storage",
      "description": "Cool, dry place away from sunlight",
      "sortOrder": 4
    },
    {
      "heading": "Allergens",
      "description": "May contain traces of nuts",
      "sortOrder": 5
    }
  ],
  "benefits": [
    {
      "heading": "Rich in Calcium",
      "description": "Finger millet naturally supports bone health and growth — a traditional staple for growing children.",
      "sortOrder": 0
    },
    {
      "heading": "Sustained Energy",
      "description": "Complex carbohydrates provide steady fuel through the morning without artificial stimulants.",
      "sortOrder": 1
    },
    {
      "heading": "Easy Digestion",
      "description": "Light, malted preparation is gentle on the stomach and easy to absorb.",
      "sortOrder": 2
    },
    {
      "heading": "Wholesome Nutrition",
      "description": "Packed with dietary fibre, iron, and essential minerals from pure ragi.",
      "sortOrder": 3
    }
  ],
  "isActive": true
}
```

---

## Field reference

### `quantities` (new — recommended)

Array of purchasable pack-size variants. At least **one** variant is required when creating a product from the admin panel.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `amount` | Yes | number | Numeric quantity (e.g. `250`, `500`, `1`) |
| `unit` | Yes | enum | `"ml"` \| `"g"` \| `"kg"` \| `"l"` |
| `label` | Yes | string | Display label (e.g. `"250 g"`, `"200 ml"`) |
| `value` | Yes | string | Stable cart/order code (e.g. `"250g"`, `"200ml"`) — unique per product |
| `price` | Yes | number | Price in INR for this variant |
| `stock` | No | number | Stock for this variant (default: `0`) |
| `maxQuantityPerOrder` | No | number | Max units of **this variant** per order (default: `1`) |
| `sortOrder` | No | number | Display order (default: array index) |

#### Quantity variant object

```json
{
  "amount": 250,
  "unit": "g",
  "label": "250 g",
  "value": "250g",
  "price": 199,
  "stock": 80,
  "maxQuantityPerOrder": 3,
  "sortOrder": 0
}
```

#### Validation rules (suggested)

- `quantities` must contain at least 1 item on create
- `amount` must be `> 0`
- `unit` must be one of: `ml`, `g`, `kg`, `l`
- `value` must be unique within the product
- `price` must be `>= 0`
- `stock` must be `>= 0`
- `maxQuantityPerOrder` must be `>= 1`

#### MongoDB subdocument schema (suggested)

```javascript
const quantityVariantSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, enum: ['ml', 'g', 'kg', 'l'] },
  label: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  maxQuantityPerOrder: { type: Number, default: 1, min: 1 },
  sortOrder: { type: Number, default: 0 },
}, { _id: false });
```

---

### `specifications` (existing — dynamic list)

Free-form key/value pairs for product detail tables.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `heading` | Yes | string | Label (e.g. `"Net Weight"`, `"Ingredients"`) |
| `description` | Yes | string | Value text |
| `sortOrder` | No | number | Display order |

```json
{
  "heading": "Storage",
  "description": "Cool, dry place away from sunlight",
  "sortOrder": 4
}
```

**Note:** Labels are fully dynamic — no fixed enum. Admin can add any number of rows.

---

### `benefits` (existing — dynamic list)

Marketing benefit blocks for the product page.

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `heading` | Yes | string | Benefit title |
| `description` | Yes | string | Benefit body copy |
| `sortOrder` | No | number | Display order |

```json
{
  "heading": "Rich in Calcium",
  "description": "Finger millet naturally supports bone health and growth — a traditional staple for growing children.",
  "sortOrder": 0
}
```

---

### Derived / legacy fields

The admin panel still sends these for backward compatibility with the current API:

| Field | How frontend computes it |
|-------|--------------------------|
| `price` | `quantities[0].price` (lowest sortOrder variant) |
| `stock` | Sum of all `quantities[].stock` |
| `maxQuantityPerOrder` | `quantities[0].maxQuantityPerOrder` |

#### Migration from `sizes`

Existing `sizes` array can be migrated to `quantities`:

| Old (`sizes`) | New (`quantities`) |
|---------------|-------------------|
| `label` | `label` (+ parse `amount` / `unit` if possible) |
| `value` | `value` |
| `price` | `price` |
| `stock` | `stock` |
| — | `maxQuantityPerOrder` (default `1`) |
| — | `amount`, `unit` (parse from label or set defaults) |

**Recommendation:** Accept both `sizes` and `quantities` during a transition period. Prefer `quantities` when present. Deprecate `sizes` in a future API version.

---

## Response object

Public and admin product responses should include the new fields:

```json
{
  "id": "665f1a2b3c4d5e6f7a8b9c0e",
  "name": "Ragi Malt Powder",
  "slug": "ragi-malt-powder",
  "tagline": "Wholesome morning nutrition",
  "description": "...",
  "highlights": [],
  "category": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "Health Foods",
    "slug": "health-foods"
  },
  "images": [],
  "quantities": [],
  "price": 149,
  "stock": 155,
  "maxQuantityPerOrder": 3,
  "specifications": [],
  "benefits": [],
  "sizes": [],
  "suitability": [],
  "isActive": true,
  "createdAt": "2026-07-01T10:00:00.000Z",
  "updatedAt": "2026-07-01T10:00:00.000Z"
}
```

---

## Cart / order integration (future)

When a customer selects a variant on the storefront:

```json
{
  "productId": "665f1a2b3c4d5e6f7a8b9c0e",
  "quantityValue": "250g",
  "quantity": 2
}
```

Backend should:

1. Resolve `quantityValue` against `product.quantities[].value`
2. Use that variant's `price` for line total
3. Enforce `maxQuantityPerOrder` for that variant
4. Decrement `quantities[].stock` (and/or total `stock`)

---

## Admin panel behaviour

| UI section | API field | Notes |
|------------|-----------|-------|
| Quantity Variants | `quantities[]` | Add/remove rows; each has amount, unit, price, stock, max order |
| Specifications | `specifications[]` | Dynamic heading + description rows |
| Benefits | `benefits[]` | Dynamic heading + description rows |

Empty specification/benefit rows are stripped before submit.  
At least one quantity variant with `amount` and `price` is required to save.

---

## Example: Herbal Hair Oil (ml-based)

```json
{
  "name": "Herbal Hair Oil",
  "category": "665f1a2b3c4d5e6f7a8b9c0d",
  "quantities": [
    {
      "amount": 100,
      "unit": "ml",
      "label": "100 ml",
      "value": "100ml",
      "price": 249,
      "stock": 120,
      "maxQuantityPerOrder": 2,
      "sortOrder": 0
    },
    {
      "amount": 200,
      "unit": "ml",
      "label": "200 ml",
      "value": "200ml",
      "price": 449,
      "stock": 60,
      "maxQuantityPerOrder": 2,
      "sortOrder": 1
    }
  ],
  "specifications": [
    { "heading": "Net Volume", "description": "100 ml / 200 ml", "sortOrder": 0 },
    { "heading": "Ingredients", "description": "Coconut oil, Amla, Bhringraj, Curry leaves", "sortOrder": 1 }
  ],
  "benefits": [
    {
      "heading": "Strengthens Roots",
      "description": "Traditional herbs nourish the scalp and reduce hair fall.",
      "sortOrder": 0
    }
  ],
  "price": 249,
  "stock": 180,
  "isActive": true
}
```

---

## Checklist for backend implementation

- [ ] Add `quantities[]` to Product mongoose schema
- [ ] Validate `unit` enum and unique `value` per product
- [ ] Accept `quantities` on `POST /api/admin/products` and `PUT /api/admin/products/{id}`
- [ ] Return `quantities` in all product GET responses
- [ ] Compute or accept derived `price`, `stock`, `maxQuantityPerOrder`
- [ ] Migration script: `sizes` → `quantities` for existing products
- [ ] Storefront: expose `quantities` for variant selector on product detail page

---

## Contact

Coordinate with the frontend team before removing legacy `sizes` or changing `quantities` shape.
