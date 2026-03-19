import type { PrismaClient } from '@prisma/client';
import { ShipCompliance } from '../../domain/entities/ship-compliance.entity';
import type { IShipComplianceRepository } from '../../domain/repositories/ship-compliance.repository';

export class PrismaShipComplianceRepository implements IShipComplianceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: {
    id: string;
    shipId: string;
    year: number;
    cbGco2eq: number;
  }): ShipCompliance {
    return new ShipCompliance({
      id: row.id,
      shipId: row.shipId,
      year: row.year,
      cbGco2eq: row.cbGco2eq,
    });
  }

  async findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    const row = await this.prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId, year } },
    });
    return row ? this.toDomain(row) : null;
  }

  async upsert(compliance: ShipCompliance): Promise<ShipCompliance> {
    const row = await this.prisma.shipCompliance.upsert({
      where: { shipId_year: { shipId: compliance.shipId, year: compliance.year } },
      create: {
        id: compliance.id,
        shipId: compliance.shipId,
        year: compliance.year,
        cbGco2eq: compliance.cbGco2eq,
      },
      update: {
        cbGco2eq: compliance.cbGco2eq,
      },
    });
    return this.toDomain(row);
  }
}
