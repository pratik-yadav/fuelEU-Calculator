import type { FastifyInstance } from 'fastify';
import type { VesselController } from '../controllers/vessel.controller';

/**
 * registerVesselRoutes — binds all /vessels endpoints to controller methods.
 *
 * Prefix applied externally when registering in bootstrap (e.g. /api/v1/vessels).
 */
export function registerVesselRoutes(
  app: FastifyInstance,
  controller: VesselController,
): void {
  app.post(
    '/api/v1/vessels',
    (req, reply) => controller.create(req, reply),
  );

  app.get(
    '/api/v1/vessels',
    (req, reply) => controller.getAll(req as Parameters<typeof controller.getAll>[0], reply),
  );

  app.get(
    '/api/v1/vessels/:id',
    (req, reply) => controller.getById(req as Parameters<typeof controller.getById>[0], reply),
  );

  app.patch(
    '/api/v1/vessels/:id',
    (req, reply) => controller.update(req as Parameters<typeof controller.update>[0], reply),
  );

  app.delete(
    '/api/v1/vessels/:id',
    (req, reply) => controller.remove(req as Parameters<typeof controller.remove>[0], reply),
  );
}
