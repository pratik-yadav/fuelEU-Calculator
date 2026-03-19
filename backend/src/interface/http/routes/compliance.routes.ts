import type { FastifyInstance } from 'fastify';
import type { ComplianceController } from '../controllers/compliance.controller';

export function registerComplianceRoutes(
  app: FastifyInstance,
  controller: ComplianceController,
): void {
  app.get('/compliance/cb', (req, reply) => controller.getCB(req, reply));
  app.get('/compliance/adjusted-cb', (req, reply) => controller.getAdjustedCB(req, reply));
}
