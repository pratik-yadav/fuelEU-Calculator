import type { VesselStatus, VesselType } from '../../types';
import type { Vessel } from '../entities/vessel.entity';

/**
 * VesselQueryFilters — value object used by query operations.
 */
export interface VesselQueryFilters {
  status?: VesselStatus;
  vesselType?: VesselType;
  flag?: string;
  name?: string;
}

/**
 * IVesselRepository — Port (interface) for the vessel aggregate.
 *
 * Defined in the domain layer; implemented by the infrastructure layer.
 * All application code depends on this abstraction, never on concrete adapters.
 */
export interface IVesselRepository {
  findById(id: string): Promise<Vessel | null>;
  findByImoNumber(imoNumber: string): Promise<Vessel | null>;
  findAll(filters?: VesselQueryFilters, page?: number, limit?: number): Promise<Vessel[]>;
  count(filters?: VesselQueryFilters): Promise<number>;
  save(vessel: Vessel): Promise<Vessel>;
  update(vessel: Vessel): Promise<Vessel>;
  delete(id: string): Promise<void>;
}
