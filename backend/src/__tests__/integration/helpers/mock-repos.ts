import { vi } from 'vitest';
import { Route } from '../../../domain/entities/route.entity';
import { BankEntry } from '../../../domain/entities/bank-entry.entity';
import { ShipCompliance } from '../../../domain/entities/ship-compliance.entity';
import type { IRouteRepository } from '../../../domain/repositories/route.repository';
import type { IShipComplianceRepository } from '../../../domain/repositories/ship-compliance.repository';
import type { IBankEntryRepository } from '../../../domain/repositories/bank-entry.repository';
import type { IPoolRepository } from '../../../domain/repositories/pool.repository';

export const ROUTES: Route[] = [
  new Route({ id: 'id-R001', routeId: 'R001', vesselType: 'Cargo', fuelType: 'HFO', year: 2025, ghgIntensity: 91.7442, fuelConsumption: 150, distance: 0, totalEmissions: 0, isBaseline: true }),
  new Route({ id: 'id-R002', routeId: 'R002', vesselType: 'Cargo', fuelType: 'MDO', year: 2025, ghgIntensity: 90.76745, fuelConsumption: 80, distance: 0, totalEmissions: 0, isBaseline: false }),
  new Route({ id: 'id-R003', routeId: 'R003', vesselType: 'Cargo', fuelType: 'LNG', year: 2025, ghgIntensity: 75.5, fuelConsumption: 100, distance: 0, totalEmissions: 0, isBaseline: false }),
  new Route({ id: 'id-R004', routeId: 'R004', vesselType: 'Cargo', fuelType: 'VLSFO', year: 2025, ghgIntensity: 87.2, fuelConsumption: 120, distance: 0, totalEmissions: 0, isBaseline: false }),
  new Route({ id: 'id-R005', routeId: 'R005', vesselType: 'Cargo', fuelType: 'Biofuel-Blend', year: 2025, ghgIntensity: 60.0, fuelConsumption: 90, distance: 0, totalEmissions: 0, isBaseline: false }),
];

export function makeMockRouteRepo(routes = ROUTES): IRouteRepository {
  return {
    findAll: vi.fn().mockResolvedValue(routes),
    findById: vi.fn().mockImplementation(async (id: string) => routes.find((r) => r.id === id) ?? null),
    findByRouteId: vi.fn().mockImplementation(async (routeId: string) => routes.find((r) => r.routeId === routeId) ?? null),
    findBaseline: vi.fn().mockResolvedValue(routes.find((r) => r.isBaseline) ?? null),
    clearAllBaselines: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockImplementation(async (r: Route) => r),
    update: vi.fn().mockImplementation(async (r: Route) => r),
  } as unknown as IRouteRepository;
}

export function makeMockComplianceRepo(): IShipComplianceRepository {
  return {
    findByShipAndYear: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockImplementation(async (c: ShipCompliance) => c),
  };
}

export function makeMockBankRepo(entries: BankEntry[] = [], netSum = 0): IBankEntryRepository {
  return {
    findByShipAndYear: vi.fn().mockResolvedValue(entries),
    sumByShipAndYear: vi.fn().mockResolvedValue(netSum),
    create: vi.fn().mockImplementation(async (e: BankEntry) => e),
  } as unknown as IBankEntryRepository;
}

export function makeMockPoolRepo(): IPoolRepository {
  return {
    create: vi.fn().mockImplementation(async (pool) => pool),
  };
}
