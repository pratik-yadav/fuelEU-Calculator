# AGENT_WORKFLOW.md — Adding Features to the FuelEU Backend

This document is a step-by-step recipe for adding any new feature to the backend.
Follow the layers in order: **Domain → Application → Infrastructure → Interface → Bootstrap → Tests**.

---

## Architecture Refresher

The dependency flow is strictly one-directional:

```
Interface (HTTP)
    ↓
Application (Commands / Queries / Handlers)
    ↓
Domain (Entities / Services / Repository Interfaces)
    ↑
Infrastructure (Prisma implementations)
    ↑
Bootstrap (wires everything together)
```

**Rules that must never be broken:**
- `domain/` and `application/` never import from `infra/` or `interface/`
- `infra/` only imports from `domain/`
- `bootstrap/app.ts` is the only file allowed to instantiate concrete classes

---

## Step-by-Step Workflow

### Example Feature: "Voyage Logs"
> Imagine you are adding a new `VoyageLog` concept — ships log a voyage, and you can list them.
> Substitute your own entity name throughout.

---

### Step 1 — Domain: Entity

**File:** `src/domain/entities/voyage-log.entity.ts`

```typescript
export interface VoyageLogProps {
  id: string;
  shipId: string;
  departure: string;
  destination: string;
  distanceNm: number;
  loggedAt: Date;
}

export class VoyageLog {
  private readonly _id: string;
  private readonly _shipId: string;
  private readonly _departure: string;
  private readonly _destination: string;
  private readonly _distanceNm: number;
  private readonly _loggedAt: Date;

  constructor(props: VoyageLogProps) {
    VoyageLog.validate(props);
    this._id = props.id;
    this._shipId = props.shipId;
    this._departure = props.departure;
    this._destination = props.destination;
    this._distanceNm = props.distanceNm;
    this._loggedAt = props.loggedAt;
  }

  private static validate(props: VoyageLogProps): void {
    if (props.distanceNm <= 0) {
      throw new Error('Distance must be positive');
    }
  }

  get id() { return this._id; }
  get shipId() { return this._shipId; }
  get departure() { return this._departure; }
  get destination() { return this._destination; }
  get distanceNm() { return this._distanceNm; }
  get loggedAt() { return this._loggedAt; }
}
```

**Checklist:**
- [ ] `Props` interface for the constructor input
- [ ] Private readonly fields + public getters (immutability)
- [ ] Static `validate()` throws plain `Error` (no framework imports)
- [ ] Domain methods for state changes (e.g., `markAsReviewed()`) if needed
- [ ] Zero imports from `infra/`, `interface/`, or any framework

---

### Step 2 — Domain: Repository Interface (Port)

**File:** `src/domain/repositories/voyage-log.repository.ts`

```typescript
import type { VoyageLog } from '../entities/voyage-log.entity';

export interface IVoyageLogRepository {
  findAll(shipId?: string): Promise<VoyageLog[]>;
  findById(id: string): Promise<VoyageLog | null>;
  create(log: VoyageLog): Promise<VoyageLog>;
}
```

**Checklist:**
- [ ] Prefix with `I` (e.g., `IVoyageLogRepository`)
- [ ] Methods return domain entities, not Prisma rows
- [ ] Only imports from `domain/entities/`
- [ ] No implementation — this is a pure interface (port)

---

### Step 3 — Application: DTO + Mapper

**File:** `src/application/dto/voyage-log.dto.ts`

```typescript
import type { VoyageLog } from '../../domain/entities/voyage-log.entity';

export interface VoyageLogResponseDto {
  id: string;
  shipId: string;
  departure: string;
  destination: string;
  distanceNm: number;
  loggedAt: string;  // ISO string for JSON serialization
}

export class VoyageLogMapper {
  static toDto(entity: VoyageLog): VoyageLogResponseDto {
    return {
      id: entity.id,
      shipId: entity.shipId,
      departure: entity.departure,
      destination: entity.destination,
      distanceNm: entity.distanceNm,
      loggedAt: entity.loggedAt.toISOString(),
    };
  }

  static toDtoList(entities: VoyageLog[]): VoyageLogResponseDto[] {
    return entities.map(VoyageLogMapper.toDto);
  }
}
```

**For commands with request bodies, add a Zod schema here too:**

```typescript
import { z } from 'zod';

export const CreateVoyageLogSchema = z.object({
  shipId: z.string().min(1),
  departure: z.string().min(1),
  destination: z.string().min(1),
  distanceNm: z.number().positive(),
});

export type CreateVoyageLogInput = z.infer<typeof CreateVoyageLogSchema>;
```

**Checklist:**
- [ ] DTO interface reflects what the API consumer sees (not the entity shape)
- [ ] Mapper has static `toDto()` and `toDtoList()` methods
- [ ] Date fields converted to ISO strings
- [ ] Zod schema defined here if the endpoint takes a request body
- [ ] Only imports from `domain/entities/`

---

### Step 4 — Application: Commands (write operations)

One file per operation. Commands are plain objects — no logic.

**File:** `src/application/commands/create-voyage-log.command.ts`

```typescript
export class CreateVoyageLogCommand {
  constructor(
    public readonly shipId: string,
    public readonly departure: string,
    public readonly destination: string,
    public readonly distanceNm: number,
  ) {}
}
```

**File:** `src/application/command-handler/create-voyage-log.handler.ts`

```typescript
import { randomUUID } from 'crypto';
import { VoyageLog } from '../../domain/entities/voyage-log.entity';
import type { IVoyageLogRepository } from '../../domain/repositories/voyage-log.repository';
import type { CreateVoyageLogCommand } from '../commands/create-voyage-log.command';
import { VoyageLogMapper, type VoyageLogResponseDto } from '../dto/voyage-log.dto';

export class CreateVoyageLogHandler {
  constructor(private readonly voyageLogRepository: IVoyageLogRepository) {}

  async execute(command: CreateVoyageLogCommand): Promise<VoyageLogResponseDto> {
    const log = new VoyageLog({
      id: randomUUID(),
      shipId: command.shipId,
      departure: command.departure,
      destination: command.destination,
      distanceNm: command.distanceNm,
      loggedAt: new Date(),
    });

    const saved = await this.voyageLogRepository.create(log);
    return VoyageLogMapper.toDto(saved);
  }
}
```

**Checklist:**
- [ ] Command = data carrier only (no logic, no imports of repos)
- [ ] Handler receives **repository interfaces** via constructor (not concrete classes)
- [ ] Handler creates the domain entity, calls the domain method if needed, then persists
- [ ] Handler returns a DTO, never a domain entity
- [ ] Throw `DomainError` (422) or `NotFoundError` (404) from `utils/error.util.ts` for business rule violations

---

### Step 5 — Application: Queries (read operations)

**File:** `src/application/queries/get-voyage-logs.query.ts`

```typescript
export class GetVoyageLogsQuery {
  constructor(public readonly shipId?: string) {}
}
```

**File:** `src/application/query-handlers/get-voyage-logs.handler.ts`

```typescript
import type { IVoyageLogRepository } from '../../domain/repositories/voyage-log.repository';
import type { GetVoyageLogsQuery } from '../queries/get-voyage-logs.query';
import { VoyageLogMapper, type VoyageLogResponseDto } from '../dto/voyage-log.dto';

export class GetVoyageLogsHandler {
  constructor(private readonly voyageLogRepository: IVoyageLogRepository) {}

  async execute(query: GetVoyageLogsQuery): Promise<VoyageLogResponseDto[]> {
    const logs = await this.voyageLogRepository.findAll(query.shipId);
    return VoyageLogMapper.toDtoList(logs);
  }
}
```

**Checklist:**
- [ ] Query = data carrier with optional filter params
- [ ] Handler only reads — never creates, updates, or deletes
- [ ] Returns DTOs

---

### Step 6 — Infrastructure: Prisma Schema

**File:** `prisma/schema.prisma` — add your new model

```prisma
model VoyageLog {
  id          String   @id @default(uuid())
  shipId      String   @map("ship_id")
  departure   String
  destination String
  distanceNm  Float    @map("distance_nm")
  loggedAt    DateTime @default(now()) @map("logged_at")

  @@map("voyage_logs")
}
```

Then run:
```bash
npm run db:push       # dev (no migration file)
# or
npm run db:migrate    # production (creates migration file)
npm run db:generate   # regenerate Prisma client types
```

**Checklist:**
- [ ] Use `@map("snake_case")` for all field names
- [ ] Use `@@map("table_name")` for the table
- [ ] Add `@@unique` if needed for upsert-friendly lookups
- [ ] Run `db:generate` after every schema change — handlers won't compile without it

---

### Step 7 — Infrastructure: Repository Implementation (Adapter)

**File:** `src/infra/repositories/voyage-log.repository.impl.ts`

```typescript
import type { PrismaClient } from '@prisma/client';
import { VoyageLog } from '../../domain/entities/voyage-log.entity';
import type { IVoyageLogRepository } from '../../domain/repositories/voyage-log.repository';

export class PrismaVoyageLogRepository implements IVoyageLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: {
    id: string;
    shipId: string;
    departure: string;
    destination: string;
    distanceNm: number;
    loggedAt: Date;
  }): VoyageLog {
    return new VoyageLog({
      id: row.id,
      shipId: row.shipId,
      departure: row.departure,
      destination: row.destination,
      distanceNm: row.distanceNm,
      loggedAt: row.loggedAt,
    });
  }

  async findAll(shipId?: string): Promise<VoyageLog[]> {
    const rows = await this.prisma.voyageLog.findMany({
      where: shipId ? { shipId } : undefined,
      orderBy: { loggedAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<VoyageLog | null> {
    const row = await this.prisma.voyageLog.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(log: VoyageLog): Promise<VoyageLog> {
    const row = await this.prisma.voyageLog.create({
      data: {
        id: log.id,
        shipId: log.shipId,
        departure: log.departure,
        destination: log.destination,
        distanceNm: log.distanceNm,
        loggedAt: log.loggedAt,
      },
    });
    return this.toDomain(row);
  }
}
```

**Checklist:**
- [ ] Class name: `Prisma<EntityName>Repository`
- [ ] Private `toDomain()` mapper — converts raw Prisma row to domain entity
- [ ] Implements the domain interface exactly
- [ ] Only uses `this.prisma.*` — no raw SQL
- [ ] For nested creates (parent → children), **do not pass the FK field** — Prisma injects it automatically
- [ ] For upsert: use `@@unique` composite key from schema as the `where` clause

---

### Step 8 — Interface: Controller

**File:** `src/interface/http/controllers/voyage-log.controller.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetVoyageLogsHandler } from '../../../application/query-handlers/get-voyage-logs.handler';
import type { CreateVoyageLogHandler } from '../../../application/command-handler/create-voyage-log.handler';
import { GetVoyageLogsQuery } from '../../../application/queries/get-voyage-logs.query';
import { CreateVoyageLogCommand } from '../../../application/commands/create-voyage-log.command';
import { CreateVoyageLogSchema } from '../../../application/dto/voyage-log.dto';
import { successResponse } from '../../../utils/response.util';
import { ValidationError } from '../../../utils/error.util';

export class VoyageLogController {
  constructor(
    private readonly getLogsHandler: GetVoyageLogsHandler,
    private readonly createLogHandler: CreateVoyageLogHandler,
  ) {}

  async getAll(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { shipId } = req.query as { shipId?: string };
    const result = await this.getLogsHandler.execute(new GetVoyageLogsQuery(shipId));
    reply.status(200).send(successResponse(result));
  }

  async create(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const parsed = CreateVoyageLogSchema.safeParse(req.body);
    if (!parsed.success) {
      throw parsed.error;  // caught by global ZodError handler → 400
    }
    const { shipId, departure, destination, distanceNm } = parsed.data;
    const result = await this.createLogHandler.execute(
      new CreateVoyageLogCommand(shipId, departure, destination, distanceNm),
    );
    reply.status(201).send(successResponse(result));
  }
}
```

**Checklist:**
- [ ] Constructor injects handler interfaces only — no repos, no Prisma
- [ ] Parse query params inline with type casting
- [ ] Use `Zod.safeParse()` for request bodies — throw `parsed.error` on failure
- [ ] Wrap result in `successResponse()` from `utils/response.util.ts`
- [ ] Set correct HTTP status code (`200` GET, `201` POST create, `204` delete)
- [ ] Throw `ValidationError` for missing required query params

---

### Step 9 — Interface: Route Registration

**File:** `src/interface/http/routes/voyage-log.routes.ts`

```typescript
import type { FastifyInstance } from 'fastify';
import type { VoyageLogController } from '../controllers/voyage-log.controller';

export function registerVoyageLogRoutes(
  app: FastifyInstance,
  controller: VoyageLogController,
): void {
  app.get('/voyage-logs', controller.getAll.bind(controller) as never);
  app.post('/voyage-logs', controller.create.bind(controller) as never);
}
```

**Checklist:**
- [ ] One file per domain
- [ ] Always `.bind(controller)` so `this` is correct inside the method
- [ ] Cast as `never` to satisfy Fastify's generic overloads
- [ ] Function signature: `(app, controller) => void`

---

### Step 10 — Bootstrap: Wire It All Together

**File:** `src/bootstrap/app.ts` — add in the correct order

```typescript
// 1. Add repository
const voyageLogRepository = new PrismaVoyageLogRepository(prisma);

// 2. Add handlers
const getVoyageLogsHandler = new GetVoyageLogsHandler(voyageLogRepository);
const createVoyageLogHandler = new CreateVoyageLogHandler(voyageLogRepository);

// 3. Add controller
const voyageLogController = new VoyageLogController(getVoyageLogsHandler, createVoyageLogHandler);

// 4. Register routes
registerVoyageLogRoutes(app, voyageLogController);
```

**Import order at the top of `app.ts`:**
```typescript
import { PrismaVoyageLogRepository } from '../infra/repositories/voyage-log.repository.impl';
import { GetVoyageLogsHandler } from '../application/query-handlers/get-voyage-logs.handler';
import { CreateVoyageLogHandler } from '../application/command-handler/create-voyage-log.handler';
import { VoyageLogController } from '../interface/http/controllers/voyage-log.controller';
import { registerVoyageLogRoutes } from '../interface/http/routes/voyage-log.routes';
```

**Checklist:**
- [ ] Follow the wiring order: Prisma → Repo → Handler(s) → Controller → Routes
- [ ] Pass **interface types** into handlers (TypeScript will verify the concrete class satisfies the interface)
- [ ] Add route registration after all controller instantiations

---

### Step 11 — Tests

#### Unit test for domain/application logic

**File:** `src/__tests__/unit/voyage-log-validation.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CreateVoyageLogHandler } from '../../../application/command-handler/create-voyage-log.handler';
import { CreateVoyageLogCommand } from '../../../application/commands/create-voyage-log.command';
import type { IVoyageLogRepository } from '../../../domain/repositories/voyage-log.repository';

function makeMockRepo(): IVoyageLogRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (log) => log),
  };
}

describe('CreateVoyageLogHandler', () => {
  it('creates a voyage log', async () => {
    const repo = makeMockRepo();
    const handler = new CreateVoyageLogHandler(repo);
    const result = await handler.execute(
      new CreateVoyageLogCommand('R001', 'Hamburg', 'Rotterdam', 350),
    );
    expect(result.shipId).toBe('R001');
    expect(result.distanceNm).toBe(350);
    expect(repo.create).toHaveBeenCalledOnce();
  });
});
```

#### Integration test for HTTP endpoints

**File:** `src/__tests__/integration/voyage-logs.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from './helpers/build-test-app';
// Add makeMockVoyageLogRepo to mock-repos.ts first

let app: FastifyInstance;

beforeEach(async () => {
  app = await buildTestApp({ /* existing repos + voyageLogRepo: makeMockVoyageLogRepo() */ });
  await app.ready();
});

describe('GET /voyage-logs', () => {
  it('returns 200 with an array', async () => {
    const res = await app.inject({ method: 'GET', url: '/voyage-logs' });
    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
    expect(Array.isArray(res.json().data)).toBe(true);
  });
});

describe('POST /voyage-logs', () => {
  it('creates a log and returns 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/voyage-logs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipId: 'R001', departure: 'Hamburg', destination: 'Rotterdam', distanceNm: 350 }),
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.shipId).toBe('R001');
  });

  it('returns 400 for missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/voyage-logs',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ shipId: 'R001' }),
    });
    expect(res.statusCode).toBe(400);
  });
});
```

**To support integration tests, add to `mock-repos.ts`:**
```typescript
export function makeMockVoyageLogRepo(): IVoyageLogRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(async (log) => log),
  };
}
```

**And extend `build-test-app.ts`** to accept and wire the new mock repo.

**Checklist:**
- [ ] Unit tests mock all repo methods using `vi.fn()`
- [ ] Integration tests use `app.inject()` — never call `supertest` directly
- [ ] Test both happy path and error cases (400, 404, 422)
- [ ] Run `npm run test` to verify nothing is broken

---

## File Creation Checklist (in order)

```
□  src/domain/entities/<name>.entity.ts
□  src/domain/repositories/<name>.repository.ts            ← interface (port)
□  src/application/dto/<name>.dto.ts                       ← DTO + Zod schema + Mapper
□  src/application/commands/<action>-<name>.command.ts     ← one per write operation
□  src/application/command-handler/<action>-<name>.handler.ts
□  src/application/queries/<action>-<name>.query.ts        ← one per read operation
□  src/application/query-handlers/<action>-<name>.handler.ts
□  prisma/schema.prisma                                    ← add new model
□  (run: npm run db:push && npm run db:generate)
□  src/infra/repositories/<name>.repository.impl.ts        ← Prisma adapter
□  src/interface/http/controllers/<name>.controller.ts
□  src/interface/http/routes/<name>.routes.ts
□  src/bootstrap/app.ts                                    ← wire everything
□  src/__tests__/unit/<name>-validation.test.ts
□  src/__tests__/integration/<name>.test.ts
□  src/__tests__/integration/helpers/mock-repos.ts         ← add new mock factory
```

---

## Error Handling Quick Reference

| Situation | Error to throw | HTTP Status |
|---|---|---|
| Required query param missing | `new ValidationError('message')` | 400 |
| Request body fails Zod | `throw parsed.error` (ZodError) | 400 |
| Entity not found | `new NotFoundError('Entity not found')` | 404 |
| Duplicate / already exists | `new ConflictError('message')` | 409 |
| Business rule violated | `new DomainError('message')` | 422 |

All error classes are in `src/utils/error.util.ts`. Import them as:
```typescript
import { NotFoundError, ValidationError, DomainError } from '../../../utils/error.util';
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Entity file | `<noun>.entity.ts` | `voyage-log.entity.ts` |
| Repository interface | `<noun>.repository.ts` | `voyage-log.repository.ts` |
| Repository impl | `<noun>.repository.impl.ts` | `voyage-log.repository.impl.ts` |
| Command file | `<verb>-<noun>.command.ts` | `create-voyage-log.command.ts` |
| Handler file | `<verb>-<noun>.handler.ts` | `create-voyage-log.handler.ts` |
| Query file | `get-<noun>.query.ts` | `get-voyage-logs.query.ts` |
| DTO file | `<noun>.dto.ts` | `voyage-log.dto.ts` |
| Controller file | `<noun>.controller.ts` | `voyage-log.controller.ts` |
| Route file | `<noun>.routes.ts` | `voyage-log.routes.ts` |
| Class: entity | `PascalCase` noun | `VoyageLog` |
| Class: interface | `I` + `PascalCase` | `IVoyageLogRepository` |
| Class: impl | `Prisma` + noun + `Repository` | `PrismaVoyageLogRepository` |
| Class: handler | verb + noun + `Handler` | `CreateVoyageLogHandler` |
| DB table | `snake_case` plural | `voyage_logs` |
| DB column | `snake_case` | `ship_id`, `distance_nm` |

---

## Common Mistakes to Avoid

1. **Importing Prisma inside `domain/` or `application/`** — never allowed; use the repository interface
2. **Returning domain entities from controllers** — always map to a DTO first
3. **Passing `poolId` (or any FK) in a nested Prisma `create`** — Prisma injects FK fields automatically in nested writes; passing them explicitly causes `Unknown argument` errors
4. **Forgetting `.bind(controller)`** in route registration — `this` will be `undefined` at runtime
5. **Skipping `npm run db:generate`** after schema changes — Prisma client types won't reflect the new model
6. **Writing logic in the Command class** — Commands are data carriers only; logic belongs in Handlers
7. **Instantiating concrete classes outside `bootstrap/app.ts`** — breaks the composition root pattern
