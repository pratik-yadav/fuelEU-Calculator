export interface ComplianceBalanceDto {
  shipId: string;
  year: number;
  ghgIntensity: number;
  energy: number;
  cb: number;
}

export interface AdjustedCBDto {
  shipId: string;
  year: number;
  cb: number;
  bankedTotal: number;
  adjustedCb: number;
}
