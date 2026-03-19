import { useAdjustedCB } from '@/hooks/useCompliance';
import { formatCB, cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

interface ShipCardProps {
  shipId: string;
  year: number;
  selected: boolean;
  onToggle: () => void;
}

function ShipCard({ shipId, year, selected, onToggle }: ShipCardProps) {
  const { adjustedCB, isLoading } = useAdjustedCB(shipId, year);
  const cb = adjustedCB?.adjustedCb ?? null;

  return (
    <div
      onClick={onToggle}
      className={cn(
        'relative bg-slate-800 border rounded-xl p-4 cursor-pointer select-none transition-all',
        selected
          ? 'border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/30'
          : 'border-slate-700 hover:border-slate-600',
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-slate-950" />
        </div>
      )}
      <p className="font-mono text-lg font-bold text-slate-100">{shipId}</p>
      {isLoading ? (
        <Spinner size="xs" className="mt-2" />
      ) : cb !== null ? (
        <p
          className={cn(
            'text-sm font-mono font-medium mt-1',
            cb >= 0 ? 'text-green-400' : 'text-red-400',
          )}
        >
          {formatCB(cb)}
        </p>
      ) : (
        <p className="text-sm text-slate-500 mt-1">CB unavailable</p>
      )}
      <p className="text-xs text-slate-500 mt-1">Adjusted CB</p>
    </div>
  );
}

interface ShipSelectorProps {
  shipIds: readonly string[];
  selected: string[];
  year: number;
  onToggle: (shipId: string) => void;
}

export function ShipSelector({ shipIds, selected, year, onToggle }: ShipSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {shipIds.map((id) => (
        <ShipCard
          key={id}
          shipId={id}
          year={year}
          selected={selected.includes(id)}
          onToggle={() => onToggle(id)}
        />
      ))}
    </div>
  );
}
