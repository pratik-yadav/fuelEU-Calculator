import type { VesselType } from '../../types';

export class CreateVesselCommand {
  constructor(
    public readonly imoNumber: string,
    public readonly name: string,
    public readonly flag: string,
    public readonly vesselType: VesselType,
    public readonly grossTonnage: number,
    public readonly yearBuilt: number,
  ) {}
}
