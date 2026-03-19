import type { FastifyInstance } from 'fastify';
import type { PoolingController } from '../controllers/pooling.controller';

export function registerPoolingRoutes(app: FastifyInstance, controller: PoolingController): void {
  app.post('/pools', (req, reply) => controller.createPool(req, reply));
}
