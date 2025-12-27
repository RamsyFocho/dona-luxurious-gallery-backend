"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.bulkCreateCategories = exports.createCategory = exports.getCategoryBySlug = exports.getAllCategories = void 0;
const client_1 = require("@prisma/client");
const appError_1 = __importDefault(require("../utils/appError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const helpers_1 = require("../utils/helpers");
const prisma = new client_1.PrismaClient();
// Get all categories
exports.getAllCategories = (0, catchAsync_1.default)(async (req, res) => {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
    });
    res.status(200).json({
        status: 'success',
        results: categories.length,
        data: categories,
    });
});
// Get category by slug with products
exports.getCategoryBySlug = (0, catchAsync_1.default)(async (req, res, next) => {
    const { page, limit, skip } = (0, helpers_1.getPaginationParams)(req);
    const [category, products, totalProducts] = await Promise.all([
        prisma.category.findUnique({
            where: { slug: req.params.slug, isActive: true },
        }),
        prisma.product.findMany({
            where: { categorySlug: req.params.slug, inStock: true },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({
            where: { categorySlug: req.params.slug, inStock: true },
        }),
    ]);
    if (!category) {
        return next(new appError_1.default('Category not found', 404));
    }
    // Parse JSON arrays for products
    const formattedProducts = products.map(product => ({
        ...product,
        images: JSON.parse(product.images),
        materials: JSON.parse(product.materials),
        keyFeatures: JSON.parse(product.keyFeatures),
        price: product.price ? parseFloat(product.price.toString()) : undefined,
    }));
    res.status(200).json({
        status: 'success',
        data: {
            category,
            products: formattedProducts,
            pagination: {
                page,
                limit,
                total: totalProducts,
                pages: Math.ceil(totalProducts / limit),
            },
        },
    });
});
// Create single category
exports.createCategory = (0, catchAsync_1.default)(async (req, res, next) => {
    const categoryData = req.body;
    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
        where: { slug: categoryData.slug },
    });
    if (existingCategory) {
        return next(new appError_1.default('Category with this slug already exists', 400));
    }
    const category = await prisma.category.create({
        data: categoryData,
    });
    res.status(201).json({
        status: 'success',
        data: category,
    });
});
// Bulk create categories
exports.bulkCreateCategories = (0, catchAsync_1.default)(async (req, res, next) => {
    const { categories } = req.body;
    // Check for duplicate slugs
    const slugs = categories.map(c => c.slug);
    const existingCategories = await prisma.category.findMany({
        where: { slug: { in: slugs } },
    });
    if (existingCategories.length > 0) {
        return next(new appError_1.default('Some categories with these slugs already exist', 400));
    }
    const createdCategories = await prisma.category.createMany({
        data: categories,
        skipDuplicates: true,
    });
    res.status(201).json({
        status: 'success',
        message: `${createdCategories.count} categories created successfully`,
    });
});
// Update category
exports.updateCategory = (0, catchAsync_1.default)(async (req, res, next) => {
    const updateData = req.body;
    // If slug is being updated, check if it's not already taken
    if (updateData.slug && updateData.slug !== req.params.slug) {
        const existingCategory = await prisma.category.findUnique({
            where: { slug: updateData.slug },
        });
        if (existingCategory) {
            return next(new appError_1.default('Category with this slug already exists', 400));
        }
    }
    const category = await prisma.category.update({
        where: { slug: req.params.slug },
        data: updateData,
    });
    res.status(200).json({
        status: 'success',
        data: category,
    });
});
// Delete category (soft delete)
exports.deleteCategory = (0, catchAsync_1.default)(async (req, res, next) => {
    const category = await prisma.category.findUnique({
        where: { slug: req.params.slug },
    });
    if (!category) {
        return next(new appError_1.default('Category not found', 404));
    }
    // Check if category has products
    const productCount = await prisma.product.count({
        where: { categorySlug: req.params.slug },
    });
    if (productCount > 0) {
        return next(new appError_1.default('Cannot delete category with existing products', 400));
    }
    await prisma.category.delete({
        where: { slug: req.params.slug },
    });
    res.status(204).json({
        status: 'success',
        data: null,
    });
});
//# sourceMappingURL=category.controller.js.map