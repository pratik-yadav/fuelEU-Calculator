import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BankComplianceHandler } from '../../application/command-handler/bank-compliance.handler';
import { ApplyBankHandler } from '../../application/command-handler/apply-bank.handler';
import { BankComplianceCommand } from '../../application/commands/bank-compliance.command';
import { ApplyBankCommand } from '../../application/commands/apply-bank.command';
import type { IRouteRepository } from '../../domain/repositories/route.repository';
import type { IShipComplianceRepository } from '../../domain/repositories/ship-compliance.repository';
import type { IBankEntryRepository } from '../../domain/repositories/bank-entry.repository';
import { Route } from '../../domain/entities/route.entity';

// Compliant ship: LNG, 100t → CB = (89.33680 - 75.5) * 4100000 = 567,810,800 gCO2eq
const SURPLUS_ROUTE = new Route({
  id: 'uuid-surplus',
  routeId: 'R003',
  vesselType: 'Cargo',
  fuelType: 'LNG',
  year: 2025,
  ghgIntensity: 75.5,
  fuelConsumption: 100,
  distance: 0,
  totalEmissions: 0,
  isBaseline: false,
});

// Non-compliant ship: HFO, 150t → CB = (89.33680 - 91.7442) * 6150000 ≈ -14,805,780 gCO2eq
const DEFICIT_ROUTE = new Route({
  id: 'uuid-deficit',
  routeId: 'R001',
  vesselType: 'Cargo',
  fuelType: 'HFO',
  year: 2025,
  ghgIntensity: 91.7442,
  fuelConsumption: 150,
  distance: 0,
  totalEmissions: 0,
  isBaseline: true,
});

function makeMockRoute(route: Route) {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByRouteId: vi.fn().mockResolvedValue(route),
    findBaseline: vi.fn(),
    clearAllBaselines: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  } as unknown as IRouteRepository;
}

function makeMockCompliance(): IShipComplianceRepository {
  return {
    findByShipAndYear: vi.fn(),
    upsert: vi.fn(),
  };
}

function makeMockBank(netBanked = 0) {
  return {
    findByShipAndYear: vi.fn(),
    sumByShipAndYear: vi.fn().mockResolvedValue(netBanked),
    create: vi.fn().mockImplementation(async (e) => e),
  } as unknown as IBankEntryRepository;
}

describe('BankComplianceHandler', () => {
  it('throws when ship has no surplus (deficit ship)', async () => {
    const handler = new BankComplianceHandler(
      makeMockRoute(DEFICIT_ROUTE),
      makeMockCompliance(),
      makeMockBank(),
    );
    await expect(
      handler.execute(new BankComplianceCommand('R001', 2025, 1000)),
    ).rejects.toThrow(/no surplus/i);
  });

  it('throws when amount exceeds available CB', async () => {
    const handler = new BankComplianceHandler(
      makeMockRoute(SURPLUS_ROUTE),
      makeMockCompliance(),
      makeMockBank(0),
    );
    // CB ≈ 567 million — supply an absurdly large amount
    await expect(
      handler.execute(new BankComplianceCommand('R003', 2025, 999_999_999_999)),
    ).rejects.toThrow(/cannot bank/i);
  });

  it('creates bank entry successfully', async () => {
    const bankRepo = makeMockBank(0);
    const handler = new BankComplianceHandler(
      makeMockRoute(SURPLUS_ROUTE),
      makeMockCompliance(),
      bankRepo,
    );
    const result = await handler.execute(new BankComplianceCommand('R003', 2025, 1000));
    expect(result.type).toBe('BANKED');
    expect(result.amountGco2eq).toBe(1000);
    expect(bankRepo.create).toHaveBeenCalled();
  });
});

describe('ApplyBankHandler', () => {
  it('throws when ship has no deficit (surplus ship)', async () => {
    const handler = new ApplyBankHandler(makeMockRoute(SURPLUS_ROUTE), makeMockBank(5000));
    await expect(
      handler.execute(new ApplyBankCommand('R003', 2025, 1000)),
    ).rejects.toThrow(/no deficit/i);
  });

  it('throws when net banked balance is zero or negative', async () => {
    const handler = new ApplyBankHandler(makeMockRoute(DEFICIT_ROUTE), makeMockBank(0));
    await expect(
      handler.execute(new ApplyBankCommand('R001', 2025, 1000)),
    ).rejects.toThrow(/no banked surplus/i);
  });

  it('throws when amount exceeds net banked balance', async () => {
    const handler = new ApplyBankHandler(makeMockRoute(DEFICIT_ROUTE), makeMockBank(500));
    await expect(
      handler.execute(new ApplyBankCommand('R001', 2025, 1000)),
    ).rejects.toThrow(/cannot apply/i);
  });

  it('creates negative bank entry (applied)', async () => {
    const bankRepo = makeMockBank(50000);
    const handler = new ApplyBankHandler(makeMockRoute(DEFICIT_ROUTE), bankRepo);
    const result = await handler.execute(new ApplyBankCommand('R001', 2025, 1000));
    expect(result.type).toBe('APPLIED');
    expect(result.amountGco2eq).toBe(-1000);
  });
});
