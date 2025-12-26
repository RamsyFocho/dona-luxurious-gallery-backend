import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { ILoginRequest, ILoginResponse } from "../types";

const prisma = new PrismaClient();

// Declare module augmentation
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

const signToken = (id: string, role: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN;

  // Cast secret to jwt.Secret and options to SignOptions to satisfy type definitions
  return jwt.sign(
    { id, role },
    secret as jwt.Secret,
    { expiresIn } as jwt.SignOptions
  );
};

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: ILoginRequest = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError("Please provide email and password!", 400));
    }

    // 2) Check if user exists && password is correct
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // 3) Check if user is active
    if (!user.isActive) {
      return next(new AppError("Your account has been deactivated", 403));
    }

    // 4) Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // 5) Send token to client
    const token = signToken(user.id, user.role);

    // Remove password from output
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role as "USER" | "ADMIN",
      isActive: user.isActive,
      lastLogin: user.lastLogin ?? undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response: ILoginResponse = {
      user: userWithoutPassword,
      token,
    };

    res.status(200).json({
      status: "success",
      data: response,
    });
  }
);

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2) Verification token
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as jwt.Secret
    );

    // 3) Check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // 4) Grant access to protected route
    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name ?? undefined,
      role: currentUser.role as "USER" | "ADMIN",
      isActive: currentUser.isActive,
      lastLogin: currentUser.lastLogin ?? undefined,
      createdAt: currentUser.createdAt,
      updatedAt: currentUser.updatedAt,
    };
    next();
  }
);

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("You are not logged in!", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
