import type { PrismaClient } from '@prisma/client';
import { Pool } from '../../domain/entities/pool.entity';
import type { PoolMemberProps } from '../../domain/entities/pool.entity';
import type { IPoolRepository } from '../../domain/repositories/pool.repository';

export class PrismaPoolRepository implements IPoolRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(pool: Pool, members: PoolMemberProps[]): Promise<Pool> {
    await this.prisma.pool.create({
      data: {
        id: pool.id,
        year: pool.year,
        createdAt: pool.createdAt,
        members: {
          create: members.map((m) => ({
            shipId: m.shipId,
            cbBefore: m.cbBefore,
            cbAfter: m.cbAfter,
          })),
        },
      },
    });
    return pool;
  }
}
