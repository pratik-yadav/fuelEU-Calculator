// ── FuelEU Domain Types ────────────────────────────────────────────────────

export type FuelType = 'HFO' | 'MDO' | 'LNG' | 'VLSFO' | 'Biofuel-Blend' | string;
export type VesselType = 'Tanker' | 'Cargo' | 'Bulk Carrier' | string;

// ── Shared HTTP Types ──────────────────────────────────────────────────────

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
