export interface ImageNamingOptions {
    productName: string;
    productSlug: string;
    categorySlug: string;
    index?: number;
}
export declare const generateProductImageName: (options: ImageNamingOptions) => string;
export declare const getCategoryUploadPath: (categorySlug: string) => string;
export declare const ensureCategoryFolderExists: (categorySlug: string) => void;
export declare const deleteImageFile: (imageUrl: string) => boolean;
export declare const deleteProductImages: (images: string[]) => {
    deleted: number;
    failed: number;
};
export declare const parseImageUrl: (imageUrl: string) => {
    folder: string;
    filename: string;
} | null;
export declare const buildProductImageUrl: (categorySlug: string, filename: string) => string;
export declare const extractRelativePath: (fullPath: string) => string;
//# sourceMappingURL=imageUtils.d.ts.map