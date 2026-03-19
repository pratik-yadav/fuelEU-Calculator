import { randomUUID } from 'crypto';
import { Pool } from '../../domain/entities/pool.entity';
import type { IRouteRepository } from '../../domain/repositories/route.repository';
import type { IPoolRepository } from '../../domain/repositories/pool.repository';
import {
  ComplianceCalculatorService,
  type PoolMemberInput,
} from '../../domain/services/compliance-calculator.service';
import { NotFoundError, DomainError } from '../../utils/error.util';
import type { PoolResultDto } from '../dto/pooling.dto';
import type { CreatePoolCommand } from '../commands/create-pool.command';

export class CreatePoolHandler {
  constructor(
    private readonly routeRepository: IRouteRepository,
    private readonly poolRepository: IPoolRepository,
  ) {}

  async execute(command: CreatePoolCommand): Promise<PoolResultDto[]> {
    // Resolve CB for each ship
    const inputs: PoolMemberInput[] = [];
    for (const shipId of command.memberShipIds) {
      const route = await this.routeRepository.findByRouteId(shipId);
      if (!route) throw new NotFoundError('Route (ship)', shipId);

      const energy = ComplianceCalculatorService.calculateEnergy(route.fuelConsumption);
      const cb = ComplianceCalculatorService.calculateCB(route.ghgIntensity, energy);
      inputs.push({ shipId, cb });
    }

    // Run pure-domain pool algorithm (throws if Σ(CB) < 0)
    let allocations;
    try {
      allocations = ComplianceCalculatorService.allocatePool(inputs);
    } catch (err) {
      throw new DomainError(err instanceof Error ? err.message : 'Pool allocation failed.');
    }

    const poolId = randomUUID();
    const poolMembers = allocations.map((a) => ({
      poolId,
      shipId: a.shipId,
      cbBefore: a.cbBefore,
      cbAfter: a.cbAfter,
    }));

    const pool = new Pool({
      id: poolId,
      year: command.year,
      createdAt: new Date(),
      members: poolMembers,
    });

    await this.poolRepository.create(pool, poolMembers);

    return allocations.map((a) => ({
      shipId: a.shipId,
      cbBefore: a.cbBefore,
      cbAfter: a.cbAfter,
    }));
  }
}
