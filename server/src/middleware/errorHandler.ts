import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { errorResponse } from '../utils/api-response.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return errorResponse(res, err.code, err.message, err.statusCode, err.details);
  }

  console.error('Unhandled error:', err);
  return errorResponse(res, 'UNKNOWN_ERROR', 'An unexpected error occurred', 500);
}
