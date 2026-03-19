import type { ApiResponse, ApiErrorResponse, PaginationMeta } from '../types';

export function successResponse<T>(
  data: T,
  message?: string,
  meta?: PaginationMeta,
): ApiResponse<T> {
  const response: ApiResponse<T> = { success: true, data };
  if (message) response.message = message;
  if (meta) response.meta = meta;
  return response;
}

export function errorResponse(
  error: string,
  statusCode: number,
  details?: unknown,
): ApiErrorResponse {
  return { success: false, error, statusCode, details };
}
