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
} from '../controllers/product.controller';
import { protect, restrictTo } from '../controllers/auth.controller';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/trending', getTrendingProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:slug', getProductBySlug);

// Protected admin routes
router.use(protect);
router.use(restrictTo('ADMIN'));

router.post('/', createProduct);
router.post('/bulk', bulkCreateProducts);
router.patch('/:slug', updateProduct);
router.delete('/:slug', deleteProduct);

export default router;