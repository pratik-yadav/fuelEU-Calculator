import type { IVesselRepository } from '../../domain/repositories/vessel.repository';
import { NotFoundError, DomainError } from '../../utils/error.util';
import { VesselMapper, type VesselResponseDto } from '../dto/vessel.dto';
import type { UpdateVesselCommand } from '../commands/update-vessel.command';

export class UpdateVesselHandler {
  constructor(private readonly vesselRepository: IVesselRepository) {}

  async execute(command: UpdateVesselCommand): Promise<VesselResponseDto> {
    const vessel = await this.vesselRepository.findById(command.id);
    if (!vessel) {
      throw new NotFoundError('Vessel', command.id);
    }

    try {
      // Apply detail updates when any detail field is provided
      const hasDetailChanges =
        command.name !== undefined ||
        command.flag !== undefined ||
        command.grossTonnage !== undefined;

      if (hasDetailChanges) {
        vessel.updateDetails(
          command.name ?? vessel.name,
          command.flag ?? vessel.flag,
          command.grossTonnage ?? vessel.grossTonnage,
        );
      }

      if (command.vesselType !== undefined) {
        vessel.changeVesselType(command.vesselType);
      }

      if (command.status !== undefined) {
        switch (command.status) {
          case 'ACTIVE':
            vessel.activate();
            break;
          case 'INACTIVE':
            vessel.deactivate();
            break;
          case 'UNDER_MAINTENANCE':
            vessel.sendForMaintenance();
            break;
          case 'DECOMMISSIONED':
            vessel.decommission();
            break;
        }
      }
    } catch (error) {
      throw new DomainError(error instanceof Error ? error.message : 'Invalid vessel update.');
    }

    const updated = await this.vesselRepository.update(vessel);
    return VesselMapper.toDto(updated);
  }
}
