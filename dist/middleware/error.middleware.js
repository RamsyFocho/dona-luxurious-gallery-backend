"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const appError_1 = __importDefault(require("../utils/appError"));
const handlePrismaError = (err) => {
    switch (err.code) {
        case 'P2002':
            return new appError_1.default('Duplicate field value entered', 400);
        case 'P2014':
            return new appError_1.default('Invalid ID', 400);
        case 'P2003':
            return new appError_1.default('Invalid foreign key', 400);
        case 'P2025':
            return new appError_1.default('Record not found', 404);
        default:
            return new appError_1.default(`Database error: ${err.message}`, 400);
    }
};
const handleJWTError = () => new appError_1.default('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new appError_1.default('Your token has expired! Please log in again.', 401);
const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    else {
        let error = { ...err };
        error.message = err.message;
        // Handle Prisma errors
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            error = handlePrismaError(err);
        }
        // Handle JWT errors
        if (err.name === 'JsonWebTokenError')
            error = handleJWTError();
        if (err.name === 'TokenExpiredError')
            error = handleJWTExpiredError();
        // Operational, trusted error: send message to client
        if (error.isOperational) {
            res.status(error.statusCode).json({
                status: error.status,
                message: error.message,
            });
        }
        else {
            // Programming or other unknown error: don't leak error details
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!',
            });
        }
    }
};
exports.default = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map