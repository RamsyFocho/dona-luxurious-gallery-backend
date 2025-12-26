import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import { ICreateCategory, IUpdateCategory, IBulkCreateCategory } from '../types';
import { getPaginationParams } from '../utils/helpers';

const prisma = new PrismaClient();

// Get all categories
export const getAllCategories = catchAsync(async (req: Request, res: Response) => {
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
export const getCategoryBySlug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, skip } = getPaginationParams(req);

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
    return next(new AppError('Category not found', 404));
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
export const createCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const categoryData: ICreateCategory = req.body;

  // Check if slug already exists
  const existingCategory = await prisma.category.findUnique({
    where: { slug: categoryData.slug },
  });

  if (existingCategory) {
    return next(new AppError('Category with this slug already exists', 400));
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
export const bulkCreateCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { categories }: IBulkCreateCategory = req.body;

  // Check for duplicate slugs
  const slugs = categories.map(c => c.slug);
  const existingCategories = await prisma.category.findMany({
    where: { slug: { in: slugs } },
  });

  if (existingCategories.length > 0) {
    return next(new AppError('Some categories with these slugs already exist', 400));
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
export const updateCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const updateData: IUpdateCategory = req.body;

  // If slug is being updated, check if it's not already taken
  if (updateData.slug && updateData.slug !== req.params.slug) {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: updateData.slug },
    });

    if (existingCategory) {
      return next(new AppError('Category with this slug already exists', 400));
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
export const deleteCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
  });

  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Check if category has products
  const productCount = await prisma.product.count({
    where: { categorySlug: req.params.slug },
  });

  if (productCount > 0) {
    return next(new AppError('Cannot delete category with existing products', 400));
  }

  await prisma.category.delete({
    where: { slug: req.params.slug },
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});