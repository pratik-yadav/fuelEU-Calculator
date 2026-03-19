import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetBankingRecordsHandler } from '../../../application/query-handlers/get-banking-records.handler';
import type { BankComplianceHandler } from '../../../application/command-handler/bank-compliance.handler';
import type { ApplyBankHandler } from '../../../application/command-handler/apply-bank.handler';
import { GetBankingRecordsQuery } from '../../../application/queries/get-banking-records.query';
import { BankComplianceCommand } from '../../../application/commands/bank-compliance.command';
import { ApplyBankCommand } from '../../../application/commands/apply-bank.command';
import { BankRequestSchema } from '../../../application/dto/banking.dto';
import { successResponse } from '../../../utils/response.util';
import { ValidationError } from '../../../utils/error.util';

export class BankingController {
  constructor(
    private readonly getBankingRecordsHandler: GetBankingRecordsHandler,
    private readonly bankComplianceHandler: BankComplianceHandler,
    private readonly applyBankHandler: ApplyBankHandler,
  ) {}

  async getRecords(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { shipId, year } = req.query as { shipId?: string; year?: string };
    if (!shipId) throw new ValidationError('shipId query parameter is required.');
    if (!year) throw new ValidationError('year query parameter is required.');

    const query = new GetBankingRecordsQuery(shipId, parseInt(year, 10));
    const records = await this.getBankingRecordsHandler.execute(query);
    reply.send(successResponse(records));
  }

  async bank(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = BankRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError(parsed.error.message);

    const { shipId, year, amount } = parsed.data;
    const command = new BankComplianceCommand(shipId, year, amount);
    const entry = await this.bankComplianceHandler.execute(command);
    reply.status(201).send(successResponse(entry));
  }

  async apply(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = BankRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new ValidationError(parsed.error.message);

    const { shipId, year, amount } = parsed.data;
    const command = new ApplyBankCommand(shipId, year, amount);
    const entry = await this.applyBankHandler.execute(command);
    reply.status(201).send(successResponse(entry));
  }
}
