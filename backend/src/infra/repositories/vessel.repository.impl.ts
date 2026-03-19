import type { PrismaClient } from '@prisma/client';
import { Vessel } from '../../domain/entities/vessel.entity';
import type {
  IVesselRepository,
  VesselQueryFilters,
} from '../../domain/repositories/vessel.repository';
import type { VesselType, VesselStatus } from '../../types';

/**
 * PrismaVesselRepository — Adapter implementing the IVesselRepository port.
 *
 * Translates between the Prisma persistence model and the Vessel domain entity.
 * All Prisma-specific code is confined to this class.
 */
export class PrismaVesselRepository implements IVesselRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Vessel | null> {
    const model = await this.prisma.vessel.findUnique({ where: { id } });
    return model ? this.toDomain(model) : null;
  }

  async findByImoNumber(imoNumber: string): Promise<Vessel | null> {
    const model = await this.prisma.vessel.findUnique({ where: { imoNumber } });
    return model ? this.toDomain(model) : null;
  }

  async findAll(
    filters?: VesselQueryFilters,
    page = 1,
    limit = 10,
  ): Promise<Vessel[]> {
    const models = await this.prisma.vessel.findMany({
      where: this.buildWhere(filters),
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return models.map((m) => this.toDomain(m));
  }

  async count(filters?: VesselQueryFilters): Promise<number> {
    return this.prisma.vessel.count({ where: this.buildWhere(filters) });
  }

  async save(vessel: Vessel): Promise<Vessel> {
    const model = await this.prisma.vessel.create({
      data: this.toPersistence(vessel),
    });
    return this.toDomain(model);
  }

  async update(vessel: Vessel): Promise<Vessel> {
    const model = await this.prisma.vessel.update({
      where: { id: vessel.id },
      data: {
        name: vessel.name,
        flag: vessel.flag,
        vesselType: vessel.vesselType,
        grossTonnage: vessel.grossTonnage,
        status: vessel.status,
        updatedAt: vessel.updatedAt,
      },
    });
    return this.toDomain(model);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vessel.delete({ where: { id } });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildWhere(filters?: VesselQueryFilters) {
    if (!filters) return {};
    return {
      ...(filters.status && { status: filters.status }),
      ...(filters.vesselType && { vesselType: filters.vesselType }),
      ...(filters.flag && {
        flag: { contains: filters.flag, mode: 'insensitive' as const },
      }),
      ...(filters.name && {
        name: { contains: filters.name, mode: 'insensitive' as const },
      }),
    };
  }

  private toDomain(model: {
    id: string;
    imoNumber: string;
    name: string;
    flag: string;
    vesselType: string;
    grossTonnage: number;
    status: string;
    yearBuilt: number;
    createdAt: Date;
    updatedAt: Date;
  }): Vessel {
    return new Vessel({
      id: model.id,
      imoNumber: model.imoNumber,
      name: model.name,
      flag: model.flag,
      vesselType: model.vesselType as VesselType,
      grossTonnage: model.grossTonnage,
      status: model.status as VesselStatus,
      yearBuilt: model.yearBuilt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  private toPersistence(vessel: Vessel) {
    return {
      id: vessel.id,
      imoNumber: vessel.imoNumber,
      name: vessel.name,
      flag: vessel.flag,
      vesselType: vessel.vesselType,
      grossTonnage: vessel.grossTonnage,
      status: vessel.status,
      yearBuilt: vessel.yearBuilt,
      createdAt: vessel.createdAt,
      updatedAt: vessel.updatedAt,
    };
  }
}
