import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import { ZodError } from 'zod';
import ApiError from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return new ApiError(
      400,
      'Validation failed',
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }

  return new ApiError(500, 'Internal Server Error');
};

const requestIdOf = (req: Request): string => (typeof req.id === 'string' ? req.id : 'unknown');

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.path} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const apiError = toApiError(err);
  const requestId = requestIdOf(req);
  const context = {
    requestId,
    method: req.method,
    path: req.path,
    statusCode: apiError.statusCode,
  };

  if (apiError.statusCode >= 500) {
    logger.error({ ...context, err }, apiError.message);
  } else {
    logger.warn(context, apiError.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    statusCode: apiError.statusCode,
    errors: apiError.errors,
    requestId,
    ...(apiError.data === undefined ? {} : { data: apiError.data }),
  });
};
