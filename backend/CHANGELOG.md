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
**Status**: ✅ Complete

### What was implemented
- `src/types/index.ts` — replaced Vessel types with `FuelType` and `VesselType` unions
- `src/domain/services/compliance-calculator.service.ts` — pure static service:
  - `calculateTtW`, `calculateGhgIntensity`, `calculateEnergy`, `calculateCB`
  - `calculatePercentDiff`, `isCompliant`, `allocatePool` (greedy Article 21 algorithm)
  - Constants: `GHG_TARGET = 89.33680`, GWP values, fuel params for HFO/MDO
- `src/domain/entities/route.entity.ts` — Route aggregate root (`setAsBaseline`, `clearBaseline`)
- `src/domain/entities/ship-compliance.entity.ts` — ShipCompliance (`hasSurplus`, `hasDeficit`)
- `src/domain/entities/bank-entry.entity.ts` — BankEntry with signed `amountGco2eq`
- `src/domain/entities/pool.entity.ts` — Pool + PoolMemberProps
- Repository interfaces: `IRouteRepository`, `IShipComplianceRepository`, `IBankEntryRepository`, `IPoolRepository`

---

## Phase 2 — Application Layer

**Date**: 2026-03-19
**Status**: ✅ Complete

### What was implemented
- **DTOs**: `route.dto.ts`, `compliance.dto.ts`, `banking.dto.ts` (Zod), `pooling.dto.ts` (Zod)
- **Commands**: `SetBaselineCommand`, `BankComplianceCommand`, `ApplyBankCommand`, `CreatePoolCommand`
- **Command Handlers**:
  - `SetBaselineHandler` — clears all baselines, sets new one
  - `BankComplianceHandler` — validates CB > 0, amount ≤ available surplus
  - `ApplyBankHandler` — validates CB < 0, netBanked > 0, amount ≤ netBanked
  - `CreatePoolHandler` — resolves CB per ship, calls allocatePool(), persists
- **Queries**: `GetAllRoutesQuery`, `GetRouteComparisonQuery`, `GetComplianceBalanceQuery`, `GetAdjustedCBQuery`, `GetBankingRecordsQuery`
- **Query Handlers**: one per query, compute-and-cache pattern for compliance

---

## Phase 3 — Infrastructure Layer

**Date**: 2026-03-19
**Status**: ✅ Complete

### What was implemented
- `prisma/schema.prisma` — 5 models: Route, ShipCompliance, BankEntry, Pool, PoolMember
  - ShipCompliance `@@unique([shipId, year])` for upsert-friendly CB caching
  - PoolMember composite PK `[poolId, shipId]`
  - BankEntry signed float `amountGco2eq` (positive=banked, negative=applied)
- `src/infra/repositories/route.repository.impl.ts` — `PrismaRouteRepository`
- `src/infra/repositories/ship-compliance.repository.impl.ts` — `PrismaShipComplianceRepository`
- `src/infra/repositories/bank-entry.repository.impl.ts` — `PrismaBankEntryRepository`
- `src/infra/repositories/pool.repository.impl.ts` — `PrismaPoolRepository`
- `src/infra/database/seed.ts` — 5 routes (R001–R005), R001=HFO is baseline

---

## Phase 4 — Interface Layer

**Date**: 2026-03-19
**Status**: ✅ Complete

### What was implemented
- **Controllers**: `RouteController`, `ComplianceController`, `BankingController`, `PoolingController`
- **Routes**: `route.routes.ts`, `compliance.routes.ts`, `banking.routes.ts`, `pooling.routes.ts`
- All 9 endpoints per API spec:
  - `GET /routes`, `POST /routes/:id/baseline`, `GET /routes/comparison`
  - `GET /compliance/cb`, `GET /compliance/adjusted-cb`
  - `GET /banking/records`, `POST /banking/bank`, `POST /banking/apply`
  - `POST /pools`

---

## Phase 5 — Bootstrap & Wiring

**Date**: 2026-03-19
**Status**: ✅ Complete

### What was implemented
- `src/bootstrap/app.ts` — full composition root:
  1. Prisma client
  2. 4 repositories (Route, ShipCompliance, BankEntry, Pool)
  3. 4 command handlers + 5 query handlers (injected with repos)
  4. 4 controllers
  5. 4 route registrations
  6. Global error handler (AppError → HTTP status, ZodError → 400, Error → 500)
- `package.json` — added `db:seed`, `test`, `test:watch` scripts; added vitest + supertest devDeps
- `vitest.config.ts` — test config (node env, coverage via v8)

---

## Phase 6 — Tests

**Date**: 2026-03-19
**Status**: ✅ Complete

### What was implemented
- **Unit tests** (`src/__tests__/unit/`):
  - `compliance-calculator.service.test.ts` — GHG formulas, CB, percentDiff, pool algorithm
  - `bank-validation.test.ts` — over-banking, no-surplus, no-balance, apply-exceeds
  - `pool-validation.test.ts` — negative-sum rejection, greedy distribution, not-found
- **Integration tests** (`src/__tests__/integration/`):
  - `routes.test.ts` — GET /routes, GET /routes/comparison, POST /routes/:id/baseline
  - `compliance.test.ts` — GET /compliance/cb, GET /compliance/adjusted-cb
  - `banking.test.ts` — POST /banking/bank, POST /banking/apply, GET /banking/records
  - `pooling.test.ts` — POST /pools (valid, negative CB pool, min-members, missing year)
- All integration tests use mock repositories (no real DB)
- `buildTestApp` helper for injecting mocks into Fastify

---

## Quick Start

```bash
cd backend
npm install
cp .env.example .env          # Set DATABASE_URL
npm run db:push               # Push schema to DB
npm run db:seed               # Seed 5 routes
npm run dev                   # Start dev server on :3000
npm run test                  # Run all tests
```
