import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { SetBaselineHandler } from '../../../application/command-handler/set-baseline.handler';
import { BankComplianceHandler } from '../../../application/command-handler/bank-compliance.handler';
import { ApplyBankHandler } from '../../../application/command-handler/apply-bank.handler';
import { CreatePoolHandler } from '../../../application/command-handler/create-pool.handler';

import { GetAllRoutesHandler } from '../../../application/query-handlers/get-all-routes.handler';
import { GetRouteComparisonHandler } from '../../../application/query-handlers/get-route-comparison.handler';
import { GetComplianceBalanceHandler } from '../../../application/query-handlers/get-compliance-balance.handler';
import { GetAdjustedCBHandler } from '../../../application/query-handlers/get-adjusted-cb.handler';
import { GetBankingRecordsHandler } from '../../../application/query-handlers/get-banking-records.handler';

import { RouteController } from '../../../interface/http/controllers/route.controller';
import { ComplianceController } from '../../../interface/http/controllers/compliance.controller';
import { BankingController } from '../../../interface/http/controllers/banking.controller';
import { PoolingController } from '../../../interface/http/controllers/pooling.controller';

import { registerRouteRoutes } from '../../../interface/http/routes/route.routes';
import { registerComplianceRoutes } from '../../../interface/http/routes/compliance.routes';
import { registerBankingRoutes } from '../../../interface/http/routes/banking.routes';
import { registerPoolingRoutes } from '../../../interface/http/routes/pooling.routes';

import { AppError } from '../../../utils/error.util';
import { errorResponse } from '../../../utils/response.util';

import type { IRouteRepository } from '../../../domain/repositories/route.repository';
import type { IShipComplianceRepository } from '../../../domain/repositories/ship-compliance.repository';
import type { IBankEntryRepository } from '../../../domain/repositories/bank-entry.repository';
import type { IPoolRepository } from '../../../domain/repositories/pool.repository';

export interface TestRepos {
  routeRepo: IRouteRepository;
  complianceRepo: IShipComplianceRepository;
  bankRepo: IBankEntryRepository;
  poolRepo: IPoolRepository;
}

export async function buildTestApp(repos: TestRepos): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  const setBaselineHandler = new SetBaselineHandler(repos.routeRepo);
  const bankComplianceHandler = new BankComplianceHandler(repos.routeRepo, repos.complianceRepo, repos.bankRepo);
  const applyBankHandler = new ApplyBankHandler(repos.routeRepo, repos.bankRepo);
  const createPoolHandler = new CreatePoolHandler(repos.routeRepo, repos.poolRepo);

  const getAllRoutesHandler = new GetAllRoutesHandler(repos.routeRepo);
  const getRouteComparisonHandler = new GetRouteComparisonHandler(repos.routeRepo);
  const getComplianceBalanceHandler = new GetComplianceBalanceHandler(repos.routeRepo, repos.complianceRepo);
  const getAdjustedCBHandler = new GetAdjustedCBHandler(repos.routeRepo, repos.complianceRepo, repos.bankRepo);
  const getBankingRecordsHandler = new GetBankingRecordsHandler(repos.bankRepo);

  const routeController = new RouteController(getAllRoutesHandler, getRouteComparisonHandler, setBaselineHandler);
  const complianceController = new ComplianceController(getComplianceBalanceHandler, getAdjustedCBHandler);
  const bankingController = new BankingController(getBankingRecordsHandler, bankComplianceHandler, applyBankHandler);
  const poolingController = new PoolingController(createPoolHandler);

  registerRouteRoutes(app, routeController);
  registerComplianceRoutes(app, complianceController);
  registerBankingRoutes(app, bankingController);
  registerPoolingRoutes(app, poolingController);

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send(errorResponse(error.message, error.statusCode, error.details));
      return;
    }
    if (error instanceof ZodError) {
      reply.status(400).send(errorResponse('Validation failed.', 400, error.errors));
      return;
    }
    reply.status(500).send(errorResponse(String(error.message), 500));
  });

  return app;
}
