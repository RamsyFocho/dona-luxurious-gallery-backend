import { Request } from 'express';
export declare const parseJsonArray: (jsonString: string) => any[];
export declare const stringifyJsonArray: (array: any[]) => string;
export declare const generateSlug: (text: string) => string;
export declare const getPaginationParams: (req: Request) => {
    page: number;
    limit: number;
    skip: number;
};
//# sourceMappingURL=helpers.d.ts.map