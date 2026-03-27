"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductImageAtIndex = exports.updateProductImageAtIndex = exports.getFeaturedProducts = exports.getTrendingProducts = exports.deleteProduct = exports.updateProduct = exports.bulkCreateProducts = exports.uploadProductImage = exports.createProduct = exports.getProductBySlug = exports.getAllProducts = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const appError_1 = __importDefault(require("../utils/appError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const helpers_1 = require("../utils/helpers");
const imageUtils_1 = require("../utils/imageUtils");
// Get all products with pagination and filters
exports.getAllProducts = (0, catchAsync_1.default)(async (req, res) => {
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req);
    const filters = {};
    // Apply filters if provided
    if (req.query.categorySlug) {
        filters.categorySlug = req.query.categorySlug;
    }
    if (req.query.trending) {
        filters.trending = req.query.trending === "true";
    }
    if (req.query.isFeatured) {
        filters.isFeatured = req.query.isFeatured === "true";
    }
    if (req.query.inStock) {
        filters.inStock = req.query.inStock === "true";
    }
    if (req.query.search) {
        filters.OR = [
            { name: { contains: req.query.search, mode: "insensitive" } },
            {
                description: {
                    contains: req.query.search,
                    mode: "insensitive",
                },
            },
        ];
    }
    const [products, total] = await Promise.all([
        prisma_1.default.product.findMany({
            where: filters,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                category: {
                    select: {
                        name: true,
                        slug: true,
                    },
                },
            },
        }),
        prisma_1.default.product.count({ where: filters }),
    ]);
    // Parse JSON arrays
    const formattedProducts = products.map((product) => ({
        ...product,
        images: (0, helpers_1.parseJsonArray)(product.images),
        materials: (0, helpers_1.parseJsonArray)(product.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(product.keyFeatures),
        price: product.price ? parseFloat(product.price.toString()) : undefined,
    }));
    res.status(200).json({
        status: "success",
        results: products.length,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
        data: formattedProducts,
    });
});
// Get single product by slug
exports.getProductBySlug = (0, catchAsync_1.default)(async (req, res, next) => {
    const product = await prisma_1.default.product.findUnique({
        where: { slug: req.params.slug },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: true,
                },
            },
        },
    });
    if (!product) {
        return next(new appError_1.default("Product not found", 404));
    }
    const formattedProduct = {
        ...product,
        images: (0, helpers_1.parseJsonArray)(product.images),
        materials: (0, helpers_1.parseJsonArray)(product.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(product.keyFeatures),
        price: product.price ? parseFloat(product.price.toString()) : undefined,
    };
    res.status(200).json({
        status: "success",
        data: formattedProduct,
    });
});
// Create single product
exports.createProduct = (0, catchAsync_1.default)(async (req, res, next) => {
    const productData = req.body;
    // Check if category exists
    const category = await prisma_1.default.category.findUnique({
        where: { id: productData.categoryId },
    });
    if (!category) {
        return next(new appError_1.default("Category not found", 404));
    }
    // Check if slug already exists
    const existingProduct = await prisma_1.default.product.findUnique({
        where: { slug: productData.slug },
    });
    if (existingProduct) {
        return next(new appError_1.default("Product with this slug already exists", 400));
    }
    const product = await prisma_1.default.product.create({
        data: {
            ...productData,
            images: (0, helpers_1.stringifyJsonArray)(productData.images),
            materials: (0, helpers_1.stringifyJsonArray)(productData.materials),
            keyFeatures: (0, helpers_1.stringifyJsonArray)(productData.keyFeatures),
        },
        include: {
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
    });
    const formattedProduct = {
        ...product,
        images: (0, helpers_1.parseJsonArray)(product.images),
        materials: (0, helpers_1.parseJsonArray)(product.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(product.keyFeatures),
        price: product.price ? parseFloat(product.price.toString()) : undefined,
    };
    res.status(201).json({
        status: "success",
        data: formattedProduct,
    });
});
exports.uploadProductImage = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.file) {
        return next(new appError_1.default("Please upload an image file", 400));
    }
    const product = await prisma_1.default.product.findUnique({
        where: { slug: req.params.slug },
        include: { category: true },
    });
    if (!product) {
        return next(new appError_1.default("Product not found", 404));
    }
    const fileUrl = (0, imageUtils_1.buildProductImageUrl)(product.category.slug, req.file.filename);
    const existingImages = (0, helpers_1.parseJsonArray)(product.images);
    const updatedImages = [...existingImages, fileUrl];
    const updatedProduct = await prisma_1.default.product.update({
        where: { slug: req.params.slug },
        data: {
            images: (0, helpers_1.stringifyJsonArray)(updatedImages),
        },
        include: {
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
    });
    const formattedProduct = {
        ...updatedProduct,
        images: (0, helpers_1.parseJsonArray)(updatedProduct.images),
        materials: (0, helpers_1.parseJsonArray)(updatedProduct.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(updatedProduct.keyFeatures),
        price: updatedProduct.price
            ? parseFloat(updatedProduct.price.toString())
            : undefined,
    };
    res.status(200).json({
        status: "success",
        message: "Image uploaded successfully",
        data: formattedProduct,
    });
});
// Bulk create products
exports.bulkCreateProducts = (0, catchAsync_1.default)(async (req, res, next) => {
    const { products } = req.body;
    // Validate all categories exist
    const categoryIds = [...new Set(products.map((p) => p.categoryId))];
    const categories = await prisma_1.default.category.findMany({
        where: { id: { in: categoryIds } },
    });
    if (categories.length !== categoryIds.length) {
        return next(new appError_1.default("One or more categories not found", 404));
    }
    // Check for duplicate slugs
    const slugs = products.map((p) => p.slug);
    const existingProducts = await prisma_1.default.product.findMany({
        where: { slug: { in: slugs } },
    });
    if (existingProducts.length > 0) {
        return next(new appError_1.default("Some products with these slugs already exist", 400));
    }
    const productsData = products.map((product) => ({
        ...product,
        images: (0, helpers_1.stringifyJsonArray)(product.images),
        materials: (0, helpers_1.stringifyJsonArray)(product.materials),
        keyFeatures: (0, helpers_1.stringifyJsonArray)(product.keyFeatures),
    }));
    const createdProducts = await prisma_1.default.product.createMany({
        data: productsData,
        skipDuplicates: true,
    });
    res.status(201).json({
        status: "success",
        message: `${createdProducts.count} products created successfully`,
    });
});
// Update product
exports.updateProduct = (0, catchAsync_1.default)(async (req, res, next) => {
    const updateData = req.body;
    // If categoryId is being updated, check if it exists
    if (updateData.categoryId) {
        const category = await prisma_1.default.category.findUnique({
            where: { id: updateData.categoryId },
        });
        if (!category) {
            return next(new appError_1.default("Category not found", 404));
        }
    }
    // If slug is being updated, check if it's not already taken
    if (updateData.slug && updateData.slug !== req.params.slug) {
        const existingProduct = await prisma_1.default.product.findUnique({
            where: { slug: updateData.slug },
        });
        if (existingProduct) {
            return next(new appError_1.default("Product with this slug already exists", 400));
        }
    }
    const updatedData = { ...updateData };
    // Stringify JSON arrays if they exist
    if (updateData.images) {
        updatedData.images = (0, helpers_1.stringifyJsonArray)(updateData.images);
    }
    if (updateData.materials) {
        updatedData.materials = (0, helpers_1.stringifyJsonArray)(updateData.materials);
    }
    if (updateData.keyFeatures) {
        updatedData.keyFeatures = (0, helpers_1.stringifyJsonArray)(updateData.keyFeatures);
    }
    const product = await prisma_1.default.product.update({
        where: { slug: req.params.slug },
        data: updatedData,
        include: {
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
    });
    const formattedProduct = {
        ...product,
        images: (0, helpers_1.parseJsonArray)(product.images),
        materials: (0, helpers_1.parseJsonArray)(product.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(product.keyFeatures),
        price: product.price ? parseFloat(product.price.toString()) : undefined,
    };
    res.status(200).json({
        status: "success",
        data: formattedProduct,
    });
});
// Delete product
exports.deleteProduct = (0, catchAsync_1.default)(async (req, res, next) => {
    const product = await prisma_1.default.product.findUnique({
        where: { slug: req.params.slug },
    });
    if (!product) {
        return next(new appError_1.default("Product not found", 404));
    }
    await prisma_1.default.product.delete({
        where: { slug: req.params.slug },
    });
    res.status(204).json({
        status: "success",
        data: null,
    });
});
// Get trending products
exports.getTrendingProducts = (0, catchAsync_1.default)(async (req, res) => {
    const products = await prisma_1.default.product.findMany({
        where: { trending: true, inStock: true },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
    });
    const formattedProducts = products.map((product) => ({
        ...product,
        images: (0, helpers_1.parseJsonArray)(product.images),
        materials: (0, helpers_1.parseJsonArray)(product.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(product.keyFeatures),
        price: product.price ? parseFloat(product.price.toString()) : undefined,
    }));
    res.status(200).json({
        status: "success",
        results: products.length,
        data: formattedProducts,
    });
});
// Get featured products
exports.getFeaturedProducts = (0, catchAsync_1.default)(async (req, res) => {
    const products = await prisma_1.default.product.findMany({
        where: { isFeatured: true, inStock: true },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
    });
    const formattedProducts = products.map((product) => ({
        ...product,
        images: (0, helpers_1.parseJsonArray)(product.images),
        materials: (0, helpers_1.parseJsonArray)(product.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(product.keyFeatures),
        price: product.price ? parseFloat(product.price.toString()) : undefined,
    }));
    res.status(200).json({
        status: "success",
        results: products.length,
        data: formattedProducts,
    });
});
exports.updateProductImageAtIndex = (0, catchAsync_1.default)(async (req, res, next) => {
    const { slug, index } = req.params;
    const imageIndex = parseInt(index);
    if (isNaN(imageIndex)) {
        return next(new appError_1.default("Invalid image index", 400));
    }
    if (!req.file) {
        return next(new appError_1.default("Please upload an image file", 400));
    }
    const product = await prisma_1.default.product.findUnique({
        where: { slug },
        include: { category: true },
    });
    if (!product) {
        return next(new appError_1.default("Product not found", 404));
    }
    const currentImages = (0, helpers_1.parseJsonArray)(product.images);
    if (imageIndex < 0 || imageIndex >= currentImages.length) {
        return next(new appError_1.default("Image index out of bounds", 400));
    }
    const oldImageUrl = currentImages[imageIndex];
    (0, imageUtils_1.deleteImageFile)(oldImageUrl);
    const fileUrl = (0, imageUtils_1.buildProductImageUrl)(product.category.slug, req.file.filename);
    currentImages[imageIndex] = fileUrl;
    const updatedProduct = await prisma_1.default.product.update({
        where: { slug },
        data: {
            images: (0, helpers_1.stringifyJsonArray)(currentImages),
        },
        include: {
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
    });
    const formattedProduct = {
        ...updatedProduct,
        images: (0, helpers_1.parseJsonArray)(updatedProduct.images),
        materials: (0, helpers_1.parseJsonArray)(updatedProduct.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(updatedProduct.keyFeatures),
        price: updatedProduct.price
            ? parseFloat(updatedProduct.price.toString())
            : undefined,
    };
    res.status(200).json({
        status: "success",
        message: "Image updated successfully",
        data: formattedProduct,
    });
});
exports.deleteProductImageAtIndex = (0, catchAsync_1.default)(async (req, res, next) => {
    const { slug, index } = req.params;
    const imageIndex = parseInt(index);
    if (isNaN(imageIndex)) {
        return next(new appError_1.default("Invalid image index", 400));
    }
    const product = await prisma_1.default.product.findUnique({
        where: { slug },
    });
    if (!product) {
        return next(new appError_1.default("Product not found", 404));
    }
    const currentImages = (0, helpers_1.parseJsonArray)(product.images);
    if (imageIndex < 0 || imageIndex >= currentImages.length) {
        return next(new appError_1.default("Image index out of bounds", 400));
    }
    const deletedImageUrl = currentImages[imageIndex];
    (0, imageUtils_1.deleteImageFile)(deletedImageUrl);
    currentImages.splice(imageIndex, 1);
    const updatedProduct = await prisma_1.default.product.update({
        where: { slug },
        data: {
            images: (0, helpers_1.stringifyJsonArray)(currentImages),
        },
        include: {
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
    });
    const formattedProduct = {
        ...updatedProduct,
        images: (0, helpers_1.parseJsonArray)(updatedProduct.images),
        materials: (0, helpers_1.parseJsonArray)(updatedProduct.materials),
        keyFeatures: (0, helpers_1.parseJsonArray)(updatedProduct.keyFeatures),
        price: updatedProduct.price
            ? parseFloat(updatedProduct.price.toString())
            : undefined,
    };
    res.status(200).json({
        status: "success",
        message: "Image deleted successfully",
        data: formattedProduct,
    });
});
//# sourceMappingURL=product.controller.js.map