import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetComplianceBalanceHandler } from '../../../application/query-handlers/get-compliance-balance.handler';
import type { GetAdjustedCBHandler } from '../../../application/query-handlers/get-adjusted-cb.handler';
import { GetComplianceBalanceQuery } from '../../../application/queries/get-compliance-balance.query';
import { GetAdjustedCBQuery } from '../../../application/queries/get-adjusted-cb.query';
import { successResponse } from '../../../utils/response.util';
import { ValidationError } from '../../../utils/error.util';

export class ComplianceController {
  constructor(
    private readonly getComplianceBalanceHandler: GetComplianceBalanceHandler,
    private readonly getAdjustedCBHandler: GetAdjustedCBHandler,
  ) {}

  async getCB(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { shipId, year } = req.query as { shipId?: string; year?: string };
    if (!shipId) throw new ValidationError('shipId query parameter is required.');
    if (!year) throw new ValidationError('year query parameter is required.');

    const query = new GetComplianceBalanceQuery(shipId, parseInt(year, 10));
    const result = await this.getComplianceBalanceHandler.execute(query);
    reply.send(successResponse(result));
  }

  async getAdjustedCB(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { shipId, year } = req.query as { shipId?: string; year?: string };
    if (!shipId) throw new ValidationError('shipId query parameter is required.');
    if (!year) throw new ValidationError('year query parameter is required.');

    const query = new GetAdjustedCBQuery(shipId, parseInt(year, 10));
    const result = await this.getAdjustedCBHandler.execute(query);
    reply.send(successResponse(result));
  }
}
