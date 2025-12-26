import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

export const uploadSingleFile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const fileUrl = `${baseUrl}/uploads/${req.file.path.split('uploads/')[1]}`;

  res.status(200).json({
    status: 'success',
    message: 'File uploaded successfully',
    data: {
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    },
  });
});

export const uploadMultipleFiles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return next(new AppError('Please upload files', 400));
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const files = (req.files as Express.Multer.File[]).map(file => ({
    url: `${baseUrl}/uploads/${file.path.split('uploads/')[1]}`,
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
  }));

  res.status(200).json({
    status: 'success',
    message: 'Files uploaded successfully',
    data: files,
  });
});

export const deleteFile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { filepath } = req.body;

  if (!filepath) {
    return next(new AppError('Please provide file path', 400));
  }

  // Remove base URL if present
  const relativePath = filepath.replace(`${process.env.BASE_URL}/`, '');
  const fullPath = path.join(__dirname, '..', '..', relativePath);

  if (!fs.existsSync(fullPath)) {
    return next(new AppError('File not found', 404));
  }

  fs.unlinkSync(fullPath);

  res.status(200).json({
    status: 'success',
    message: 'File deleted successfully',
  });
});