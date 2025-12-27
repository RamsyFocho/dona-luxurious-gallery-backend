export interface IUser {
    id: string;
    email: string;
    name?: string;
    role: 'USER' | 'ADMIN';
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ILoginRequest {
    email: string;
    password: string;
}
export interface ILoginResponse {
    user: IUser;
    token: string;
}
export interface ICategory {
    id: string;
    name: string;
    slug: string;
    image?: string;
    description?: string;
    isActive: boolean;
    order?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICreateCategory {
    name: string;
    slug: string;
    image?: string;
    description?: string;
    isActive?: boolean;
    order?: number;
}
export interface IUpdateCategory extends Partial<ICreateCategory> {
}
export interface IProduct {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    categorySlug: string;
    description: string;
    longDescription: string;
    images: string[];
    materials: string[];
    keyFeatures: string[];
    trending: boolean;
    isFeatured: boolean;
    inStock: boolean;
    price?: number;
    metaDescription?: string;
    schemaType?: string;
    schemaDescription?: string;
    schemaImage?: string;
    schemaCategory?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICreateProduct {
    name: string;
    slug: string;
    categoryId: string;
    categorySlug: string;
    description: string;
    longDescription: string;
    images: string[];
    materials: string[];
    keyFeatures: string[];
    trending?: boolean;
    isFeatured?: boolean;
    inStock?: boolean;
    price?: number;
    metaDescription?: string;
    schemaType?: string;
    schemaDescription?: string;
    schemaImage?: string;
    schemaCategory?: string;
}
export interface IUpdateProduct extends Partial<ICreateProduct> {
}
export interface IBulkCreateProduct {
    products: ICreateProduct[];
}
export interface IBulkCreateCategory {
    categories: ICreateCategory[];
}
export interface IPagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}
export interface IPaginatedResponse<T> {
    status: string;
    results: number;
    pagination: IPagination;
    data: T[];
}
export interface IUploadResponse {
    status: string;
    message: string;
    data: {
        url: string;
        filename: string;
        path: string;
    };
}
//# sourceMappingURL=index.d.ts.map