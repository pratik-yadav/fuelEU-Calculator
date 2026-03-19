# VarunaMarine — FuelEU Compliance Platform

A full-stack web application for monitoring and managing **FuelEU Maritime Regulation** compliance.
Ships must keep their GHG intensity below a regulatory target. This platform computes Compliance Balances,
supports surplus banking across years (Article 20), and lets ships pool their compliance balance (Article 21).

---

## What Was Built

### Backend — REST API
- **Framework:** Fastify v4 + TypeScript
- **ORM:** Prisma v5 + PostgreSQL
- **Architecture:** DDD + Hexagonal (Ports & Adapters)
- **Testing:** Vitest — unit + integration tests with mock repositories

### Frontend — Dashboard UI
- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 — dark maritime theme
- **Data fetching:** SWR + Axios
- **State:** Zustand (UI-only — tabs, toasts)
- **Charts:** Recharts

---

## Project Structure

```
VarunaMarine Assignment/
├── backend/                        ← REST API
│   ├── prisma/                     ← DB schema + migrations
│   ├── src/
│   │   ├── domain/                 ← Entities, services, repo interfaces
│   │   ├── application/            ← Commands, queries, handlers, DTOs
│   │   ├── infra/                  ← Prisma repositories, seed data
│   │   ├── interface/              ← Fastify controllers + route registration
│   │   └── bootstrap/              ← Composition root (wires all layers)
│   ├── README.md                   ← Backend setup + API reference
│   ├── AGENT_WORKFLOW.md           ← Step-by-step guide for adding new features
│   └── CHANGELOG.md                ← Phase-by-phase implementation log
│
├── frontend/                       ← React dashboard
│   ├── src/
│   │   ├── features/               ← Routes, Compare, Banking, Pooling tabs
│   │   ├── hooks/                  ← SWR data hooks (one file per endpoint group)
│   │   ├── components/ui/          ← Reusable design-system components
│   │   ├── stores/                 ← Zustand UI state
│   │   ├── lib/                    ← API client, formatters, constants
│   │   └── types/                  ← Shared TypeScript interfaces
│   └── README.md                   ← Frontend setup + architecture rules
│
├── VarunaMarine-FuelEU.postman_collection.json  ← All 9 API endpoints with example responses
└── REFLECTION.md                   ← AI-assisted development learnings
```

---

## Features

### Routes Tab
- View all ship route profiles (fuel type, GHG intensity, consumption)
- Set any route as the comparison baseline
- Compare all routes against the baseline — shows % difference and compliance status

### Compliance Tab
- Compute Compliance Balance (CB) per ship per year
- View adjusted CB after accounting for banked/applied amounts
- Positive CB = surplus, Negative CB = deficit

### Banking Tab (Article 20)
- Bank surplus CB to carry forward to future years
- Apply banked CB to offset a current-year deficit
- View full ledger history per ship

### Pooling Tab (Article 21)
- Create a compliance pool from multiple ships
- Greedy algorithm redistributes surplus from compliant ships to deficit ships
- Pool is only valid if the net CB of all members is non-negative

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/routes` | List all routes |
| POST | `/routes/:id/baseline` | Set baseline route |
| GET | `/routes/comparison` | Compare all routes vs baseline |
| GET | `/compliance/cb` | Compute & cache Compliance Balance |
| GET | `/compliance/adjusted-cb` | CB + banked/applied amounts |
| GET | `/banking/records` | List bank entries |
| POST | `/banking/bank` | Bank surplus CB |
| POST | `/banking/apply` | Apply banked CB to deficit |
| POST | `/pools` | Create a compliance pool |

Full request/response examples are in `VarunaMarine-FuelEU.postman_collection.json`.

---

## Key FuelEU Formulas

```
GHG Target  = 89.33680 gCO₂eq/MJ   (2025–2029 reporting period)
Energy      = fuelConsumption_tonnes × 41,000 MJ
CB          = (GHG_Target − ghgIntensity) × Energy
AdjustedCB  = CB + Σ(bank_entries)
```

| Fuel | GHG Intensity |
|---|---|
| HFO | 91.74420 gCO₂eq/MJ |
| MDO | 90.76745 gCO₂eq/MJ |
| LNG | 75.50000 gCO₂eq/MJ |
| VLSFO | 87.20000 gCO₂eq/MJ |
| Biofuel-Blend | 60.00000 gCO₂eq/MJ |

---

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env       # Set DATABASE_URL
npm run db:push            # Push schema to PostgreSQL
npm run db:seed            # Seed 5 routes (R001–R005)
npm run dev                # API on http://localhost:3000
npm run test               # Run all tests
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # Dashboard on http://localhost:5173
```

> Backend must be running before starting the frontend.

---

## Seed Data

Five pre-seeded ship route profiles:

| Ship ID | Fuel | GHG Intensity | Fuel Consumption | Baseline |
|---|---|---|---|---|
| R001 | HFO | 91.74420 | 150 t | Yes |
| R002 | MDO | 90.76745 | 80 t | No |
| R003 | LNG | 75.50000 | 100 t | No |
| R004 | VLSFO | 87.20000 | 120 t | No |
| R005 | Biofuel-Blend | 60.00000 | 90 t | No |

R001 (HFO) is the baseline — it has a deficit CB, while R003 (LNG) and R005 (Biofuel-Blend) have large surpluses.

---

## Adding New Features

See [backend/AGENT_WORKFLOW.md](backend/AGENT_WORKFLOW.md) for a step-by-step recipe covering all layers:
Domain → Application → Infrastructure → Interface → Bootstrap → Tests.

---

## Documents

| File | Purpose |
|---|---|
| [backend/README.md](backend/README.md) | Backend setup, scripts, API reference, error codes |
| [backend/CHANGELOG.md](backend/CHANGELOG.md) | Phase-by-phase implementation log (Phases 0–6) |
| [backend/AGENT_WORKFLOW.md](backend/AGENT_WORKFLOW.md) | Guide for adding new features following the architecture |
| [VarunaMarine-FuelEU.postman_collection.json](VarunaMarine-FuelEU.postman_collection.json) | Postman collection with all 9 endpoints + example responses |
| [REFLECTION.md](REFLECTION.md) | Learnings from AI-assisted development |
