export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface RouteFilters {
  fuelType?: string;
  year?: number;
  vesselType?: string;
}

export interface ComparisonResult {
  routeId: string;
  ghgIntensity: number;
  baselineGhgIntensity: number;
  percentDiff: number;
  compliant: boolean;
}

export interface ComplianceCB {
  shipId: string;
  year: number;
  ghgIntensity: number;
  energy: number;
  cb: number;
}

export interface AdjustedCB {
  shipId: string;
  year: number;
  cb: number;
  bankedTotal: number;
  adjustedCb: number;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  type: 'BANKED' | 'APPLIED';
  createdAt: string;
}

export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface BankRequest { shipId: string; year: number; amount: number; }
export interface ApplyRequest { shipId: string; year: number; amount: number; }
export interface PoolRequest { year: number; members: string[]; }

export interface ApiSuccess<T> { success: true; data: T; }
export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
  details?: Array<{ code: string; path: string[]; message: string }>;
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
