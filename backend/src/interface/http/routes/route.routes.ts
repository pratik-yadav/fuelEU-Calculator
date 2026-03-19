import type { FastifyInstance } from 'fastify';
import type { RouteController } from '../controllers/route.controller';

export function registerRouteRoutes(app: FastifyInstance, controller: RouteController): void {
  app.get('/routes', (req, reply) => controller.getAll(req, reply));
  app.post('/routes/:id/baseline', (req, reply) => controller.setBaseline(req as never, reply));
  app.get('/routes/comparison', (req, reply) => controller.getComparison(req, reply));
}
