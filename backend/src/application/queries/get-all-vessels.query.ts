import type { VesselQueryFilters } from '../../domain/repositories/vessel.repository';

export class GetAllVesselsQuery {
  constructor(
    public readonly filters: VesselQueryFilters = {},
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}
