import multer from 'multer';
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
export declare const upload: multer.Multer;
export declare const uploadSingle: (fieldName: string) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultiple: (fieldName: string, maxCount?: number) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export {};
//# sourceMappingURL=upload.d.ts.map