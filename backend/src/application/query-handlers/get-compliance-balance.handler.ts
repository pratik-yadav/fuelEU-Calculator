import { randomUUID } from 'crypto';
import { ShipCompliance } from '../../domain/entities/ship-compliance.entity';
import type { IRouteRepository } from '../../domain/repositories/route.repository';
import type { IShipComplianceRepository } from '../../domain/repositories/ship-compliance.repository';
import { ComplianceCalculatorService } from '../../domain/services/compliance-calculator.service';
import { NotFoundError } from '../../utils/error.util';
import type { ComplianceBalanceDto } from '../dto/compliance.dto';
import type { GetComplianceBalanceQuery } from '../queries/get-compliance-balance.query';

export class GetComplianceBalanceHandler {
  constructor(
    private readonly routeRepository: IRouteRepository,
    private readonly complianceRepository: IShipComplianceRepository,
  ) {}

  async execute(query: GetComplianceBalanceQuery): Promise<ComplianceBalanceDto> {
    const route = await this.routeRepository.findByRouteId(query.shipId);
    if (!route) throw new NotFoundError('Route (ship)', query.shipId);

    const energy = ComplianceCalculatorService.calculateEnergy(route.fuelConsumption);
    const cb = ComplianceCalculatorService.calculateCB(route.ghgIntensity, energy);

    // Compute-and-cache: upsert ship_compliance
    const compliance = new ShipCompliance({
      id: randomUUID(),
      shipId: query.shipId,
      year: query.year,
      cbGco2eq: cb,
    });
    await this.complianceRepository.upsert(compliance);

    return {
      shipId: query.shipId,
      year: query.year,
      ghgIntensity: route.ghgIntensity,
      energy,
      cb,
    };
  }
}
