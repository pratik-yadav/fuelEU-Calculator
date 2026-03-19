import type { IRouteRepository } from '../../domain/repositories/route.repository';
import { RouteMapper, type RouteResponseDto } from '../dto/route.dto';
import type { GetAllRoutesQuery } from '../queries/get-all-routes.query';

export class GetAllRoutesHandler {
  constructor(private readonly routeRepository: IRouteRepository) {}

  async execute(query: GetAllRoutesQuery): Promise<RouteResponseDto[]> {
    const routes = await this.routeRepository.findAll(query.filters);
    return RouteMapper.toDtoList(routes);
  }
}
