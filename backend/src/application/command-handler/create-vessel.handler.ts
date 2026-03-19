import { randomUUID } from 'crypto';
import { Vessel } from '../../domain/entities/vessel.entity';
import type { IVesselRepository } from '../../domain/repositories/vessel.repository';
import { ConflictError, DomainError } from '../../utils/error.util';
import { VesselMapper, type VesselResponseDto } from '../dto/vessel.dto';
import type { CreateVesselCommand } from '../commands/create-vessel.command';

export class CreateVesselHandler {
  constructor(private readonly vesselRepository: IVesselRepository) {}

  async execute(command: CreateVesselCommand): Promise<VesselResponseDto> {
    const existing = await this.vesselRepository.findByImoNumber(command.imoNumber);
    if (existing) {
      throw new ConflictError(`A vessel with IMO number '${command.imoNumber}' already exists.`);
    }

    let vessel: Vessel;
    try {
      vessel = new Vessel({
        id: randomUUID(),
        imoNumber: command.imoNumber,
        name: command.name,
        flag: command.flag,
        vesselType: command.vesselType,
        grossTonnage: command.grossTonnage,
        status: 'ACTIVE',
        yearBuilt: command.yearBuilt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new DomainError(error instanceof Error ? error.message : 'Invalid vessel data.');
    }

    const saved = await this.vesselRepository.save(vessel);
    return VesselMapper.toDto(saved);
  }
}
