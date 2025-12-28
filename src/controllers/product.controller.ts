import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { ICreateProduct, IUpdateProduct, IBulkCreateProduct } from "../types";
import {
  getPaginationParams,
  stringifyJsonArray,
  parseJsonArray,
} from "../utils/helpers";
import path from "path";

// Get all products with pagination and filters
export const getAllProducts = catchAsync(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPaginationParams(req);

    const filters: any = {};

    // Apply filters if provided
    if (req.query.categorySlug) {
      filters.categorySlug = req.query.categorySlug as string;
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
        { name: { contains: req.query.search as string, mode: "insensitive" } },
        {
          description: {
            contains: req.query.search as string,
            mode: "insensitive",
          },
        },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
      prisma.product.count({ where: filters }),
    ]);

    // Parse JSON arrays
    const formattedProducts = products.map((product) => ({
      ...product,
      images: parseJsonArray(product.images),
      materials: parseJsonArray(product.materials),
      keyFeatures: parseJsonArray(product.keyFeatures),
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
  }
);

// Get single product by slug
export const getProductBySlug = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await prisma.product.findUnique({
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
      return next(new AppError("Product not found", 404));
    }

    const formattedProduct = {
      ...product,
      images: parseJsonArray(product.images),
      materials: parseJsonArray(product.materials),
      keyFeatures: parseJsonArray(product.keyFeatures),
      price: product.price ? parseFloat(product.price.toString()) : undefined,
    };

    res.status(200).json({
      status: "success",
      data: formattedProduct,
    });
  }
);

// Create single product
export const createProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productData: ICreateProduct = req.body;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.categoryId },
    });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (existingProduct) {
      return next(new AppError("Product with this slug already exists", 400));
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        images: stringifyJsonArray(productData.images),
        materials: stringifyJsonArray(productData.materials),
        keyFeatures: stringifyJsonArray(productData.keyFeatures),
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
      images: parseJsonArray(product.images),
      materials: parseJsonArray(product.materials),
      keyFeatures: parseJsonArray(product.keyFeatures),
      price: product.price ? parseFloat(product.price.toString()) : undefined,
    };

    res.status(201).json({
      status: "success",
      data: formattedProduct,
    });
  }
);
// Add this function to your product controller
export const uploadProductImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(
      "--------uploading product from the patch product/:slug/image endpoint ---------------"
    );
    if (!req.file) {
      return next(new AppError("Please upload an image file", 400));
    }

    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    // Fix the path construction
    // Get the relative path from the uploads directory
    const uploadsDir = path.resolve("uploads");
    const filePath = path.resolve(req.file.path);

    // Get relative path from uploads directory
    const relativePath = path.relative(uploadsDir, filePath);
    const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, "/")}`;
    // const fileUrl = `${baseUrl}/uploads/${req.file.path.split('uploads/')[1]}`;

    // Parse existing images
    const existingImages = parseJsonArray(product.images);
    const updatedImages = [...existingImages, fileUrl];

    // Update product with new image
    const updatedProduct = await prisma.product.update({
      where: { slug: req.params.slug },
      data: {
        images: stringifyJsonArray(updatedImages),
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
      images: parseJsonArray(updatedProduct.images),
      materials: parseJsonArray(updatedProduct.materials),
      keyFeatures: parseJsonArray(updatedProduct.keyFeatures),
      price: updatedProduct.price
        ? parseFloat(updatedProduct.price.toString())
        : undefined,
    };

    res.status(200).json({
      status: "success",
      data: formattedProduct,
    });
  }
);
// Bulk create products
export const bulkCreateProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { products }: IBulkCreateProduct = req.body;

    // Validate all categories exist
    const categoryIds = [...new Set(products.map((p) => p.categoryId))];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      return next(new AppError("One or more categories not found", 404));
    }

    // Check for duplicate slugs
    const slugs = products.map((p) => p.slug);
    const existingProducts = await prisma.product.findMany({
      where: { slug: { in: slugs } },
    });

    if (existingProducts.length > 0) {
      return next(
        new AppError("Some products with these slugs already exist", 400)
      );
    }

    const productsData = products.map((product) => ({
      ...product,
      images: stringifyJsonArray(product.images),
      materials: stringifyJsonArray(product.materials),
      keyFeatures: stringifyJsonArray(product.keyFeatures),
    }));

    const createdProducts = await prisma.product.createMany({
      data: productsData,
      skipDuplicates: true,
    });

    res.status(201).json({
      status: "success",
      message: `${createdProducts.count} products created successfully`,
    });
  }
);

// Update product
export const updateProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const updateData: IUpdateProduct = req.body;

    // If categoryId is being updated, check if it exists
    if (updateData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });

      if (!category) {
        return next(new AppError("Category not found", 404));
      }
    }

    // If slug is being updated, check if it's not already taken
    if (updateData.slug && updateData.slug !== req.params.slug) {
      const existingProduct = await prisma.product.findUnique({
        where: { slug: updateData.slug },
      });

      if (existingProduct) {
        return next(new AppError("Product with this slug already exists", 400));
      }
    }

    const updatedData: any = { ...updateData };

    // Stringify JSON arrays if they exist
    if (updateData.images) {
      updatedData.images = stringifyJsonArray(updateData.images);
    }

    if (updateData.materials) {
      updatedData.materials = stringifyJsonArray(updateData.materials);
    }

    if (updateData.keyFeatures) {
      updatedData.keyFeatures = stringifyJsonArray(updateData.keyFeatures);
    }

    const product = await prisma.product.update({
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
      images: parseJsonArray(product.images),
      materials: parseJsonArray(product.materials),
      keyFeatures: parseJsonArray(product.keyFeatures),
      price: product.price ? parseFloat(product.price.toString()) : undefined,
    };

    res.status(200).json({
      status: "success",
      data: formattedProduct,
    });
  }
);

// Delete product
export const deleteProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    await prisma.product.delete({
      where: { slug: req.params.slug },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

// Get trending products
export const getTrendingProducts = catchAsync(
  async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
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
      images: parseJsonArray(product.images),
      materials: parseJsonArray(product.materials),
      keyFeatures: parseJsonArray(product.keyFeatures),
      price: product.price ? parseFloat(product.price.toString()) : undefined,
    }));

    res.status(200).json({
      status: "success",
      results: products.length,
      data: formattedProducts,
    });
  }
);

// Get featured products
export const getFeaturedProducts = catchAsync(
  async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
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
      images: parseJsonArray(product.images),
      materials: parseJsonArray(product.materials),
      keyFeatures: parseJsonArray(product.keyFeatures),
      price: product.price ? parseFloat(product.price.toString()) : undefined,
    }));

    res.status(200).json({
      status: "success",
      results: products.length,
      data: formattedProducts,
    });
  }
);
