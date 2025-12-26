import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import AppError from '../utils/appError';

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError) => {
  switch (err.code) {
    case 'P2002':
      return new AppError('Duplicate field value entered', 400);
    case 'P2014':
      return new AppError('Invalid ID', 400);
    case 'P2003':
      return new AppError('Invalid foreign key', 400);
    case 'P2025':
      return new AppError('Record not found', 404);
    default:
      return new AppError(`Database error: ${err.message}`, 400);
  }
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      error = handlePrismaError(err);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Operational, trusted error: send message to client
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    } else {
      // Programming or other unknown error: don't leak error details
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      });
    }
  }
};

export default errorMiddleware;