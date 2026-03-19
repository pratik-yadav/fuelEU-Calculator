# AGENT_WORKFLOW.md — VarunaMarine FuelEU Frontend

Step-by-step guide for adding a new feature tab to the dashboard. Follow this workflow in order — every section includes the exact file to edit, where to put the code, and a copy-paste template.

---

## Example Feature Used Throughout This Guide

**"Penalties" tab** — shows a ship's estimated financial penalty when its CB is in deficit.

- New endpoint: `GET /penalties?shipId=R001&year=2025`
- Response: `{ shipId, year, deficitGco2eq, penaltyEur }`
- UI: ship selector → stat cards → table of historical penalties

---

## Step 0 — Understand the Data Flow

```
Backend API (port 3000)
        │  HTTP (Axios)
        ▼
  src/lib/api-client.ts     ← central Axios instance + error class
        │  swrFetcher / apiClient
        ▼
  src/hooks/use<Feature>.ts  ← SWR read hooks + mutation hooks
        │  typed data, loading, error
        ▼
  src/features/<feature>/
    <Feature>Tab.tsx          ← orchestrator: owns local state, calls hooks, fires toasts
    <Feature>Panel.tsx        ← sub-component: receives data/callbacks via props
    <Feature>Table.tsx        ← sub-component: DataTable<T> with typed columns
        │  props only — no hooks, no API calls
        ▼
  src/components/ui/          ← design system primitives (Button, Card, DataTable …)
```

**Rules that must never be broken:**
1. Feature components never import `apiClient` — only hooks do.
2. SWR key = exact URL path string (enables cache invalidation).
3. `null` key = skip the fetch (use when params are missing).
4. Zustand holds UI state only — no server data ever goes in Zustand.
5. All Tailwind classes go through `cn()` — never string concatenation.
6. All imports use `@/` alias — never `../../`.

---

## Step 1 — Add Types

**File:** `src/types/index.ts`

Add your response shape and any request bodies at the bottom of the file.

```typescript
// --- Penalties (example) ---

export interface Penalty {
  shipId: string;
  year: number;
  deficitGco2eq: number;
  penaltyEur: number;
}

// Only needed if you have a POST/PATCH mutation
export interface PenaltyOverrideRequest {
  shipId: string;
  year: number;
  notes: string;
}
```

**Checklist:**
- [ ] All fields match the backend DTO exactly (camelCase — backend DTOs already map to camelCase)
- [ ] No `any` types
- [ ] Request body types are separate interfaces, not inline

---

## Step 2 — Add a SWR Hook File

**File:** `src/hooks/use<Feature>.ts` → e.g. `src/hooks/usePenalties.ts`

### Pattern A — Read hook (SWR)

```typescript
import useSWR from 'swr';
import { swrFetcher } from '@/lib/api-client';
import type { Penalty } from '@/types';

export function usePenalty(shipId?: string, year?: number) {
  // null key = SWR skips the fetch until both params are present
  const key = shipId && year
    ? `/penalties?shipId=${shipId}&year=${year}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<Penalty>(key, swrFetcher);

  return {
    penalty: data ?? null,
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}
```

### Pattern B — Mutation hook (POST / PATCH)

```typescript
import { useState } from 'react';
import { mutate as globalMutate } from 'swr';
import { apiClient } from '@/lib/api-client';
import type { PenaltyOverrideRequest, Penalty } from '@/types';

export function useOverridePenalty(shipId?: string, year?: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (body: PenaltyOverrideRequest): Promise<Penalty> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<Penalty>('/penalties/override', body);

      // Revalidate every SWR key that this mutation affects
      if (shipId && year) {
        await globalMutate(`/penalties?shipId=${shipId}&year=${year}`);
      }

      return result;
    } catch (err) {
      setError(err as Error);
      throw err; // re-throw so the caller can show a toast
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
}
```

**Checklist:**
- [ ] Hook filename is `use<Feature>.ts` (camelCase, starts with `use`)
- [ ] Read hooks: `null` key when required params are absent
- [ ] Mutation hooks: call `globalMutate(key)` for every affected SWR key after success
- [ ] Mutation hooks: `throw err` after setting error state so callers can react
- [ ] Return shape: `{ data | result, isLoading, error }`

---

## Step 3 — Create the Feature Folder

```
src/features/penalties/
├── PenaltiesTab.tsx     ← orchestrator (required)
├── PenaltyPanel.tsx     ← sub-component (optional — add when Tab gets big)
└── PenaltyTable.tsx     ← sub-component (optional — add for tables)
```

### 3a — Sub-component: table (`PenaltyTable.tsx`)

Only receives data via props — no hooks, no API calls.

```typescript
import type { Penalty } from '@/types';
import type { Column } from '@/components/ui/DataTable';
import DataTable from '@/components/ui/DataTable';
import { cn } from '@/lib/utils';

interface PenaltyTableProps {
  data: Penalty[];
  loading?: boolean;
  error?: Error | null;
}

export function PenaltyTable({ data, loading, error }: PenaltyTableProps) {
  const columns: Column<Penalty>[] = [
    {
      key: 'shipId',
      header: 'Ship',
      render: (row) => (
        <span className="font-mono text-teal-400 font-semibold">{row.shipId}</span>
      ),
    },
    {
      key: 'deficitGco2eq',
      header: 'Deficit',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-red-400 text-sm">
          {row.deficitGco2eq.toLocaleString()} gCO₂eq
        </span>
      ),
    },
    {
      key: 'penaltyEur',
      header: 'Penalty',
      align: 'right',
      render: (row) => (
        <span className={cn('font-mono font-medium', row.penaltyEur > 0 ? 'text-amber-400' : 'text-slate-400')}>
          €{row.penaltyEur.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable<Penalty>
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      rowKey={(r) => `${r.shipId}-${r.year}`}
      emptyTitle="No penalties"
      emptyMessage="Ship has no deficit for this year."
    />
  );
}
```

### 3b — Orchestrator: tab root (`PenaltiesTab.tsx`)

Owns local UI state, calls hooks, fires toasts, composes sub-components.

```typescript
import { useState } from 'react';
import { usePenalty } from '@/hooks/usePenalties';
import { useAddToast } from '@/stores/app.store';
import { PenaltyTable } from './PenaltyTable';
import Select from '@/components/ui/Select';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { SHIP_IDS, CURRENT_YEAR } from '@/lib/constants';

export function PenaltiesTab() {
  const [shipId, setShipId] = useState('');
  const [year, setYear]     = useState(CURRENT_YEAR);
  const addToast            = useAddToast();

  const { penalty, isLoading, error } = usePenalty(shipId || undefined, year);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100">Penalties</h2>
        <p className="text-sm text-slate-400 mt-1">
          Estimated financial penalties for non-compliant ships.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          label="Ship"
          value={shipId}
          onChange={(e) => setShipId(e.target.value)}
          placeholder="Select a ship"
          options={[...SHIP_IDS].map((id) => ({ value: id, label: id }))}
          className="min-w-[160px]"
        />
        <Select
          label="Year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          options={[2025, 2024, 2023].map((y) => ({ value: y, label: String(y) }))}
          className="min-w-[120px]"
        />
      </div>

      {shipId ? (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Deficit"
              value={penalty ? `${penalty.deficitGco2eq.toLocaleString()} gCO₂eq` : '—'}
              loading={isLoading}
              valueClassName="text-red-400"
            />
            <StatCard
              label="Estimated Penalty"
              value={penalty ? `€${penalty.penaltyEur.toLocaleString()}` : '—'}
              loading={isLoading}
              valueClassName="text-amber-400"
            />
          </div>

          {/* Table */}
          <Card>
            <CardHeader title="Penalty History" />
            <PenaltyTable
              data={penalty ? [penalty] : []}
              loading={isLoading}
              error={error}
            />
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[300px] text-slate-500 text-sm">
          Select a ship to view penalty estimates.
        </div>
      )}
    </div>
  );
}
```

**Checklist:**
- [ ] Tab root filename matches `<Feature>Tab.tsx`
- [ ] All hooks called at the top level — never inside conditions
- [ ] Loading state passed to every sub-component that renders data
- [ ] Error state surfaced — either via `<ErrorMessage>` or `addToast`
- [ ] Empty/unselected state shows a helpful message (not a blank screen)
- [ ] `space-y-6` between sections
- [ ] Page heading: `text-xl font-bold text-slate-100`

---

## Step 4 — Register the Tab

Three files to edit. Edit all three — missing any one will break the tab.

### 4a — `src/stores/app.store.ts`

Add the new tab ID to the `TabId` union:

```typescript
// Before
export type TabId = 'routes' | 'compare' | 'banking' | 'pooling';

// After
export type TabId = 'routes' | 'compare' | 'banking' | 'pooling' | 'penalties';
```

### 4b — `src/layout/TabNav.tsx`

Import the relevant icon from `lucide-react` and add an entry to the `tabs` array:

```typescript
import { Ship, BarChart2, Landmark, Users, AlertTriangle } from 'lucide-react';

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: 'routes',   label: 'Routes',   icon: <Ship className="w-4 h-4" /> },
  { id: 'compare',  label: 'Compare',  icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'banking',  label: 'Banking',  icon: <Landmark className="w-4 h-4" /> },
  { id: 'pooling',  label: 'Pooling',  icon: <Users className="w-4 h-4" /> },
  { id: 'penalties', label: 'Penalties', icon: <AlertTriangle className="w-4 h-4" /> }, // ← add
];
```

### 4c — `src/layout/AppShell.tsx`

Import the tab component and add a render branch:

```typescript
import { PenaltiesTab } from '@/features/penalties/PenaltiesTab'; // ← add

// Inside the JSX:
{activeTab === 'routes'    && <RoutesTab />}
{activeTab === 'compare'   && <CompareTab />}
{activeTab === 'banking'   && <BankingTab />}
{activeTab === 'pooling'   && <PoolingTab />}
{activeTab === 'penalties' && <PenaltiesTab />}   // ← add
```

**Checklist:**
- [ ] `TabId` union updated in `app.store.ts`
- [ ] `tabs` array entry added in `TabNav.tsx` with an icon
- [ ] Render branch added in `AppShell.tsx`
- [ ] TypeScript still compiles: `npx tsc --noEmit`

---

## Step 5 — Handle Errors Properly

Always handle the `ApiClientError` class from `src/lib/api-client.ts`.

```typescript
import { ApiClientError } from '@/lib/api-client';

// In a mutation handler inside the Tab component:
const handleSubmit = async () => {
  try {
    await execute(body);
    addToast({ type: 'success', title: 'Done', message: 'Action completed.' });
  } catch (err) {
    if (err instanceof ApiClientError) {
      // err.statusCode — use for specific handling (404, 422 etc.)
      // err.details   — Zod validation details array
      addToast({ type: 'error', title: 'Failed', message: err.message });
    } else {
      addToast({ type: 'error', title: 'Unexpected error', message: 'Please try again.' });
    }
  }
};
```

For 422 "no baseline" style errors that block an entire tab from loading:

```typescript
// In the Tab component before the main return:
if (error instanceof ApiClientError && error.statusCode === 422) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 max-w-md text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-100">Prerequisite not met</h3>
        <p className="text-sm text-slate-400 mt-2">{error.message}</p>
      </div>
    </div>
  );
}
```

---

## Step 6 — Verify Before Shipping

Run these checks in order:

```bash
# 1. TypeScript — zero errors required
npx tsc --noEmit

# 2. Production build — must succeed
npm run build

# 3. Lint
npm run lint

# 4. Manual smoke test (backend must be running)
npm run dev
# → open http://localhost:5173
# → click new tab
# → confirm loading state shows (not blank)
# → confirm data loads from backend
# → confirm error states show correct message
```

**Manual UX checklist:**
- [ ] Loading spinner appears while data fetches
- [ ] Error message appears when backend is unreachable
- [ ] Empty state appears when no data (not a blank area)
- [ ] Toasts fire on mutation success and failure
- [ ] Submit buttons are disabled during loading
- [ ] Tab is keyboard-navigable (Tab key reaches all inputs and buttons)
- [ ] Layout doesn't break at 375px width (mobile)

---

## Quick Reference — UI Components

Import everything from the barrel:

```typescript
import {
  Button, Badge, Card, CardHeader, CardSection,
  Spinner, LoadingOverlay, Input, Select,
  DataTable, EmptyState, StatCard, ErrorMessage,
} from '@/components/ui';
import type { Column } from '@/components/ui';
```

### Component signatures at a glance

```typescript
// Button
<Button variant="primary|secondary|danger|ghost|outline" size="xs|sm|md|lg"
  loading={bool} disabled={bool} leftIcon={<Icon />} onClick={fn}>
  Label
</Button>

// Badge
<Badge variant="success|danger|warning|neutral|info|teal" dot={bool}>text</Badge>

// Card
<Card padding="none|sm|md|lg" className="...">
  <CardHeader title="..." subtitle="..." action={<Button />} />
  <CardSection>...</CardSection>
</Card>

// DataTable — generic, fully typed
<DataTable<MyType>
  columns={columns}        // Column<MyType>[]
  data={rows}              // MyType[]
  loading={bool}
  error={error ?? null}    // Error | null
  rowKey={(r) => r.id}     // required — unique key per row
  emptyTitle="No data"
  emptyMessage="Description shown under the title."
/>

// StatCard
<StatCard label="Label" value="123" subValue="unit"
  loading={bool} valueClassName="text-green-400" />

// Input
<Input label="Amount" type="number" value={val}
  onChange={fn} error={errorMsg} hint="helper text" />

// Select
<Select label="Ship" value={val} onChange={fn}
  options={[{ value: 'R001', label: 'R001' }]}
  placeholder="Select..." />
```

---

## Complete Checklist — New Feature

Copy this into your PR description and tick off each item:

```
### Types
- [ ] Interface added to `src/types/index.ts`
- [ ] All fields match backend DTO (camelCase)

### Hook
- [ ] `src/hooks/use<Feature>.ts` created
- [ ] Read hook: null key when params missing
- [ ] Mutation hook: globalMutate() called for all affected keys
- [ ] Mutation hook: re-throws error after setError()

### Feature components
- [ ] `src/features/<feature>/<Feature>Tab.tsx` created (orchestrator)
- [ ] Sub-components receive data via props only (no hooks inside them)
- [ ] Loading state handled everywhere data is displayed
- [ ] Error state handled (toast or inline message)
- [ ] Empty state shown when array is empty (not blank screen)

### Tab registration
- [ ] `TabId` union extended in `src/stores/app.store.ts`
- [ ] Tab entry added to `tabs` array in `src/layout/TabNav.tsx`
- [ ] Render branch added in `src/layout/AppShell.tsx`

### Code quality
- [ ] All imports use `@/` alias
- [ ] All class merging uses `cn()`
- [ ] No `any` types
- [ ] `npx tsc --noEmit` → zero errors
- [ ] `npm run build` → succeeds
- [ ] Manual smoke test passed
```
