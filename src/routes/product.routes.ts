import express from 'express';
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
  getTrendingProducts,
  getFeaturedProducts,
  uploadProductImage,
  updateProductImageAtIndex,
  deleteProductImageAtIndex,
} from '../controllers/product.controller';
import { protect, restrictTo } from '../controllers/auth.controller';
import { uploadSingle } from '../config/upload';
import prisma from '../utils/prisma';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/trending', getTrendingProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:slug', getProductBySlug);

router.patch('/:slug/image', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true }
    });
    if (product) {
      req.productUploadInfo = {
        productSlug: product.slug,
        categorySlug: product.category.slug,
        imageIndex: undefined
      };
    }
  } catch {}
  next();
}, uploadSingle('file'), uploadProductImage);

router.patch('/:slug/images/:index', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true }
    });
    if (product) {
      req.productUploadInfo = {
        productSlug: product.slug,
        categorySlug: product.category.slug,
        imageIndex: parseInt(req.params.index)
      };
    }
  } catch {}
  next();
}, uploadSingle('file'), updateProductImageAtIndex);

router.delete('/:slug/images/:index', protect, restrictTo('ADMIN'), deleteProductImageAtIndex);

router.use(protect);
router.use(restrictTo('ADMIN'));

router.post('/', createProduct);
router.post('/bulk', bulkCreateProducts);
router.patch('/:slug', updateProduct);
router.delete('/:slug', deleteProduct);

export default router;