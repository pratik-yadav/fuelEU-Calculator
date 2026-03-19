import type { IVesselRepository } from '../../domain/repositories/vessel.repository';
import { NotFoundError } from '../../utils/error.util';
import { VesselMapper, type VesselResponseDto } from '../dto/vessel.dto';
import type { GetVesselByIdQuery } from '../queries/get-vessel-by-id.query';

export class GetVesselByIdHandler {
  constructor(private readonly vesselRepository: IVesselRepository) {}

  async execute(query: GetVesselByIdQuery): Promise<VesselResponseDto> {
    const vessel = await this.vesselRepository.findById(query.id);
    if (!vessel) {
      throw new NotFoundError('Vessel', query.id);
    }

    return VesselMapper.toDto(vessel);
  }
}
