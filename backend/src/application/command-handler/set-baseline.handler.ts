import type { IRouteRepository } from '../../domain/repositories/route.repository';
import { NotFoundError } from '../../utils/error.util';
import { RouteMapper, type RouteResponseDto } from '../dto/route.dto';
import type { SetBaselineCommand } from '../commands/set-baseline.command';

export class SetBaselineHandler {
  constructor(private readonly routeRepository: IRouteRepository) {}

  async execute(command: SetBaselineCommand): Promise<RouteResponseDto> {
    const route = await this.routeRepository.findById(command.routeDbId);
    if (!route) throw new NotFoundError('Route', command.routeDbId);

    // Only one baseline is allowed — clear all others first
    await this.routeRepository.clearAllBaselines();
    route.setAsBaseline();

    const updated = await this.routeRepository.update(route);
    return RouteMapper.toDto(updated);
  }
}
