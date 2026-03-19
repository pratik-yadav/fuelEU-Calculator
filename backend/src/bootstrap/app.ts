import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ZodError } from 'zod';

import { getPrismaClient } from '../infra/database/prisma.client';

// ── Repositories ────────────────────────────────────────────────────────────
import { PrismaRouteRepository } from '../infra/repositories/route.repository.impl';
import { PrismaShipComplianceRepository } from '../infra/repositories/ship-compliance.repository.impl';
import { PrismaBankEntryRepository } from '../infra/repositories/bank-entry.repository.impl';
import { PrismaPoolRepository } from '../infra/repositories/pool.repository.impl';

// ── Command Handlers ─────────────────────────────────────────────────────────
import { SetBaselineHandler } from '../application/command-handler/set-baseline.handler';
import { BankComplianceHandler } from '../application/command-handler/bank-compliance.handler';
import { ApplyBankHandler } from '../application/command-handler/apply-bank.handler';
import { CreatePoolHandler } from '../application/command-handler/create-pool.handler';

// ── Query Handlers ────────────────────────────────────────────────────────────
import { GetAllRoutesHandler } from '../application/query-handlers/get-all-routes.handler';
import { GetRouteComparisonHandler } from '../application/query-handlers/get-route-comparison.handler';
import { GetComplianceBalanceHandler } from '../application/query-handlers/get-compliance-balance.handler';
import { GetAdjustedCBHandler } from '../application/query-handlers/get-adjusted-cb.handler';
import { GetBankingRecordsHandler } from '../application/query-handlers/get-banking-records.handler';

// ── Controllers ───────────────────────────────────────────────────────────────
import { RouteController } from '../interface/http/controllers/route.controller';
import { ComplianceController } from '../interface/http/controllers/compliance.controller';
import { BankingController } from '../interface/http/controllers/banking.controller';
import { PoolingController } from '../interface/http/controllers/pooling.controller';

// ── Routes ────────────────────────────────────────────────────────────────────
import { registerRouteRoutes } from '../interface/http/routes/route.routes';
import { registerComplianceRoutes } from '../interface/http/routes/compliance.routes';
import { registerBankingRoutes } from '../interface/http/routes/banking.routes';
import { registerPoolingRoutes } from '../interface/http/routes/pooling.routes';

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
  const routeRepository = new PrismaRouteRepository(prisma);
  const complianceRepository = new PrismaShipComplianceRepository(prisma);
  const bankEntryRepository = new PrismaBankEntryRepository(prisma);
  const poolRepository = new PrismaPoolRepository(prisma);

  // ── Application — Command Handlers ───────────────────────────────────────
  const setBaselineHandler = new SetBaselineHandler(routeRepository);
  const bankComplianceHandler = new BankComplianceHandler(
    routeRepository,
    complianceRepository,
    bankEntryRepository,
  );
  const applyBankHandler = new ApplyBankHandler(routeRepository, bankEntryRepository);
  const createPoolHandler = new CreatePoolHandler(routeRepository, poolRepository);

  // ── Application — Query Handlers ──────────────────────────────────────────
  const getAllRoutesHandler = new GetAllRoutesHandler(routeRepository);
  const getRouteComparisonHandler = new GetRouteComparisonHandler(routeRepository);
  const getComplianceBalanceHandler = new GetComplianceBalanceHandler(
    routeRepository,
    complianceRepository,
  );
  const getAdjustedCBHandler = new GetAdjustedCBHandler(
    routeRepository,
    complianceRepository,
    bankEntryRepository,
  );
  const getBankingRecordsHandler = new GetBankingRecordsHandler(bankEntryRepository);

  // ── Interface (Controllers + Routes) ─────────────────────────────────────
  const routeController = new RouteController(
    getAllRoutesHandler,
    getRouteComparisonHandler,
    setBaselineHandler,
  );

  const complianceController = new ComplianceController(
    getComplianceBalanceHandler,
    getAdjustedCBHandler,
  );

  const bankingController = new BankingController(
    getBankingRecordsHandler,
    bankComplianceHandler,
    applyBankHandler,
  );

  const poolingController = new PoolingController(createPoolHandler);

  registerRouteRoutes(app, routeController);
  registerComplianceRoutes(app, complianceController);
  registerBankingRoutes(app, bankingController);
  registerPoolingRoutes(app, poolingController);

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error);

    if (error instanceof AppError) {
      reply
        .status(error.statusCode)
        .send(errorResponse(error.message, error.statusCode, error.details));
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send(errorResponse('Validation failed.', 400, error.errors));
      return;
    }

    reply.status(500).send(errorResponse('An unexpected error occurred.', 500));
  });

  return app;
}
