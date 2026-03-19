import { z } from 'zod';
import type { VesselType, VesselStatus } from '../../types';
import type { Vessel } from '../../domain/entities/vessel.entity';

// ── Input Schemas (Zod) ────────────────────────────────────────────────────

const VESSEL_TYPES = ['CARGO', 'TANKER', 'BULK_CARRIER', 'CONTAINER', 'PASSENGER', 'FISHING', 'OTHER'] as const;
const VESSEL_STATUSES = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'] as const;

export const CreateVesselDtoSchema = z.object({
  imoNumber: z
    .string()
    .regex(/^IMO\d{7}$/, 'IMO number must be "IMO" followed by exactly 7 digits (e.g. IMO1234567).'),
  name: z.string().min(1, 'Vessel name is required.').max(200),
  flag: z.string().min(2, 'Flag is required.').max(100),
  vesselType: z.enum(VESSEL_TYPES),
  grossTonnage: z.number().positive('Gross tonnage must be a positive number.'),
  yearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear(), `Year built cannot exceed ${new Date().getFullYear()}.`),
});

export type CreateVesselDto = z.infer<typeof CreateVesselDtoSchema>;

export const UpdateVesselDtoSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  flag: z.string().min(2).max(100).optional(),
  vesselType: z.enum(VESSEL_TYPES).optional(),
  grossTonnage: z.number().positive().optional(),
  status: z.enum(VESSEL_STATUSES).optional(),
});

export type UpdateVesselDto = z.infer<typeof UpdateVesselDtoSchema>;

// ── Response DTO ───────────────────────────────────────────────────────────

export interface VesselResponseDto {
  id: string;
  imoNumber: string;
  name: string;
  flag: string;
  vesselType: VesselType;
  grossTonnage: number;
  status: VesselStatus;
  yearBuilt: number;
  createdAt: string;
  updatedAt: string;
}

// ── Mapper ─────────────────────────────────────────────────────────────────

export class VesselMapper {
  static toDto(vessel: Vessel): VesselResponseDto {
    return {
      id: vessel.id,
      imoNumber: vessel.imoNumber,
      name: vessel.name,
      flag: vessel.flag,
      vesselType: vessel.vesselType,
      grossTonnage: vessel.grossTonnage,
      status: vessel.status,
      yearBuilt: vessel.yearBuilt,
      createdAt: vessel.createdAt.toISOString(),
      updatedAt: vessel.updatedAt.toISOString(),
    };
  }

  static toDtoList(vessels: Vessel[]): VesselResponseDto[] {
    return vessels.map(VesselMapper.toDto);
  }
}
