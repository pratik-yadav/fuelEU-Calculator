import type { Pool, PoolMemberProps } from '../entities/pool.entity';

/**
 * IPoolRepository — port for persisting pool events (Article 21).
 */
export interface IPoolRepository {
  create(pool: Pool, members: PoolMemberProps[]): Promise<Pool>;
}
