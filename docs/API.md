# Nimmaaishwini API Documentation

API guide for frontend developers integrating with the Nimmaaishwini e-commerce backend.

## Base URL

| Environment | Base URL |
|-------------|----------|
| Local (`npm run dev`) | `http://localhost:3000` |
| AWS (after deploy) | `https://<api-id>.execute-api.ap-south-1.amazonaws.com` |

All endpoints are prefixed with `/api`.

---

## Authentication

Admin-only endpoints require a JWT token.

### Login (Admin)

**POST** `/api/auth/login`

**Auth required:** No

**Request body:**

```json
{
  "email": "admin@nimmaaishwini.com",
  "password": "Admin@123456"
}
```

**Success response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "665f1a2b3c4d5e6f7a8b9c0d",
      "name": "Admin",
      "email": "admin@nimmaaishwini.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z"
    }
  }
}
```

**Error response (401):**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Using the token

Send the token on every admin request:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Store the token securely (e.g. `localStorage` for admin panel, or httpOnly cookie if you add cookie support later).

**Roles:** Currently only `admin` exists.

---

## Standard response format

### Success

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

`errors` is only present for validation failures (400).

### Pagination (list endpoints)

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [],
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

**Query params for lists:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | — | Products only: full-text search |
| `category` | string | — | Products only: filter by category ID |
| `isActive` | boolean | — | Filter by active status (`true` / `false`) |

---

## Image upload (S3)

Admin uploads images directly to S3 using presigned URLs. The API never receives the image binary.

### Flow

```
1. POST /api/admin/upload/presigned-url  → get uploadUrl + key + publicUrl
2. PUT uploadUrl (from browser)           → upload file directly to S3
3. Use { key, url: publicUrl } in category/product payload
```

### Step 1 — Get presigned URL

**POST** `/api/admin/upload/presigned-url`

**Auth required:** Yes (admin)

**Request body:**

```json
{
  "fileName": "product-front.jpg",
  "contentType": "image/jpeg",
  "folder": "products"
}
```

| Field | Required | Values |
|-------|----------|--------|
| `fileName` | Yes | Original file name |
| `contentType` | Yes | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| `folder` | Yes | `products` or `categories` |

**Success response (200):**

```json
{
  "success": true,
  "message": "Presigned upload URL generated",
  "data": {
    "uploadUrl": "https://nimmaaishwini.s3.ap-south-1.amazonaws.com/products/uuid-product-front.jpg?...",
    "key": "products/uuid-product-front.jpg",
    "publicUrl": "https://nimmaaishwini.s3.ap-south-1.amazonaws.com/products/uuid-product-front.jpg",
    "expiresIn": 900
  }
}
```

### Step 2 — Upload to S3 (frontend)

```javascript
async function uploadImage(file, folder) {
  const presignRes = await fetch(`${BASE_URL}/api/admin/upload/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      folder,
    }),
  });

  const { data } = await presignRes.json();

  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  return {
    key: data.key,
    url: data.publicUrl,
    alt: file.name,
  };
}
```

### Step 3 — Delete uploaded file (optional)

**POST** `/api/admin/upload/delete`

**Auth required:** Yes (admin)

```json
{
  "key": "products/uuid-product-front.jpg"
}
```

---

## Categories

### Public — List categories

**GET** `/api/categories`

**Auth required:** No

Returns active categories by default when using the storefront. Admin list can pass `?isActive=true|false`.

### Public — Get category by ID

**GET** `/api/categories/{id}`

**Auth required:** No

### Admin — Create category

**POST** `/api/admin/categories`

**Auth required:** Yes (admin)

**Request body:**

```json
{
  "name": "Silk Sarees",
  "description": "Premium handwoven silk sarees",
  "image": {
    "key": "categories/uuid-silk.jpg",
    "url": "https://nimmaaishwini.s3.ap-south-1.amazonaws.com/categories/uuid-silk.jpg",
    "alt": "Silk Sarees"
  },
  "isActive": true,
  "sortOrder": 1
}
```

| Field | Required | Type |
|-------|----------|------|
| `name` | Yes | string |
| `description` | No | string |
| `image` | No | `{ key, url, alt? }` |
| `isActive` | No | boolean (default: `true`) |
| `sortOrder` | No | number (default: `0`) |

### Admin — Update category

**PUT** `/api/admin/categories/{id}`

**Auth required:** Yes (admin)

Send only fields you want to change.

### Admin — Delete category

**DELETE** `/api/admin/categories/{id}`

**Auth required:** Yes (admin)

### Category response object

```json
{
  "id": "665f1a2b3c4d5e6f7a8b9c0d",
  "name": "Silk Sarees",
  "slug": "silk-sarees",
  "description": "Premium handwoven silk sarees",
  "image": {
    "key": "categories/uuid-silk.jpg",
    "url": "https://...",
    "alt": "Silk Sarees"
  },
  "isActive": true,
  "sortOrder": 1,
  "createdAt": "2026-07-01T10:00:00.000Z",
  "updatedAt": "2026-07-01T10:00:00.000Z"
}
```

---

## Products

### Public — List products

**GET** `/api/products`

**Auth required:** No

Only returns `isActive: true` products.

**Examples:**

- `GET /api/products?page=1&limit=12`
- `GET /api/products?category=665f1a2b3c4d5e6f7a8b9c0d`
- `GET /api/products?search=silk`

### Public — Get product by ID

**GET** `/api/products/{id}`

**Auth required:** No

Returns 404 if product is inactive.

### Admin — List all products

**GET** `/api/admin/products`

**Auth required:** Yes (admin)

Supports `?isActive=true|false`, `?category=<id>`, `?search=silk`.

### Admin — Create product

**POST** `/api/admin/products`

**Auth required:** Yes (admin)

**Request body:**

```json
{
  "name": "Kanjivaram Silk Saree",
  "tagline": "Traditional elegance redefined",
  "description": "Full product description for the detail page.",
  "highlights": [
    "Pure mulberry silk",
    "Handwoven zari border",
    "Includes blouse piece"
  ],
  "category": "665f1a2b3c4d5e6f7a8b9c0d",
  "images": [
    {
      "key": "products/uuid-front.jpg",
      "url": "https://nimmaaishwini.s3.ap-south-1.amazonaws.com/products/uuid-front.jpg",
      "alt": "Front view",
      "sortOrder": 0
    },
    {
      "key": "products/uuid-back.jpg",
      "url": "https://nimmaaishwini.s3.ap-south-1.amazonaws.com/products/uuid-back.jpg",
      "alt": "Back view",
      "sortOrder": 1
    }
  ],
  "price": 12999,
  "sizes": [
    {
      "label": "Free Size",
      "value": "FS",
      "price": null,
      "stock": 25
    },
    {
      "label": "Custom Stitch",
      "value": "CS",
      "price": 1500,
      "stock": 10
    }
  ],
  "maxQuantityPerOrder": 2,
  "stock": 35,
  "suitability": [
    {
      "heading": "Occasion",
      "description": "Weddings, festivals, and formal events"
    },
    {
      "heading": "Fabric care",
      "description": "Dry clean only"
    }
  ],
  "benefits": [
    {
      "heading": "Breathable fabric",
      "description": "Natural silk keeps you comfortable all day"
    },
    {
      "heading": "Long-lasting zari",
      "description": "Premium zari work that retains shine"
    }
  ],
  "specifications": [
    {
      "heading": "Fabric",
      "description": "100% pure silk"
    },
    {
      "heading": "Length",
      "description": "5.5 meters"
    },
    {
      "heading": "Blouse",
      "description": "0.8 meters included"
    }
  ],
  "isActive": true
}
```

### Product field reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Product name |
| `tagline` | No | string | Short tagline under the name |
| `description` | No | string | Full HTML/plain description |
| `highlights` | No | `string[]` | Bullet points |
| `category` | Yes | string | Category MongoDB `_id` |
| `images` | No | `Image[]` | Product gallery |
| `price` | Yes | number | Base price (INR or your currency) |
| `sizes` | No | `Size[]` | Size/variant options |
| `maxQuantityPerOrder` | No | number | Default: `1` |
| `stock` | No | number | Total available stock |
| `suitability` | No | `HeadingDescription[]` | Who/what it's suitable for |
| `benefits` | No | `HeadingDescription[]` | Product benefits |
| `specifications` | No | `HeadingDescription[]` | Technical specs |
| `isActive` | No | boolean | Default: `true` |

**Image object:**

```json
{
  "key": "products/uuid-file.jpg",
  "url": "https://...",
  "alt": "Optional alt text",
  "sortOrder": 0
}
```

**Size object:**

```json
{
  "label": "Medium",
  "value": "M",
  "price": 12999,
  "stock": 10
}
```

- `label` — display name shown to user
- `value` — internal code sent in cart/order
- `price` — optional override; `null` uses base `price`
- `stock` — stock for this variant

**Heading + description object** (used in `suitability`, `benefits`, `specifications`):

```json
{
  "heading": "Section title",
  "description": "Section content"
}
```

### Admin — Update product

**PUT** `/api/admin/products/{id}`

**Auth required:** Yes (admin)

Send only fields to update.

### Admin — Delete product

**DELETE** `/api/admin/products/{id}`

**Auth required:** Yes (admin)

### Product response object

```json
{
  "id": "665f1a2b3c4d5e6f7a8b9c0e",
  "name": "Kanjivaram Silk Saree",
  "slug": "kanjivaram-silk-saree",
  "tagline": "Traditional elegance redefined",
  "description": "Full product description...",
  "highlights": ["Pure mulberry silk"],
  "category": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "Silk Sarees",
    "slug": "silk-sarees"
  },
  "images": [],
  "price": 12999,
  "sizes": [],
  "maxQuantityPerOrder": 2,
  "stock": 35,
  "suitability": [],
  "benefits": [],
  "specifications": [],
  "isActive": true,
  "createdAt": "2026-07-01T10:00:00.000Z",
  "updatedAt": "2026-07-01T10:00:00.000Z"
}
```

---

## Health check

**GET** `/api/health`

**Auth required:** No

Use for monitoring and verifying API + database connectivity.

---

## Recommended admin panel flow

### 1. Bootstrap

```bash
npm run seed-admin   # creates first admin (run once)
npm run dev          # starts API on :3000
```

### 2. Login

`POST /api/auth/login` → save `data.token`

### 3. Create category

1. Upload category image → `folder: "categories"`
2. `POST /api/admin/categories` with image `{ key, url }`

### 4. Create product

1. Upload each product image → `folder: "products"`
2. `POST /api/admin/products` with `category` id and `images` array

### 5. Storefront (public)

- Home: `GET /api/categories`, `GET /api/products?limit=12`
- Category page: `GET /api/products?category=<id>`
- Product detail: `GET /api/products/<id>`

---

## HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation error / bad request |
| 401 | Missing or invalid token |
| 403 | Not admin |
| 404 | Resource not found |
| 409 | Duplicate (e.g. slug/name conflict) |
| 500 | Server error |

---

## CORS

CORS is enabled for all origins. Allowed headers:

- `Content-Type`
- `Authorization`

---

## Local setup (for frontend dev)

```bash
cp .env.example .env
# Set MONGODB_URI to your MongoDB Atlas connection string, e.g.:
# mongodb+srv://<user>:<password>@navidb.ztfmuah.mongodb.net/nimmaaishwini

npm install
npm run seed-admin
npm run dev
```

Default admin credentials (change in production):

- Email: `admin@nimmaaishwini.com`
- Password: `Admin@123456`

---

## Notes for frontend

1. **Always upload images first**, then pass `key` + `url` when creating/updating category or product.
2. **Category ID** is required when creating a product — fetch categories before showing the product form.
3. **Public product list** hides inactive products; use admin endpoints for draft/inactive management.
4. **Token expiry** defaults to 24h (`JWT_EXPIRES_IN`). Redirect to login on 401.
5. **Slug** is auto-generated from `name` — use `slug` for SEO-friendly URLs if needed.
6. **Price** is a number (no currency symbol in API) — format on the frontend.

---

## Contact

For API issues or new endpoints, coordinate with the backend team before building UI that depends on unimplemented fields.
