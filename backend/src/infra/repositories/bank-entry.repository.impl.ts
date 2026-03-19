import type { PrismaClient } from '@prisma/client';
import { BankEntry } from '../../domain/entities/bank-entry.entity';
import type { IBankEntryRepository } from '../../domain/repositories/bank-entry.repository';

export class PrismaBankEntryRepository implements IBankEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: {
    id: string;
    shipId: string;
    year: number;
    amountGco2eq: number;
    createdAt: Date;
  }): BankEntry {
    return new BankEntry({
      id: row.id,
      shipId: row.shipId,
      year: row.year,
      amountGco2eq: row.amountGco2eq,
      createdAt: row.createdAt,
    });
  }

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const rows = await this.prisma.bankEntry.findMany({
      where: { shipId, year },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async sumByShipAndYear(shipId: string, year: number): Promise<number> {
    const result = await this.prisma.bankEntry.aggregate({
      where: { shipId, year },
      _sum: { amountGco2eq: true },
    });
    return result._sum.amountGco2eq ?? 0;
  }

  async create(entry: BankEntry): Promise<BankEntry> {
    const row = await this.prisma.bankEntry.create({
      data: {
        id: entry.id,
        shipId: entry.shipId,
        year: entry.year,
        amountGco2eq: entry.amountGco2eq,
        createdAt: entry.createdAt,
      },
    });
    return this.toDomain(row);
  }
}
