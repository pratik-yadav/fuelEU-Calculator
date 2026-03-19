import type { ShipCompliance } from '../entities/ship-compliance.entity';

/**
 * IShipComplianceRepository — port for persisting computed CB per ship/year.
 */
export interface IShipComplianceRepository {
  findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null>;
  upsert(compliance: ShipCompliance): Promise<ShipCompliance>;
}
