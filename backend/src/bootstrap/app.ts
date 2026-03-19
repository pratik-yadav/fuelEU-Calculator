import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ZodError } from 'zod';

import { getPrismaClient } from '../infra/database/prisma.client';
import { PrismaVesselRepository } from '../infra/repositories/vessel.repository.impl';

import { CreateVesselHandler } from '../application/command-handler/create-vessel.handler';
import { UpdateVesselHandler } from '../application/command-handler/update-vessel.handler';
import { DeleteVesselHandler } from '../application/command-handler/delete-vessel.handler';
import { GetVesselByIdHandler } from '../application/query-handlers/get-vessel-by-id.handler';
import { GetAllVesselsHandler } from '../application/query-handlers/get-all-vessels.handler';

import { VesselController } from '../interface/http/controllers/vessel.controller';
import { registerVesselRoutes } from '../interface/http/routes/vessel.routes';

import { AppError } from '../utils/error.util';
import { errorResponse } from '../utils/response.util';

/**
 * buildApp — Composition Root (Hexagonal Architecture wiring).
 *
 * Order of operations:
 *   1. Create Fastify instance & register plugins
 *   2. Instantiate infrastructure adapters (DB, repositories)
 *   3. Instantiate application use-case handlers (injecting ports)
 *   4. Instantiate interface-layer controllers (injecting handlers)
 *   5. Register HTTP routes
 *   6. Register global error handler
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
    },
  });

  // ── Plugins ──────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(helmet);

  // ── Health-check ─────────────────────────────────────────────────────────
  app.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Infrastructure (Adapters) ─────────────────────────────────────────────
  const prisma = getPrismaClient();
  const vesselRepository = new PrismaVesselRepository(prisma);

  // ── Application (Use-cases) ───────────────────────────────────────────────
  const createVesselHandler = new CreateVesselHandler(vesselRepository);
  const updateVesselHandler = new UpdateVesselHandler(vesselRepository);
  const deleteVesselHandler = new DeleteVesselHandler(vesselRepository);
  const getVesselByIdHandler = new GetVesselByIdHandler(vesselRepository);
  const getAllVesselsHandler = new GetAllVesselsHandler(vesselRepository);

  // ── Interface (Controllers + Routes) ─────────────────────────────────────
  const vesselController = new VesselController(
    createVesselHandler,
    updateVesselHandler,
    deleteVesselHandler,
    getVesselByIdHandler,
    getAllVesselsHandler,
  );

  registerVesselRoutes(app, vesselController);

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error);

    if (error instanceof AppError) {
      reply.status(error.statusCode).send(
        errorResponse(error.message, error.statusCode, error.details),
      );
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send(errorResponse('Validation failed.', 400, error.errors));
      return;
    }

    reply
      .status(500)
      .send(errorResponse('An unexpected error occurred.', 500));
  });

  return app;
}
