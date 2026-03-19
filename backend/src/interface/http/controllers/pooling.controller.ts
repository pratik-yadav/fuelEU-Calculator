import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CreatePoolHandler } from '../../../application/command-handler/create-pool.handler';
import { CreatePoolCommand } from '../../../application/commands/create-pool.command';
import { CreatePoolSchema } from '../../../application/dto/pooling.dto';
import { successResponse } from '../../../utils/response.util';
import { ValidationError } from '../../../utils/error.util';

export class PoolingController {
  constructor(private readonly createPoolHandler: CreatePoolHandler) {}

  async createPool(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = CreatePoolSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError(parsed.error.message);

    const { year, members } = parsed.data;
    const command = new CreatePoolCommand(year, members);
    const result = await this.createPoolHandler.execute(command);
    reply.status(201).send(successResponse(result));
  }
}
