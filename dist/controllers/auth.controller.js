"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.restrictTo = exports.protect = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const appError_1 = __importDefault(require("../utils/appError"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const prisma = new client_1.PrismaClient();
const signToken = (id, role) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    const expiresIn = process.env.JWT_EXPIRES_IN;
    // Cast secret to jwt.Secret and options to SignOptions to satisfy type definitions
    return jsonwebtoken_1.default.sign({ id, role }, secret, { expiresIn });
};
exports.login = (0, catchAsync_1.default)(async (req, res, next) => {
    const { email, password } = req.body;
    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new appError_1.default("Please provide email and password!", 400));
    }
    // 2) Check if user exists && password is correct
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
        return next(new appError_1.default("Incorrect email or password", 401));
    }
    // 3) Check if user is active
    if (!user.isActive) {
        return next(new appError_1.default("Your account has been deactivated", 403));
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
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
    const response = {
        user: userWithoutPassword,
        token,
    };
    res.status(200).json({
        status: "success",
        data: response,
    });
});
exports.protect = (0, catchAsync_1.default)(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next(new appError_1.default("You are not logged in! Please log in to get access.", 401));
    }
    // 2) Verification token
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    // 3) Check if user still exists
    const currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
    });
    if (!currentUser) {
        return next(new appError_1.default("The user belonging to this token no longer exists.", 401));
    }
    // 4) Grant access to protected route
    req.user = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name ?? undefined,
        role: currentUser.role,
        isActive: currentUser.isActive,
        lastLogin: currentUser.lastLogin ?? undefined,
        createdAt: currentUser.createdAt,
        updatedAt: currentUser.updatedAt,
    };
    next();
});
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new appError_1.default("You are not logged in!", 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new appError_1.default("You do not have permission to perform this action", 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
exports.getMe = (0, catchAsync_1.default)(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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
//# sourceMappingURL=auth.controller.js.map