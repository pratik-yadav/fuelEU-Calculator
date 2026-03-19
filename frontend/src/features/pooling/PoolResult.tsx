import type { PoolMember } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCB, cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface PoolResultProps {
  members: PoolMember[];
  onReset: () => void;
}

export function PoolResult({ members, onReset }: PoolResultProps) {
  return (
    <Card>
      <CardHeader
        title="Pool Created Successfully"
        action={
          <Button variant="outline" size="sm" onClick={onReset}>
            Create Another Pool
          </Button>
        }
      />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6 text-green-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">
            Compliance pool established. Surplus transferred to deficit ships.
          </span>
        </div>

        <div className="space-y-3">
          {members.map((m) => {
            const delta = m.cbAfter - m.cbBefore;
            return (
              <div
                key={m.shipId}
                className="flex items-center gap-4 bg-slate-800 rounded-xl px-5 py-4"
              >
                <span className="font-mono text-teal-400 font-semibold text-sm w-14 flex-shrink-0">
                  {m.shipId}
                </span>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">CB Before</p>
                    <p
                      className={cn(
                        'font-mono font-medium text-xs',
                        m.cbBefore >= 0 ? 'text-green-400' : 'text-red-400',
                      )}
                    >
                      {formatCB(m.cbBefore)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">CB After</p>
                    <p
                      className={cn(
                        'font-mono font-medium text-xs',
                        m.cbAfter >= 0 ? 'text-green-400' : 'text-red-400',
                      )}
                    >
                      {formatCB(m.cbAfter)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Transfer</p>
                    <p
                      className={cn(
                        'font-mono font-medium text-xs',
                        delta > 0
                          ? 'text-teal-400'
                          : delta < 0
                            ? 'text-amber-400'
                            : 'text-slate-500',
                      )}
                    >
                      {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${formatCB(delta)}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
