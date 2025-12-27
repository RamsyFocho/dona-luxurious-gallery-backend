import { Request, Response, NextFunction } from "express";
declare module "express" {
    interface Request {
        user?: {
            id: string;
            email: string;
            name?: string;
            role: "USER" | "ADMIN";
            isActive: boolean;
            lastLogin?: Date;
            createdAt: Date;
            updatedAt: Date;
        };
    }
}
export declare const login: (req: Request, res: Response, next: NextFunction) => void;
export declare const protect: (req: Request, res: Response, next: NextFunction) => void;
export declare const restrictTo: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const getMe: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.controller.d.ts.map