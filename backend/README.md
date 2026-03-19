# VarunaMarine FuelEU Compliance Backend

REST API backend for the **FuelEU Maritime Regulation** compliance platform. Ships must keep their GHG intensity below a regulatory target. This service computes Compliance Balances (CB), supports surplus banking across years (Article 20), and allows ships to pool their CB (Article 21).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Fastify v4 |
| ORM | Prisma v5 |
| Database | PostgreSQL |
| Validation | Zod |
| Testing | Vitest + Supertest |

---

## Architecture

**DDD + Hexagonal (Ports & Adapters)**

```
src/
├── domain/            # Pure TS — entities, services, repo interfaces (no framework/Prisma)
│   ├── entities/
│   ├── services/      # ComplianceCalculatorService — all FuelEU math
│   └── repositories/  # Interfaces only (IRouteRepository, IBankEntryRepository …)
├── application/       # Use-cases: commands, queries, handlers, DTOs
│   ├── commands/
│   ├── command-handler/
│   ├── queries/
│   ├── query-handlers/
│   └── dto/
├── infra/             # Prisma adapter — concrete repo implementations
│   ├── database/      # prisma.client.ts, seed.ts
│   └── repositories/
├── interface/         # Fastify HTTP layer
│   └── http/
│       ├── controllers/
│       └── routes/
├── bootstrap/         # Composition root — wires all layers together
├── types/             # Shared TypeScript types
└── utils/             # AppError hierarchy, response helpers
```

**Dependency rules:**
- `domain/` and `application/` never import from `infra/` or `interface/`
- `infra/` imports `domain/` only (implements its interfaces)
- `bootstrap/` is the only place that wires layers together

---

## Database Schema

| Table | Purpose |
|---|---|
| `routes` | One row per ship-route profile; stores pre-computed `ghg_intensity` |
| `ship_compliance` | Computed CB per ship per year (computed-and-cached) |
| `bank_entries` | Banking ledger — positive = surplus banked, negative = surplus applied |
| `pools` | A pooling event for a given year |
| `pool_members` | Each ship's CB before/after joining a pool |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
cd backend
npm install
cp .env.example .env        # Edit DATABASE_URL
npm run db:push             # Push schema to DB
npm run db:seed             # Seed 5 routes (R001–R005)
npm run dev                 # Start dev server on :3000
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/varunamarine"
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run start` | Run compiled output |
| `npm run db:generate` | Run `prisma generate` |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema changes (dev, no migration file) |
| `npm run db:seed` | Seed 5 routes into the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |

---

## API Endpoints

### Routes

| Method | Path | Description |
|---|---|---|
| GET | `/routes` | List all routes |
| POST | `/routes/:id/baseline` | Set a route as the comparison baseline |
| GET | `/routes/comparison` | Compare all routes vs the baseline |

### Compliance

| Method | Path | Query Params | Description |
|---|---|---|---|
| GET | `/compliance/cb` | `shipId`, `year` | Compute & cache Compliance Balance |
| GET | `/compliance/adjusted-cb` | `shipId`, `year` | CB adjusted for banked/applied amounts |

### Banking

| Method | Path | Description |
|---|---|---|
| GET | `/banking/records` | List bank entries (`?shipId&year`) |
| POST | `/banking/bank` | Bank surplus CB `{ shipId, year, amount }` |
| POST | `/banking/apply` | Apply banked CB to offset a deficit `{ shipId, year, amount }` |

### Pooling

| Method | Path | Description |
|---|---|---|
| POST | `/pools` | Create a pool `{ year, members: [shipId] }` |

---

## FuelEU Calculation Reference

### Key Constants

```
GHG_TARGET = 89.33680 gCO₂eq/MJ   (2025–2029 reporting period)
```

### Compliance Balance

```
energy [MJ]  = fuelConsumption_tonnes × 41,000
CB [gCO₂eq]  = (GHG_TARGET − ghgIntensity) × energy
```

- CB > 0 → surplus (can bank or pool)
- CB < 0 → deficit (financial penalty unless offset)

### GHG Intensity (pre-computed per fuel)

| Fuel | GHG Intensity (gCO₂eq/MJ) |
|---|---|
| HFO | 91.74420 |
| MDO | 90.76745 |
| LNG | 75.50000 |
| VLSFO | 87.20000 |
| Biofuel-Blend | 60.00000 |

### Adjusted CB (after banking)

```
adjustedCB = CB + Σ(bank_entries.amount_gco2eq)
```

### Route Comparison

```
percentDiff = ((routeGhg / baselineGhg) − 1) × 100
compliant   = routeGhg <= GHG_TARGET
```

---

## Seed Data

5 routes pre-loaded with pre-computed GHG values:

| Route ID | Fuel Type | GHG Intensity | Fuel Consumption | Baseline |
|---|---|---|---|---|
| R001 | HFO | 91.74420 | 150 t | Yes |
| R002 | MDO | 90.76745 | 80 t | No |
| R003 | LNG | 75.50000 | 100 t | No |
| R004 | VLSFO | 87.20000 | 120 t | No |
| R005 | Biofuel-Blend | 60.00000 | 90 t | No |

> **Note:** `shipId` maps to `routes.route_id`. A ship is identified by its route profile ID across all tables.

---

## Testing

```bash
npm run test
```

Tests are organized into:

- **Unit** (`src/__tests__/unit/`) — GHG formulas, banking validation, pool algorithm
- **Integration** (`src/__tests__/integration/`) — All 9 HTTP endpoints with mock repositories

Coverage report is generated in `coverage/`.

---

## Error Responses

All errors follow a consistent shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "shipId and year are required"
  }
}
```

| HTTP Status | When |
|---|---|
| 400 | Invalid request body / missing required fields (Zod validation) |
| 404 | Resource not found |
| 409 | Conflict (e.g., baseline already set) |
| 422 | Domain rule violation (e.g., pool CB is negative, over-banking) |
| 500 | Unexpected server error |
