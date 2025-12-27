"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadMultipleFiles = exports.uploadSingleFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const appError_1 = __importDefault(require("../utils/appError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
exports.uploadSingleFile = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.file) {
        return next(new appError_1.default('Please upload a file', 400));
    }
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    // Get the relative path from the uploads directory
    const uploadsDir = path_1.default.resolve('uploads');
    const filePath = path_1.default.resolve(req.file.path);
    // Get relative path from uploads directory
    const relativePath = path_1.default.relative(uploadsDir, filePath);
    const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
    // const fileUrl = `${baseUrl}/uploads/${req.file.path.split('uploads/')[1]}`;
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
exports.uploadMultipleFiles = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next(new appError_1.default('Please upload files', 400));
    }
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    // const files = (req.files as Express.Multer.File[]).map(file => ({
    //   url: `${baseUrl}/uploads/${file.path.split('uploads/')[1]}`,
    //   filename: file.filename,
    //   originalname: file.originalname,
    //   mimetype: file.mimetype,
    //   size: file.size,
    //   path: file.path,
    // }));
    const files = req.files.map(file => {
        const relativePath = file.path.replace(/^.*uploads[\\/]/, 'uploads/').replace(/\\/g, '/');
        const fileUrl = `${baseUrl}/${relativePath}`;
        return {
            url: fileUrl,
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
        };
    });
    res.status(200).json({
        status: 'success',
        message: 'Files uploaded successfully',
        data: files,
    });
});
exports.deleteFile = (0, catchAsync_1.default)(async (req, res, next) => {
    const { filepath } = req.body;
    if (!filepath) {
        return next(new appError_1.default('Please provide file path', 400));
    }
    // Remove base URL if present
    const relativePath = filepath.replace(`${process.env.BASE_URL}/`, '');
    const fullPath = path_1.default.join(__dirname, '..', '..', relativePath);
    if (!fs_1.default.existsSync(fullPath)) {
        return next(new appError_1.default('File not found', 404));
    }
    fs_1.default.unlinkSync(fullPath);
    res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
    });
});
//# sourceMappingURL=upload.controller.js.map