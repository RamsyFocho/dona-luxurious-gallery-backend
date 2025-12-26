 API Endpoints Summary
Authentication
POST /api/auth/login - Login user

GET /api/auth/me - Get current user

Products (Public)
GET /api/products - Get all products with pagination & filters

GET /api/products/trending - Get trending products

GET /api/products/featured - Get featured products

GET /api/products/:slug - Get single product by slug

Products (Admin Only)
POST /api/products - Create single product

POST /api/products/bulk - Create multiple products

PATCH /api/products/:slug - Update product

DELETE /api/products/:slug - Delete product

Categories (Public)
GET /api/categories - Get all categories

GET /api/categories/:slug - Get category with products

Categories (Admin Only)
POST /api/categories - Create single category

POST /api/categories/bulk - Create multiple categories

PATCH /api/categories/:slug - Update category

DELETE /api/categories/:slug - Delete category

File Upload (Admin Only)
POST /api/upload/single - Upload single file

POST /api/upload/multiple - Upload multiple files

DELETE /api/upload - Delete file

Key Features Implemented:
Full CRUD Operations for products and categories

Bulk Operations for importing multiple products/categories

Image Management with proper file storage

Authentication & Authorization with JWT

Pagination & Filtering for all listings

SEO Optimization fields in schema

Error Handling with proper error responses

Security Features (CORS, Helmet, Rate Limiting)

TypeScript Support with proper type definitions

Database Relationships using Prisma ORM