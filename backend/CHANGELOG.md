# CHANGELOG — VarunaMarine FuelEU Backend

All phases are documented here in chronological order.

---

## [Unreleased]

---

## Phase 0 — Scaffold & Setup

**Date**: 2026-03-19
**Status**: ✅ Complete

### What was implemented
- Fastify + TypeScript + Prisma project scaffold
- DDD + Hexagonal Architecture folder structure:
  `domain/ application/ infra/ interface/ bootstrap/ types/ utils/`
- `package.json` with all dependencies (fastify, @fastify/cors, @fastify/helmet, @prisma/client, zod, tsx)
- `tsconfig.json` — CommonJS target, strict mode
- `.env.example` — DATABASE_URL, PORT, HOST, NODE_ENV
- `CLAUDE.md` — project context for AI-assisted development
- `.claude/agents/` — sub-agent definitions for domain, infra, API layers

### Notes
- Initial scaffold used `Vessel` as example domain; replaced by FuelEU domain in Phase 1+

---

## Phase 1 — Domain Layer

**Date**: 2026-03-19
**Status**: 🔄 In Progress

### What will be implemented
- `Route` entity (aggregate root)
- `ShipCompliance` entity
- `BankEntry` entity
- `Pool` + `PoolMember` entities
- `ComplianceCalculatorService` (pure domain service — all FuelEU formulas)
- Repository interfaces: `IRouteRepository`, `IShipComplianceRepository`,
  `IBankEntryRepository`, `IPoolRepository`
- Updated `src/types/index.ts` with FuelEU-specific types

---

## Phase 2 — Application Layer

**Date**: 2026-03-19
**Status**: ⏳ Pending

### What will be implemented
- **Commands**: SetBaseline, BankCompliance, ApplyBank, CreatePool
- **Command Handlers**: one per command
- **Queries**: GetAllRoutes, GetRouteComparison, GetComplianceBalance,
  GetAdjustedCB, GetBankingRecords
- **Query Handlers**: one per query
- **DTOs**: route.dto, compliance.dto, banking.dto, pooling.dto

---

## Phase 3 — Infrastructure Layer

**Date**: 2026-03-19
**Status**: ⏳ Pending

### What will be implemented
- `prisma/schema.prisma` — 5 models: Route, ShipCompliance, BankEntry, Pool, PoolMember
- `PrismaRouteRepository`, `PrismaShipComplianceRepository`,
  `PrismaBankEntryRepository`, `PrismaPoolRepository`
- `src/infra/database/seed.ts` — 5 seed routes (R001–R005), R001 is baseline

---

## Phase 4 — Interface Layer

**Date**: 2026-03-19
**Status**: ⏳ Pending

### What will be implemented
- **Controllers**: RouteController, ComplianceController, BankingController, PoolingController
- **Routes**: route.routes, compliance.routes, banking.routes, pooling.routes
- All endpoints per API spec in backend.md

---

## Phase 5 — Bootstrap & Wiring

**Date**: 2026-03-19
**Status**: ⏳ Pending

### What will be implemented
- Updated `src/bootstrap/app.ts` — full composition root for all 4 domains
- Updated `src/main.ts` — graceful shutdown, env validation

---

## Phase 6 — Tests

**Date**: 2026-03-19
**Status**: ⏳ Pending

### What will be implemented
- Unit tests (Vitest): ComplianceCalculatorService, pool algorithm, bank validation
- Integration tests (Supertest/inject): all API endpoints
- Edge cases: negative CB, over-banking, invalid pool (sum < 0)
