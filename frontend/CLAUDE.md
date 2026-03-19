# CLAUDE.md — VarunaMarine FuelEU Frontend

## Stack
- **React 19** + **TypeScript** (strict) + **Vite 8**
- **Tailwind CSS v4** — no `tailwind.config.js`, theme tokens in `src/index.css` `@theme` block
- **SWR** — data fetching and cache management
- **Zustand** — UI-only state (active tab, toasts)
- **Axios** — HTTP via central `apiClient` in `src/lib/api-client.ts`
- **Recharts** — bar chart in Compare tab
- **lucide-react** — icons throughout
- **clsx + tailwind-merge** — class merging via `cn()` in `src/lib/utils.ts`

---

## Folder Structure

```
src/
├── types/index.ts          ← All domain TS interfaces (Route, BankEntry, PoolMember …)
├── lib/
│   ├── api-client.ts       ← Axios instance, ApiClientError, swrFetcher
│   ├── constants.ts        ← GHG_TARGET, SHIP_IDS, FUEL_TYPES, CURRENT_YEAR
│   └── utils.ts            ← cn(), formatCB(), formatGhg(), formatPercent(), formatDate()
├── hooks/                  ← One SWR hook file per endpoint group
│   ├── useRoutes.ts        ← useRoutes(filters?), useSetBaseline()
│   ├── useComparison.ts    ← useComparison()
│   ├── useCompliance.ts    ← useComplianceCB(shipId, year), useAdjustedCB(shipId, year)
│   ├── useBanking.ts       ← useBankingRecords(), useBankSurplus(), useApplyBank()
│   └── usePooling.ts       ← useCreatePool()
├── stores/
│   └── app.store.ts        ← Zustand: activeTab, toasts (auto-dismiss 4.5s)
├── components/ui/          ← Design system — no API calls, no Zustand (except Toast)
│   ├── Button.tsx          ← 5 variants: primary | secondary | danger | ghost | outline
│   ├── Badge.tsx           ← 6 variants: success | danger | warning | neutral | info | teal
│   ├── Card.tsx            ← Card, CardHeader, CardSection
│   ├── DataTable.tsx       ← Generic DataTable<T> with loading/error/empty states
│   ├── Spinner.tsx         ← Spinner (5 sizes), LoadingOverlay
│   ├── Input.tsx           ← Controlled input with label, error, hint
│   ├── Select.tsx          ← Styled select with ChevronDown overlay
│   ├── StatCard.tsx        ← Metric card with trend indicator
│   ├── EmptyState.tsx      ← Centered empty state with icon + action slot
│   ├── ErrorMessage.tsx    ← Inline API error display
│   ├── Toast.tsx           ← ToastContainer, reads from Zustand
│   └── index.ts            ← Barrel export for all UI components
├── features/
│   ├── routes/             ← RoutesTab, RouteTable, RouteFilters
│   ├── compare/            ← CompareTab, ComparisonTable, ComparisonChart
│   ├── banking/            ← BankingTab, BankingPanel, BankingHistory
│   └── pooling/            ← PoolingTab, ShipSelector, PoolResult
├── layout/
│   ├── AppShell.tsx        ← Header + TabNav + tab content switcher + ToastContainer
│   └── TabNav.tsx          ← 4 tab buttons driven by Zustand activeTab
├── App.tsx                 ← SWRConfig wrapper
└── main.tsx                ← createRoot entry point
```

---

## Architecture Rules

1. **Hooks own data** — feature components never call `apiClient` directly; always go through a hook.
2. **SWR keys = API paths** — the SWR key must exactly match the URL path (e.g. `/compliance/cb?shipId=R001&year=2025`). Mutations call `globalMutate(key)` to revalidate related caches.
3. **Zustand = UI state only** — never put server data in Zustand. Tabs and toasts only.
4. **UI components are pure** — `src/components/ui/` has no SWR, no Zustand, no API calls (exception: `Toast.tsx` reads from Zustand store).
5. **`cn()` everywhere** — never concatenate Tailwind classes with `+` or template literals; always use `cn()`.
6. **`@/` alias** — all imports use `@/` (maps to `src/`). Never use relative `../../` paths.
7. **No `any`** — TypeScript strict mode is on. Use types from `src/types/index.ts`.

---

## Design System

### Color Palette (dark maritime theme)
| Token | Tailwind class | Use |
|---|---|---|
| Page bg | `bg-slate-950` | `<body>`, `AppShell` root |
| Card bg | `bg-slate-900` | All `<Card>` components |
| Elevated bg | `bg-slate-800` | Inputs, selects, ship cards |
| Border | `border-slate-800` | Card borders |
| Subtle border | `border-slate-700` | Input borders |
| Accent | `teal-400` / `teal-500` | Active tab, primary button, focus rings |
| Heading text | `text-slate-100` | Page/card titles |
| Body text | `text-slate-300` | Table cells, descriptions |
| Muted text | `text-slate-400` | Labels, subtitles, column headers |
| Captions | `text-slate-500` | Hints, empty state descriptions |
| Surplus / compliant | `text-green-400` | CB > 0, compliant badge |
| Deficit / non-compliant | `text-red-400` | CB < 0, non-compliant badge |
| Warning | `text-amber-400` | Chart reference line, warning toasts |

### Typography
- Page headings: `text-xl font-bold text-slate-100`
- Card titles: `text-base font-semibold text-slate-100`
- Table column headers: `text-xs font-semibold uppercase tracking-wider text-slate-400`
- Monospace values (IDs, numbers): `font-mono`

### Focus Rings
All interactive elements: `focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-950`

---

## API Client

```typescript
// src/lib/api-client.ts
import { swrFetcher, apiClient, ApiClientError } from '@/lib/api-client';

// SWR read — pass as fetcher or use directly
swrFetcher<T>(url: string): Promise<T>

// Mutations
apiClient.post<T>(path, body?): Promise<T>
apiClient.get<T>(path, params?): Promise<T>

// Error type — check statusCode for 404 / 422 etc.
err instanceof ApiClientError → err.statusCode, err.message, err.details
```

Backend base URL from `VITE_API_URL` env var (default: `http://localhost:3000`).

---

## SWR Hooks Reference

```typescript
// Routes
useRoutes(filters?)          → { routes, isLoading, error, mutate }
useSetBaseline()             → { setBaseline(id), isLoading, error }

// Comparison
useComparison()              → { comparison, isLoading, error }

// Compliance
useComplianceCB(shipId, year)   → { cb: ComplianceCB | null, isLoading, error }
useAdjustedCB(shipId, year)     → { adjustedCB: AdjustedCB | null, isLoading, error }

// Banking
useBankingRecords(shipId, year) → { records, isLoading, error, mutate }
useBankSurplus(shipId, year)    → { execute(BankRequest), isLoading, error }
useApplyBank(shipId, year)      → { execute(ApplyRequest), isLoading, error }

// Pooling
useCreatePool()              → { createPool(PoolRequest), isLoading, error, result, reset }
```

Hooks use `null` as the SWR key when required params are missing — SWR skips the fetch automatically.

---

## Zustand Store

```typescript
import { useActiveTab, useSetActiveTab, useAddToast, useToasts } from '@/stores/app.store';

// Toast
addToast({ type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string })
// Auto-dismissed after 4.5 seconds
```

---

## Formatters (`src/lib/utils.ts`)

| Function | Example output |
|---|---|
| `formatCB(value)` | `-14.81M gCO₂eq` / `567.81M gCO₂eq` |
| `formatGhg(value)` | `91.74420 gCO₂eq/MJ` (always 5 dp) |
| `formatPercent(value)` | `+1.23456%` / `-17.71614%` |
| `formatDate(isoString)` | `19 Mar 2025, 10:15` |
| `cn(...classes)` | Tailwind class merging |

---

## Constants (`src/lib/constants.ts`)

```typescript
GHG_TARGET   = 89.3368          // gCO₂eq/MJ — FuelEU 2025–2029 target
CURRENT_YEAR = 2025
SHIP_IDS     = ['R001', 'R002', 'R003', 'R004', 'R005'] as const
FUEL_TYPES   = ['HFO', 'MDO', 'LNG', 'VLSFO', 'Biofuel-Blend'] as const
```

---

## Domain Types (`src/types/index.ts`)

```typescript
Route          { id, routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions, isBaseline }
ComparisonResult { routeId, ghgIntensity, baselineGhgIntensity, percentDiff, compliant }
ComplianceCB   { shipId, year, ghgIntensity, energy, cb }
AdjustedCB     { shipId, year, cb, bankedTotal, adjustedCb }
BankEntry      { id, shipId, year, amountGco2eq, type: 'BANKED'|'APPLIED', createdAt }
PoolMember     { shipId, cbBefore, cbAfter }
```

---

## Adding a New Feature

1. **Add type** to `src/types/index.ts`
2. **Add hook** in `src/hooks/` using SWR or mutation pattern
3. **Add feature folder** `src/features/<name>/` with `<Name>Tab.tsx` as the root
4. **Register tab** in `src/stores/app.store.ts` (`TabId` union) + `src/layout/TabNav.tsx` + `src/layout/AppShell.tsx`
5. **No new UI primitives** — reuse from `src/components/ui/`

---

## Dev Commands

```bash
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint
```

Backend must be running on `http://localhost:3000` (`npm run dev` in `../backend/`).

---

## Slash Commands

```
/ui-ux             # Audit all features for design, a11y, responsiveness, UX
/ui-ux banking     # Scope audit to a single feature
```
