import express from 'express';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
} from '../controllers/upload.controller';
import { uploadSingle, uploadMultiple } from '../config/upload';
import { protect, restrictTo } from '../controllers/auth.controller';

const router = express.Router();

// Protected admin routes
router.use(protect);
router.use(restrictTo('ADMIN'));

// Upload routes
router.post('/single', uploadSingle('file'), uploadSingleFile);
router.post('/multiple', uploadMultiple('files', 10), uploadMultipleFiles);
router.delete('/', deleteFile);

export default router;