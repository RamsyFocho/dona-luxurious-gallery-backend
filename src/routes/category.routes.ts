import express from 'express';
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkCreateCategories,
} from '../controllers/category.controller';
import { protect, restrictTo } from '../controllers/auth.controller';

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Protected admin routes
router.use(protect);
router.use(restrictTo('ADMIN'));

router.post('/', createCategory);
router.post('/bulk', bulkCreateCategories);
router.patch('/:slug', updateCategory);
router.delete('/:slug', deleteCategory);

export default router;