# VarunaMarine — FuelEU Compliance Frontend

React 19 + TypeScript + Tailwind v4 dashboard for the **FuelEU Maritime Regulation** compliance platform. Ships must keep their GHG intensity below the 2025–2029 target of **89.3368 gCO₂eq/MJ**. This UI lets operators manage routes, compare GHG intensities, bank surplus compliance balance, and create Article 21 pools.

---

## Screenshots

| Tab | Description |
|---|---|
| **Routes** | Filter and browse all ship route profiles. Set a baseline for comparison. |
| **Compare** | Table + bar chart of every route vs. the baseline GHG intensity. |
| **Banking** | View live compliance balance per ship. Bank surplus or apply banked CB to offset deficit. |
| **Pooling** | Select 2+ ships, validate net CB ≥ 0, create a pool — greedy surplus transfer runs automatically. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 (theme tokens in `src/index.css`) |
| Data fetching | SWR — cache-first, auto-revalidation on mutation |
| State | Zustand — UI state only (active tab, toast queue) |
| HTTP | Axios — central client in `src/lib/api-client.ts` |
| Charts | Recharts |
| Icons | lucide-react |
| Class merging | clsx + tailwind-merge via `cn()` helper |

---

## Prerequisites

- Node.js ≥ 18
- Backend running on `http://localhost:3000` — see [`../backend/README.md`](../backend/README.md)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # or edit .env directly

# 3. Start dev server
npm run dev                 # → http://localhost:5173
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend base URL |

---

## Available Scripts

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # TypeScript check + production build → dist/
npm run preview    # Serve the production build locally
npm run lint       # Run ESLint
```

---

## Project Structure

```
src/
├── types/index.ts          ← All domain TypeScript interfaces
├── lib/
│   ├── api-client.ts       ← Axios instance + ApiClientError + swrFetcher
│   ├── constants.ts        ← GHG_TARGET, SHIP_IDS, FUEL_TYPES
│   └── utils.ts            ← cn(), formatCB(), formatGhg(), formatPercent()
├── hooks/                  ← SWR hooks — one file per endpoint group
│   ├── useRoutes.ts
│   ├── useComparison.ts
│   ├── useCompliance.ts
│   ├── useBanking.ts
│   └── usePooling.ts
├── stores/
│   └── app.store.ts        ← Zustand: active tab + auto-dismiss toast queue
├── components/ui/          ← Design system components (pure, no API calls)
│   ├── Button.tsx          ← 5 variants, loading state, left/right icon slots
│   ├── Badge.tsx           ← 6 colour variants with optional dot indicator
│   ├── Card.tsx            ← Card, CardHeader, CardSection
│   ├── DataTable.tsx       ← Generic DataTable<T> — loading / error / empty states
│   ├── Input.tsx           ← Controlled input with label, error, hint
│   ├── Select.tsx          ← Styled select with chevron overlay
│   ├── Spinner.tsx         ← Spinner + LoadingOverlay
│   ├── StatCard.tsx        ← Metric card with trend indicator
│   ├── EmptyState.tsx      ← Empty state with icon + action slot
│   ├── ErrorMessage.tsx    ← Inline error display
│   ├── Toast.tsx           ← Fixed-position toast stack
│   └── index.ts            ← Barrel export
├── features/
│   ├── routes/             ← RoutesTab, RouteTable, RouteFilters
│   ├── compare/            ← CompareTab, ComparisonTable, ComparisonChart
│   ├── banking/            ← BankingTab, BankingPanel, BankingHistory
│   └── pooling/            ← PoolingTab, ShipSelector, PoolResult
├── layout/
│   ├── AppShell.tsx        ← Header + tab navigation + main content area
│   └── TabNav.tsx          ← Tab buttons driven by Zustand activeTab
├── App.tsx                 ← SWRConfig root
└── main.tsx                ← Entry point
```

---

## Architecture

### Data Flow

```
Backend API (port 3000)
        │
   Axios (api-client.ts)
        │
   SWR hooks (src/hooks/)       ← cache, revalidate, deduplicate
        │
   Feature components           ← own loading / error / data rendering
        │
   UI components (src/components/ui/)   ← purely presentational
```

### Key Rules

- **Hooks own all data** — feature components never call `apiClient` directly.
- **SWR key = URL path** — enables cache invalidation: `globalMutate('/banking/records?...')` after mutations.
- **Zustand = UI state only** — no server data ever goes into Zustand.
- **`cn()` for all class merging** — never string concatenation of Tailwind classes.
- **`@/` alias** — all imports use `@/` (mapped to `src/`).

---

## API Endpoints Consumed

| Method | Path | Hook |
|---|---|---|
| `GET` | `/routes` | `useRoutes(filters?)` |
| `POST` | `/routes/:id/baseline` | `useSetBaseline()` |
| `GET` | `/routes/comparison` | `useComparison()` |
| `GET` | `/compliance/cb?shipId&year` | `useComplianceCB()` |
| `GET` | `/compliance/adjusted-cb?shipId&year` | `useAdjustedCB()` |
| `GET` | `/banking/records?shipId&year` | `useBankingRecords()` |
| `POST` | `/banking/bank` | `useBankSurplus()` |
| `POST` | `/banking/apply` | `useApplyBank()` |
| `POST` | `/pools` | `useCreatePool()` |

All responses follow `{ success: true, data: T }`. Errors follow `{ success: false, error: string, statusCode: number }`.

---

## Design System

Dark maritime theme. Core tokens:

| Role | Class |
|---|---|
| Page background | `bg-slate-950` |
| Card background | `bg-slate-900 border border-slate-800 rounded-xl` |
| Input background | `bg-slate-800 border border-slate-700` |
| Primary accent | `teal-400` / `teal-500` |
| Surplus / compliant | `text-green-400` |
| Deficit / non-compliant | `text-red-400` |
| Warning | `text-amber-400` |
| Focus ring | `ring-2 ring-teal-500 ring-offset-slate-950` |

---

## Seed Data (for reference)

The backend seeds 5 routes. R001 (HFO) is the default baseline.

| Ship | Fuel | GHG Intensity | CB (2025) |
|---|---|---|---|
| R001 | HFO | 91.74420 gCO₂eq/MJ | −14.81M (deficit) |
| R002 | MDO | 90.76745 gCO₂eq/MJ | −45.67M (deficit) |
| R003 | LNG | 75.50000 gCO₂eq/MJ | +567.81M (surplus) |
| R004 | VLSFO | 87.20000 gCO₂eq/MJ | +105.17M (surplus) |
| R005 | Biofuel-Blend | 60.00000 gCO₂eq/MJ | +1.20B (surplus) |
