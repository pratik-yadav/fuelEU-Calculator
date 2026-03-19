import { describe, it, expect, vi } from 'vitest';
import { CreatePoolHandler } from '../../application/command-handler/create-pool.handler';
import { CreatePoolCommand } from '../../application/commands/create-pool.command';
import type { IRouteRepository } from '../../domain/repositories/route.repository';
import type { IPoolRepository } from '../../domain/repositories/pool.repository';
import { Route } from '../../domain/entities/route.entity';

function makeRoute(routeId: string, ghgIntensity: number, fuelConsumption: number): Route {
  return new Route({
    id: `uuid-${routeId}`,
    routeId,
    vesselType: 'Cargo',
    fuelType: 'LNG',
    year: 2025,
    ghgIntensity,
    fuelConsumption,
    distance: 0,
    totalEmissions: 0,
    isBaseline: false,
  });
}

// R003: LNG 75.5 ghg, 100t → surplus
// R001: HFO 91.7442 ghg, 150t → deficit (large)
const SURPLUS_SHIP = makeRoute('R003', 75.5, 100);
const DEFICIT_SHIP = makeRoute('R001', 91.7442, 150);

function makeMockRouteRepo(routes: Route[]): IRouteRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByRouteId: vi.fn().mockImplementation(async (id: string) =>
      routes.find((r) => r.routeId === id) ?? null,
    ),
    findBaseline: vi.fn(),
    clearAllBaselines: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  } as unknown as IRouteRepository;
}

function makeMockPoolRepo(): IPoolRepository {
  return {
    create: vi.fn().mockImplementation(async (pool) => pool),
  };
}

describe('CreatePoolHandler', () => {
  it('throws DomainError when total pool CB is negative', async () => {
    // Two deficit ships — total will be very negative
    const bigDeficit = makeRoute('R002', 95.0, 200);
    const smallSurplus = makeRoute('R004', 87.2, 10); // tiny surplus
    const handler = new CreatePoolHandler(
      makeMockRouteRepo([bigDeficit, smallSurplus]),
      makeMockPoolRepo(),
    );
    await expect(
      handler.execute(new CreatePoolCommand(2025, ['R002', 'R004'])),
    ).rejects.toThrow();
  });

  it('successfully creates pool and returns allocations', async () => {
    const handler = new CreatePoolHandler(
      makeMockRouteRepo([SURPLUS_SHIP, SURPLUS_SHIP]), // both surplus — trivial pool
      makeMockPoolRepo(),
    );
    // Use same ship twice won't hit the DB constraint in unit test
    const surplusShip2 = makeRoute('R005', 60.0, 90);
    const handler2 = new CreatePoolHandler(
      makeMockRouteRepo([SURPLUS_SHIP, surplusShip2]),
      makeMockPoolRepo(),
    );
    const result = await handler2.execute(new CreatePoolCommand(2025, ['R003', 'R005']));
    expect(result).toHaveLength(2);
    result.forEach((r) => {
      expect(r).toHaveProperty('shipId');
      expect(r).toHaveProperty('cbBefore');
      expect(r).toHaveProperty('cbAfter');
    });
  });

  it('throws NotFoundError when ship does not exist', async () => {
    const emptyRepo = makeMockRouteRepo([]);
    const handler = new CreatePoolHandler(emptyRepo, makeMockPoolRepo());
    await expect(
      handler.execute(new CreatePoolCommand(2025, ['MISSING', 'R003'])),
    ).rejects.toThrow(/not found/i);
  });
});
