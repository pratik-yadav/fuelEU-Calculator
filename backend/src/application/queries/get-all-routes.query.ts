import type { RouteFilters } from '../../domain/repositories/route.repository';

export class GetAllRoutesQuery {
  constructor(public readonly filters: RouteFilters = {}) {}
}
