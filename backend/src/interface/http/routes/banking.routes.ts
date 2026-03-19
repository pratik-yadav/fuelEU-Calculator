import type { FastifyInstance } from 'fastify';
import type { BankingController } from '../controllers/banking.controller';

export function registerBankingRoutes(app: FastifyInstance, controller: BankingController): void {
  app.get('/banking/records', (req, reply) => controller.getRecords(req, reply));
  app.post('/banking/bank', (req, reply) => controller.bank(req, reply));
  app.post('/banking/apply', (req, reply) => controller.apply(req, reply));
}
