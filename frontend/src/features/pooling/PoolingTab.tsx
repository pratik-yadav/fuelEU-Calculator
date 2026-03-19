import { useState, useMemo } from 'react';
import { useCreatePool } from '@/hooks/usePooling';
import { useAdjustedCB } from '@/hooks/useCompliance';
import { useAddToast } from '@/stores/app.store';
import { ShipSelector } from './ShipSelector';
import { PoolResult } from './PoolResult';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { SHIP_IDS, CURRENT_YEAR } from '@/lib/constants';
import { formatCB, cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { PoolRequest } from '@/types';

// Hooks must be called unconditionally — fetch all 5 ships always
function usePoolSumCB(selectedIds: string[], year: number) {
  const r001 = useAdjustedCB(SHIP_IDS[0], year);
  const r002 = useAdjustedCB(SHIP_IDS[1], year);
  const r003 = useAdjustedCB(SHIP_IDS[2], year);
  const r004 = useAdjustedCB(SHIP_IDS[3], year);
  const r005 = useAdjustedCB(SHIP_IDS[4], year);

  const allResults = useMemo(
    () => [
      { shipId: SHIP_IDS[0], data: r001 },
      { shipId: SHIP_IDS[1], data: r002 },
      { shipId: SHIP_IDS[2], data: r003 },
      { shipId: SHIP_IDS[3], data: r004 },
      { shipId: SHIP_IDS[4], data: r005 },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [r001.adjustedCB, r002.adjustedCB, r003.adjustedCB, r004.adjustedCB, r005.adjustedCB],
  );

  const selectedResults = allResults.filter((r) => selectedIds.includes(r.shipId));
  const anyLoading = selectedResults.some((r) => r.data.isLoading);
  const allLoaded = selectedResults.every((r) => r.data.adjustedCB !== null);
  const sum = selectedResults.reduce(
    (acc, r) => acc + (r.data.adjustedCB?.adjustedCb ?? 0),
    0,
  );

  return { sum, anyLoading, allLoaded };
}

export function PoolingTab() {
  const [selectedShipIds, setSelectedShipIds] = useState<string[]>([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const { createPool, isLoading, result, reset } = useCreatePool();
  const addToast = useAddToast();

  const { sum, anyLoading, allLoaded } = usePoolSumCB(selectedShipIds, year);

  const isPoolValid = selectedShipIds.length >= 2 && allLoaded && sum >= 0;
  const canCreate = isPoolValid && !isLoading && !anyLoading;

  const handleToggle = (shipId: string) => {
    setSelectedShipIds((prev) =>
      prev.includes(shipId) ? prev.filter((id) => id !== shipId) : [...prev, shipId],
    );
  };

  const handleCreatePool = async () => {
    const body: PoolRequest = { year, members: selectedShipIds };
    try {
      await createPool(body);
      addToast({
        type: 'success',
        title: 'Pool created',
        message: `Compliance pool for ${selectedShipIds.join(', ')} established.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Pool creation failed',
        message: (err as Error).message,
      });
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Pooling — Article 21</h2>
        </div>
        <PoolResult
          members={result}
          onReset={() => {
            reset();
            setSelectedShipIds([]);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Pooling — Article 21</h2>
        <p className="text-sm text-slate-400 mt-1">
          Create a compliance pool to transfer surplus CB to deficit ships.
        </p>
      </div>

      <div className="flex items-end gap-4">
        <Select
          label="Reporting Year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          options={[2025, 2024, 2023].map((y) => ({ value: y, label: String(y) }))}
          className="min-w-[130px]"
        />
      </div>

      <Card>
        <CardHeader
          title="Select Ships"
          subtitle="Select at least 2 ships to form a pool. Net CB must be ≥ 0."
        />
        <div className="p-6">
          <ShipSelector
            shipIds={SHIP_IDS}
            selected={selectedShipIds}
            year={year}
            onToggle={handleToggle}
          />
        </div>
      </Card>

      {selectedShipIds.length >= 2 && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl px-5 py-4 border',
            isPoolValid
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400',
          )}
        >
          {isPoolValid ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {isPoolValid ? 'Pool is valid' : 'Pool is invalid'}
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              Net CB:{' '}
              {anyLoading ? 'calculating…' : formatCB(sum)}
              {!isPoolValid && sum < 0 && ' — Total must be ≥ 0 gCO₂eq'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={isLoading}
            disabled={!canCreate}
            onClick={handleCreatePool}
          >
            Create Pool
          </Button>
        </div>
      )}
    </div>
  );
}
