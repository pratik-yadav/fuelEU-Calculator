import type { IRouteRepository } from '../../domain/repositories/route.repository';
import { ComplianceCalculatorService } from '../../domain/services/compliance-calculator.service';
import { DomainError } from '../../utils/error.util';
import type { ComparisonResponseDto } from '../dto/route.dto';
import type { GetRouteComparisonQuery } from '../queries/get-route-comparison.query';

export class GetRouteComparisonHandler {
  constructor(private readonly routeRepository: IRouteRepository) {}

  async execute(_query: GetRouteComparisonQuery): Promise<ComparisonResponseDto[]> {
    const baseline = await this.routeRepository.findBaseline();
    if (!baseline) {
      throw new DomainError('No baseline route has been set. Use POST /routes/:id/baseline first.');
    }

    const routes = await this.routeRepository.findAll();

    return routes.map((route) => ({
      routeId: route.routeId,
      ghgIntensity: route.ghgIntensity,
      baselineGhgIntensity: baseline.ghgIntensity,
      percentDiff: ComplianceCalculatorService.calculatePercentDiff(
        route.ghgIntensity,
        baseline.ghgIntensity,
      ),
      compliant: ComplianceCalculatorService.isCompliant(route.ghgIntensity),
    }));
  }
}
