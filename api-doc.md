# API Documentation

This document describes the available endpoints, request/response formats, authentication requirements, and examples for the Dona Luxurious Gallery backend.

> NOTE: All protected routes require an Authorization header: `Authorization: Bearer <TOKEN>` and admin-only routes require the user to have the `ADMIN` role.

---

## Common response patterns ✅

- Success envelope (most endpoints):

```json
{
  "status": "success",
  "data": ...
}
```

- Paginated list:

```json
{
  "status": "success",
  "results": 10,
  "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 },
  "data": [ ... ]
}
```

- Error response:

```json
{
  "status": "error",
  "message": "Detailed error message"
}
```

---

## Authentication 🔐

### POST /api/auth/login

- Description: Authenticate user and return JWT.
- Access: Public
- Request (application/json):
  - body: { "email": string, "password": string }
- Success (200):

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jane Doe",
      "role": "USER|ADMIN",
      "isActive": true,
      "lastLogin": "2025-12-25T00:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-12-25T00:00:00.000Z"
    },
    "token": "eyJhbGci..."
  }
}
```

- Errors:
  - 400 if missing email/password
  - 401 if invalid credentials
  - 403 if account is deactivated

### GET /api/auth/me

- Description: Get current authenticated user's profile
- Access: Protected (Bearer token)
- Success (200):

```json
{
  "status": "success",
  "data": {
    "user": {
      /* same fields as login response */
    }
  }
}
```

---

## Products (Public) 🖼️

### GET /api/products

- Description: Get all products with pagination and filters
- Access: Public
- Query parameters:
  - page (number) - default: 1
  - limit (number) - default: 10
  - categorySlug (string) - filter by category slug
  - trending (boolean) - e.g. `true` or `false`
  - isFeatured (boolean)
  - inStock (boolean)
  - search (string) - searches name and description
- Success (200): paginated list (see Common response patterns)
- Product item shape:

```json
{
  "id": "uuid",
  "name": "Product Name",
  "slug": "product-name",
  "category": { "name": "Category name", "slug": "category-slug" },
  "description": "Short description",
  "longDescription": "Long description",
  "images": ["https://.../uploads/products/x.jpg"],
  "materials": ["wood", "metal"],
  "keyFeatures": ["handmade", "limited"],
  "trending": false,
  "isFeatured": true,
  "inStock": true,
  "price": 199.99,
  "metaDescription": "SEO text",
  "schemaType": "Product",
  "schemaDescription": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Example curl:

```bash
curl "http://localhost:5000/api/products?page=1&limit=10&search=vase"
```

### GET /api/products/trending

- Description: Get trending products (top 6)
- Access: Public
- Success (200): { status, results, data: [products] }

### GET /api/products/featured

- Description: Get featured products (top 6)
- Access: Public
- Success (200): { status, results, data: [products] }

### GET /api/products/:slug

- Description: Get single product by slug
- Access: Public
- Success (200): { status: 'success', data: { /_ product object _/ } }
- Errors: 404 if not found

---

## Products (Admin only) 🛠️

All endpoints below require `Authorization: Bearer <TOKEN>` and the user must be an `ADMIN`.

### POST /api/products

- Description: Create a new product
- Request (application/json): fields from ICreateProduct
  - Required: name, slug, categoryId, categorySlug, description, longDescription, images (array), materials (array), keyFeatures (array)
  - Optional: trending, isFeatured, inStock, price, metaDescription, schema fields
- Success (201): returns created product object
- Errors:
  - 400 if slug already exists
  - 404 if categoryId not found

Example body:

```json
{
  "name": "Elegant Vase",
  "slug": "elegant-vase",
  "categoryId": "uuid-of-category",
  "categorySlug": "vases",
  "description": "A beautiful vase",
  "longDescription": "Full description",
  "images": ["http://localhost:5000/uploads/products/vase.jpg"],
  "materials": ["glass"],
  "keyFeatures": ["hand-blown"],
  "price": 120.0
}
```

### POST /api/products/bulk

- Description: Create multiple products at once
- Request (application/json): { "products": [ ICreateProduct, ... ] }
- Success (201): { status: 'success', message: 'N products created successfully' }
- Errors: 400 if duplicate slugs or 404 if category ids missing

### PATCH /api/products/:slug

- Description: Partially update a product
- Request (application/json): any fields from IUpdateProduct
  - Note: if updating `categoryId`, the server verifies the category exists. If updating `slug`, server checks uniqueness.
  - Updating `images` requires sending the full `images` array (URLs). To _replace_ a single image in one request, use the dedicated image route below.
- Success (200): returns updated product
- Errors: 400 / 404 accordingly

### PATCH /api/products/:slug/image

- Description: Upload a single image and update the product's `images` field (prepend or replace as implemented).
- Access: Admin only (protected + ADMIN)
- Request: multipart/form-data with field `file` (use `uploadSingle('file')` middleware)
- Behavior: Saves file to `uploads/` and updates the product `images` JSON array. Returns updated product.
- Example curl:

```bash
curl -X PATCH "http://localhost:5000/api/products/elegant-vase/image" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@./vase-new.jpg"
```

### DELETE /api/products/:slug

- Description: Delete a product
- Access: Admin only
- Success: 204 No Content (no body)
- Errors: 404 if not found

---

## Categories 📂

### GET /api/categories

- Description: List all active categories
- Access: Public
- Success (200): { status, results, data: [categories] }

### GET /api/categories/:slug

- Description: Get category details and its products (paginated)
- Query: page, limit
- Success (200):

```json
{
  "status": "success",
  "data": {
    "category": {
      /* category object */
    },
    "products": [
      /* products */
    ],
    "pagination": { "page": 1, "limit": 10, "total": 8, "pages": 1 }
  }
}
```

### POST /api/categories (Admin)

- Create single category. Body: ICreateCategory
- Success (201): created category
- Errors: 400 if slug exists

### POST /api/categories/bulk (Admin)

- Create multiple categories. Body: { categories: [ICreateCategory, ...] }
- Success (201) message

### PATCH /api/categories/:slug (Admin)

- Update category fields
- Success (200): updated category

### DELETE /api/categories/:slug (Admin)

- Description: Delete category (only allowed if it has no products)
- Success: 204 No Content
- Errors: 400 if category has products, 404 if not found

---

## File upload & management 📁

### POST /api/upload/single (Admin)

- Description: Upload a single file (images only)
- Access: Admin only
- Request: multipart/form-data, field: `file` (image mime types only)
- Success (200):

```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "data": {
    "url": "http://localhost:5000/uploads/products/xxx.jpg",
    "filename": "xxx.jpg",
    "originalname": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 12345,
    "path": "uploads/products/xxx.jpg"
  }
}
```

### POST /api/upload/multiple (Admin)

- Field: `files` (array)
- Success (200): list of file metadata

### DELETE /api/upload (Admin)

- Description: Delete a file from the server
- Request (application/json): { "filepath": "<full-url-or-relative-path>" }
  - The server will remove the base URL if present and attempt to delete the file from disk.
- Success (200): { status: 'success', message: 'File deleted successfully' }
- Errors: 400 if missing `filepath`, 404 if file not found

**Security & safety notes:**

- The upload middleware restricts file types to images (`jpeg|jpg|png|gif|webp`) and enforces `MAX_FILE_SIZE`.
- On Windows, returned file URLs use forward slashes for compatibility in browsers.
- Deletion validates file exists before removal; ensure `filepath` is within your `uploads/` directory to avoid path-traversal risks.

---

## Errors & troubleshooting ⚠️

- 400 Bad Request: validation or missing fields
- 401 Unauthorized: missing/invalid token
- 403 Forbidden: insufficient role (e.g., non-ADMIN for admin routes)
- 404 Not Found: resource does not exist
- 500 Internal Server Error: unexpected errors

**Common pitfalls:**

- Ensure `JWT_SECRET` and `JWT_EXPIRES_IN` are set in your environment variables.
- `images`, `materials`, and `keyFeatures` are stored as JSON arrays in the DB — send/receive them as arrays in the API.
- If you need atomic upload+update, use `PATCH /api/products/:slug/image` which accepts form-data `file` and updates `images`.

---

If you'd like, I can: ✅

- Commit this refined `api-doc.md` to the repo, or
- Generate a Postman/Insomnia collection with example requests, or
- Add TypeScript OpenAPI (Swagger) annotations for automatic spec generation.

Tell me which you'd prefer and I'll proceed.
