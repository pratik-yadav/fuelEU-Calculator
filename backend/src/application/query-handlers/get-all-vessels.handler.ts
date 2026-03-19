import type { IVesselRepository } from '../../domain/repositories/vessel.repository';
import { VesselMapper, type VesselResponseDto } from '../dto/vessel.dto';
import type { GetAllVesselsQuery } from '../queries/get-all-vessels.query';

export interface GetAllVesselsResult {
  vessels: VesselResponseDto[];
  total: number;
}

export class GetAllVesselsHandler {
  constructor(private readonly vesselRepository: IVesselRepository) {}

  async execute(query: GetAllVesselsQuery): Promise<GetAllVesselsResult> {
    const [vessels, total] = await Promise.all([
      this.vesselRepository.findAll(query.filters, query.page, query.limit),
      this.vesselRepository.count(query.filters),
    ]);

    return {
      vessels: VesselMapper.toDtoList(vessels),
      total,
    };
  }
}
