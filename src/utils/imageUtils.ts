import fs from "fs";
import path from "path";

export interface ImageNamingOptions {
  productName: string;
  productSlug: string;
  categorySlug: string;
  index?: number;
}

export const generateProductImageName = (options: ImageNamingOptions): string => {
  const { productSlug, categorySlug, index } = options;
  const timestamp = Date.now();
  const indexSuffix = index !== undefined ? `-${index}` : "";
  return `${productSlug}-${categorySlug}${indexSuffix}-${timestamp}`;
};

export const getCategoryUploadPath = (categorySlug: string): string => {
  return `./uploads/products/${categorySlug}`;
};

export const ensureCategoryFolderExists = (categorySlug: string): void => {
  const folderPath = getCategoryUploadPath(categorySlug);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

export const deleteImageFile = (imageUrl: string): boolean => {
  try {
    const baseUrl = process.env.BASE_URL || "";
    let relativePath = imageUrl;
    
    if (baseUrl && imageUrl.startsWith(baseUrl)) {
      relativePath = imageUrl.replace(baseUrl, "");
    }
    
    relativePath = relativePath.replace(/^\/+/, "");
    const fullPath = path.resolve(relativePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting image file:", error);
    return false;
  }
};

export const deleteProductImages = (images: string[]): { deleted: number; failed: number } => {
  let deleted = 0;
  let failed = 0;
  
  for (const imageUrl of images) {
    if (deleteImageFile(imageUrl)) {
      deleted++;
    } else {
      failed++;
    }
  }
  
  return { deleted, failed };
};

export const parseImageUrl = (imageUrl: string): { folder: string; filename: string } | null => {
  try {
    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    return { folder, filename };
  } catch {
    return null;
  }
};

export const buildProductImageUrl = (categorySlug: string, filename: string): string => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/uploads/products/${categorySlug}/${filename}`;
};

export const extractRelativePath = (fullPath: string): string => {
  return fullPath.replace(/^.*uploads[\\/]/, "uploads/").replace(/\\/g, "/");
};
