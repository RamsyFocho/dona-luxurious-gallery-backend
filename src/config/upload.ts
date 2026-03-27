import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  ensureCategoryFolderExists,
  generateProductImageName,
  extractRelativePath
} from '../utils/imageUtils';

interface ProductUploadInfo {
  productSlug?: string;
  categorySlug?: string;
  imageIndex?: number;
}

declare global {
  namespace Express {
    interface Request {
      productUploadInfo?: ProductUploadInfo;
    }
  }
}

const createUploadDirs = () => {
  const dirs = [
    './uploads',
    './uploads/products',
    './uploads/categories',
    './uploads/temp',
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = './uploads/temp';
    
    if (req.baseUrl.includes('products')) {
      const categorySlug = req.productUploadInfo?.categorySlug || 'uncategorized';
      uploadPath = `./uploads/products/${categorySlug}`;
      ensureCategoryFolderExists(categorySlug);
    } else if (req.baseUrl.includes('categories')) {
      uploadPath = './uploads/categories';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (req.productUploadInfo?.productSlug && req.productUploadInfo?.categorySlug) {
      const generatedName = generateProductImageName({
        productName: '',
        productSlug: req.productUploadInfo.productSlug,
        categorySlug: req.productUploadInfo.categorySlug,
        index: req.productUploadInfo.imageIndex,
      });
      cb(null, generatedName + ext);
    } else {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const baseName = path.basename(file.originalname, ext);
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Upload configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});

// Single file upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => 
  upload.array(fieldName, maxCount);