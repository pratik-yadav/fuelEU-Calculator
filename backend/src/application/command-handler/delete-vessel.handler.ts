import type { IVesselRepository } from '../../domain/repositories/vessel.repository';
import { NotFoundError } from '../../utils/error.util';
import type { DeleteVesselCommand } from '../commands/delete-vessel.command';

export class DeleteVesselHandler {
  constructor(private readonly vesselRepository: IVesselRepository) {}

  async execute(command: DeleteVesselCommand): Promise<void> {
    const vessel = await this.vesselRepository.findById(command.id);
    if (!vessel) {
      throw new NotFoundError('Vessel', command.id);
    }

    await this.vesselRepository.delete(command.id);
  }
}
