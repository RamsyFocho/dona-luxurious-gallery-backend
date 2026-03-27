"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRelativePath = exports.buildProductImageUrl = exports.parseImageUrl = exports.deleteProductImages = exports.deleteImageFile = exports.ensureCategoryFolderExists = exports.getCategoryUploadPath = exports.generateProductImageName = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const generateProductImageName = (options) => {
    const { productSlug, categorySlug, index } = options;
    const timestamp = Date.now();
    const indexSuffix = index !== undefined ? `-${index}` : "";
    return `${productSlug}-${categorySlug}${indexSuffix}-${timestamp}`;
};
exports.generateProductImageName = generateProductImageName;
const getCategoryUploadPath = (categorySlug) => {
    return `./uploads/products/${categorySlug}`;
};
exports.getCategoryUploadPath = getCategoryUploadPath;
const ensureCategoryFolderExists = (categorySlug) => {
    const folderPath = (0, exports.getCategoryUploadPath)(categorySlug);
    if (!fs_1.default.existsSync(folderPath)) {
        fs_1.default.mkdirSync(folderPath, { recursive: true });
    }
};
exports.ensureCategoryFolderExists = ensureCategoryFolderExists;
const deleteImageFile = (imageUrl) => {
    try {
        const baseUrl = process.env.BASE_URL || "";
        let relativePath = imageUrl;
        if (baseUrl && imageUrl.startsWith(baseUrl)) {
            relativePath = imageUrl.replace(baseUrl, "");
        }
        relativePath = relativePath.replace(/^\/+/, "");
        const fullPath = path_1.default.resolve(relativePath);
        if (fs_1.default.existsSync(fullPath)) {
            fs_1.default.unlinkSync(fullPath);
            return true;
        }
        return false;
    }
    catch (error) {
        console.error("Error deleting image file:", error);
        return false;
    }
};
exports.deleteImageFile = deleteImageFile;
const deleteProductImages = (images) => {
    let deleted = 0;
    let failed = 0;
    for (const imageUrl of images) {
        if ((0, exports.deleteImageFile)(imageUrl)) {
            deleted++;
        }
        else {
            failed++;
        }
    }
    return { deleted, failed };
};
exports.deleteProductImages = deleteProductImages;
const parseImageUrl = (imageUrl) => {
    try {
        const urlParts = imageUrl.split("/");
        const filename = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        return { folder, filename };
    }
    catch {
        return null;
    }
};
exports.parseImageUrl = parseImageUrl;
const buildProductImageUrl = (categorySlug, filename) => {
    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    return `${baseUrl}/uploads/products/${categorySlug}/${filename}`;
};
exports.buildProductImageUrl = buildProductImageUrl;
const extractRelativePath = (fullPath) => {
    return fullPath.replace(/^.*uploads[\\/]/, "uploads/").replace(/\\/g, "/");
};
exports.extractRelativePath = extractRelativePath;
//# sourceMappingURL=imageUtils.js.map