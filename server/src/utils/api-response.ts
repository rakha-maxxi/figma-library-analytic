import type { Response } from 'express';

export function successResponse<T>(res: Response, data: T, meta?: Record<string, unknown>, statusCode = 200) {
  const body: { data: T; meta?: Record<string, unknown> } = { data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function errorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown,
) {
  const body: { error: { code: string; message: string; details?: unknown } } = {
    error: { code, message },
  };
  if (details !== undefined) body.error.details = details;
  return res.status(statusCode).json(body);
}
