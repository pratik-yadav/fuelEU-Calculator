import { randomUUID } from 'crypto';
import { ShipCompliance } from '../../domain/entities/ship-compliance.entity';
import type { IRouteRepository } from '../../domain/repositories/route.repository';
import type { IShipComplianceRepository } from '../../domain/repositories/ship-compliance.repository';
import type { IBankEntryRepository } from '../../domain/repositories/bank-entry.repository';
import { ComplianceCalculatorService } from '../../domain/services/compliance-calculator.service';
import { NotFoundError } from '../../utils/error.util';
import type { AdjustedCBDto } from '../dto/compliance.dto';
import type { GetAdjustedCBQuery } from '../queries/get-adjusted-cb.query';

export class GetAdjustedCBHandler {
  constructor(
    private readonly routeRepository: IRouteRepository,
    private readonly complianceRepository: IShipComplianceRepository,
    private readonly bankEntryRepository: IBankEntryRepository,
  ) {}

  async execute(query: GetAdjustedCBQuery): Promise<AdjustedCBDto> {
    const route = await this.routeRepository.findByRouteId(query.shipId);
    if (!route) throw new NotFoundError('Route (ship)', query.shipId);

    const energy = ComplianceCalculatorService.calculateEnergy(route.fuelConsumption);
    const cb = ComplianceCalculatorService.calculateCB(route.ghgIntensity, energy);

    // Ensure ship_compliance is up-to-date
    await this.complianceRepository.upsert(
      new ShipCompliance({ id: randomUUID(), shipId: query.shipId, year: query.year, cbGco2eq: cb }),
    );

    const bankedTotal = await this.bankEntryRepository.sumByShipAndYear(
      query.shipId,
      query.year,
    );

    return {
      shipId: query.shipId,
      year: query.year,
      cb,
      bankedTotal,
      adjustedCb: parseFloat((cb + bankedTotal).toFixed(5)),
    };
  }
}
