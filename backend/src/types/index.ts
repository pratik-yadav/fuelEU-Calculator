export type VesselType =
  | 'CARGO'
  | 'TANKER'
  | 'BULK_CARRIER'
  | 'CONTAINER'
  | 'PASSENGER'
  | 'FISHING'
  | 'OTHER';

export type VesselStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'UNDER_MAINTENANCE'
  | 'DECOMMISSIONED';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  details?: unknown;
}
