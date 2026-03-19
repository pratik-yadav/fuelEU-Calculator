import type { VesselStatus, VesselType } from '../../types';

export class UpdateVesselCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly flag?: string,
    public readonly vesselType?: VesselType,
    public readonly grossTonnage?: number,
    public readonly status?: VesselStatus,
  ) {}
}
