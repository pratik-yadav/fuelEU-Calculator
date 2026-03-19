import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetAllRoutesHandler } from '../../../application/query-handlers/get-all-routes.handler';
import type { GetRouteComparisonHandler } from '../../../application/query-handlers/get-route-comparison.handler';
import type { SetBaselineHandler } from '../../../application/command-handler/set-baseline.handler';
import { GetAllRoutesQuery } from '../../../application/queries/get-all-routes.query';
import { GetRouteComparisonQuery } from '../../../application/queries/get-route-comparison.query';
import { SetBaselineCommand } from '../../../application/commands/set-baseline.command';
import { successResponse } from '../../../utils/response.util';

export class RouteController {
  constructor(
    private readonly getAllRoutesHandler: GetAllRoutesHandler,
    private readonly getRouteComparisonHandler: GetRouteComparisonHandler,
    private readonly setBaselineHandler: SetBaselineHandler,
  ) {}

  async getAll(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { fuelType, year } = req.query as { fuelType?: string; year?: string };
    const query = new GetAllRoutesQuery({
      fuelType,
      year: year ? parseInt(year, 10) : undefined,
    });
    const routes = await this.getAllRoutesHandler.execute(query);
    reply.send(successResponse(routes));
  }

  async setBaseline(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const command = new SetBaselineCommand(req.params.id);
    const route = await this.setBaselineHandler.execute(command);
    reply.send(successResponse(route));
  }

  async getComparison(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = new GetRouteComparisonQuery();
    const comparison = await this.getRouteComparisonHandler.execute(query);
    reply.send(successResponse(comparison));
  }
}
