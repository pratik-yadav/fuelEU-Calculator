# CLAUDE.md — VarunaMarine FuelEU Compliance Assignment

## Project Overview
Backend for a **FuelEU Maritime Regulation** compliance platform.
Ships must keep their GHG intensity below a target. The backend computes
Compliance Balances (CB), supports banking surplus CB across years (Article 20),
and allows ships to pool their CB (Article 21).

---

## Architecture
**DDD + Hexagonal (Ports & Adapters)** — existing folder structure must be respected.

```
backend/src/
├── domain/            ← Pure TS — no framework, no Prisma. Entities + services + repo interfaces (ports)
│   ├── entities/
│   ├── services/      ← ComplianceCalculatorService lives here
│   └── repositories/  ← Interfaces only (IRouteRepository, IBankEntryRepository …)
├── application/       ← Use-cases: commands, queries, handlers, DTOs
│   ├── commands/
│   ├── command-handler/
│   ├── queries/
│   ├── query-handlers/
│   └── dto/
├── infra/             ← Prisma adapter: PrismaClient + concrete repo impls
│   ├── database/      ← prisma.client.ts, seed.ts
│   └── repositories/
├── interface/         ← Fastify HTTP layer
│   └── http/
│       ├── controllers/
│       └── routes/
├── bootstrap/         ← Composition root (wires everything)
├── types/             ← Shared TS types (VesselType, FuelType …)
└── utils/             ← AppError hierarchy, response helpers
```

**Rules**:
- `domain/` and `application/` never import from `infra/` or `interface/`.
- `infra/` imports `domain/` only (implements its interfaces).
- `bootstrap/` is the only place that wires layers together.

---

## Database Tables (Prisma / PostgreSQL)

| Table | Purpose |
|---|---|
| `routes` | One row per ship-route profile. Stores pre-computed ghg_intensity. |
| `ship_compliance` | Computed CB per ship per year (stored after computation). |
| `bank_entries` | Banking ledger — positive = surplus banked, negative = surplus applied. |
| `pools` | A pooling event for a given year. |
| `pool_members` | Each ship's CB before/after joining a pool. |

---

## Key Constants (from FuelEU Regulation)

```typescript
const GHG_TARGET = 89.33680;        // gCO₂eq/MJ (2025-2029 reporting period)
const GWP_CO2   = 1;
const GWP_CH4   = 25;
const GWP_N2O   = 298;

// Per-fuel params (Annex II defaults)
HFO: { LCV: 0.0405, WtT: 13.5, CfCO2: 3.114, CfCH4: 0.00005, CfN2O: 0.00018 }
MDO: { LCV: 0.0427, WtT: 14.4, CfCO2: 3.206, CfCH4: 0.00005, CfN2O: 0.00018 }
```

---

## Calculation Formulas

### Energy
```
M_i [grams]  = fuelConsumption_tonnes × 1,000,000 × scopeFactor
E_i    [MJ]  = M_i × LCV_i
E_total [MJ] = Σ E_i
```
`scopeFactor`: 1.0 for Intra-EEA / port stays, 0.5 for Extra-EEA.
Simplified shorthand (used by compliance endpoint, per backend PRD): `energy = fuelConsumption × 41000`.

### GHG Intensity per Fuel
```
TtW_i       = (CfCO2 × GWP_CO2 + CfCH4 × GWP_CH4 + CfN2O × GWP_N2O) / LCV_i
GHGIE_i     = WtT_i + TtW_i
```
Pre-computed values: **HFO ≈ 91.74420**, **MDO ≈ 90.76745** gCO₂eq/MJ.

### Weighted Average (multi-fuel)
```
GHGIE_actual = Σ(E_i × GHGIE_i) / E_total
```

### Compliance Balance
```
CB [gCO₂eq] = (GHG_TARGET − GHGIE_actual) × E_total
```
- CB > 0 → surplus (can bank or pool)
- CB < 0 → deficit (financial penalty unless offset)

### Comparison
```
percentDiff = ((routeGhg / baselineGhg) − 1) × 100
compliant   = routeGhg <= GHG_TARGET
```

### Adjusted CB (after banking)
```
adjustedCB = CB + Σ(bank_entries.amount_gco2eq)
```

### Pool Algorithm
1. Validate: `Σ CB >= 0` (pool must net-positive)
2. Sort ships descending by CB
3. Greedy transfer — surplus ships → deficit ships
   - Constraint: surplus ship `cb_after >= 0`
   - Constraint: deficit ship `cb_after >= cb_before`

**Rounding**: 5 decimal places for all intermediate intensity/energy values.

---

## API Endpoints

### Routes
| Method | Path | Description |
|---|---|---|
| GET | `/routes` | List all routes |
| POST | `/routes/:id/baseline` | Set a route as the baseline |
| GET | `/routes/comparison` | Compare all routes vs baseline |

### Compliance
| Method | Path | Description |
|---|---|---|
| GET | `/compliance/cb?shipId&year` | Compute & store CB, return it |
| GET | `/compliance/adjusted-cb?shipId&year` | CB + banked/applied |

### Banking
| Method | Path | Description |
|---|---|---|
| GET | `/banking/records?shipId&year` | List bank entries |
| POST | `/banking/bank` | Bank surplus CB { shipId, year, amount } |
| POST | `/banking/apply` | Apply banked CB to offset deficit { shipId, year, amount } |

### Pooling
| Method | Path | Description |
|---|---|---|
| POST | `/pools` | Create a pool { year, members: [shipId] } |

**Note**: `shipId` maps to `routes.route_id`. A ship is identified by its route profile.

---

## Seed Data (5 routes, 1 baseline)
| route_id | fuel_type | ghg_intensity | fuel_consumption | is_baseline |
|---|---|---|---|---|
| R001 | HFO | 91.74420 | 150 tonnes | **true** |
| R002 | MDO | 90.76745 | 80 tonnes | false |
| R003 | LNG | 75.50000 | 100 tonnes | false |
| R004 | VLSFO | 87.20000 | 120 tonnes | false |
| R005 | Biofuel-Blend | 60.00000 | 90 tonnes | false |

---

## Dev Commands

```bash
npm run dev          # Start with tsx watch
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled output
npm run db:generate  # Run prisma generate
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev)
npm run db:seed      # Run seed script
npm run db:studio    # Open Prisma Studio
npm run test         # Run tests (Vitest)
```

---

## Sub-Agents (see .claude/agents/)

| Agent | Purpose |
|---|---|
| `fuel-eu-domain-agent` | Implements domain entities, services, repository interfaces |
| `fuel-eu-infra-agent` | Implements Prisma schema, repository adapters, seed data |
| `fuel-eu-api-agent` | Implements controllers, routes, DTOs |

---

## CHANGELOG
See `backend/CHANGELOG.md` for phase-by-phase implementation log.
