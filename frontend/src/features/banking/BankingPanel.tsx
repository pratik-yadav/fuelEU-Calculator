import { useState } from 'react';
import type { ComplianceCB } from '@/types';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatCard from '@/components/ui/StatCard';
import { formatCB, cn } from '@/lib/utils';

interface BankingPanelProps {
  shipId: string;
  year: number;
  cb: ComplianceCB | null;
  cbLoading: boolean;
  onBank: (amount: number) => Promise<void>;
  onApply: (amount: number) => Promise<void>;
  bankingLoading?: boolean;
  applyLoading?: boolean;
}

export function BankingPanel({
  cb,
  cbLoading,
  onBank,
  onApply,
  bankingLoading,
  applyLoading,
}: BankingPanelProps) {
  const [bankAmount, setBankAmount] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [bankError, setBankError] = useState('');
  const [applyError, setApplyError] = useState('');

  const hasSurplus = cb !== null && cb.cb > 0;
  const hasDeficit = cb !== null && cb.cb < 0;

  const handleBank = async () => {
    const amount = Number(bankAmount);
    if (!amount || amount <= 0) {
      setBankError('Enter a positive amount.');
      return;
    }
    if (cb && amount > cb.cb) {
      setBankError(`Amount exceeds available CB (${formatCB(cb.cb)}).`);
      return;
    }
    setBankError('');
    try {
      await onBank(amount);
      setBankAmount('');
    } catch (err) {
      setBankError((err as Error).message);
    }
  };

  const handleApply = async () => {
    const amount = Number(applyAmount);
    if (!amount || amount <= 0) {
      setApplyError('Enter a positive amount.');
      return;
    }
    setApplyError('');
    try {
      await onApply(amount);
      setApplyAmount('');
    } catch (err) {
      setApplyError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Compliance Balance"
          value={cb ? formatCB(cb.cb) : '—'}
          subValue={cb ? (cb.cb > 0 ? 'Surplus' : cb.cb < 0 ? 'Deficit' : 'Neutral') : undefined}
          valueClassName={
            cb
              ? cb.cb > 0
                ? 'text-green-400'
                : cb.cb < 0
                  ? 'text-red-400'
                  : 'text-slate-50'
              : 'text-slate-500'
          }
          loading={cbLoading}
        />
        <StatCard
          label="GHG Intensity"
          value={cb ? cb.ghgIntensity.toFixed(5) : '—'}
          subValue="gCO₂eq/MJ"
          loading={cbLoading}
        />
        <StatCard
          label="Energy"
          value={cb ? `${(cb.energy / 1_000_000).toFixed(2)}M` : '—'}
          subValue="MJ"
          loading={cbLoading}
        />
      </div>

      {/* Action panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Surplus */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                hasSurplus ? 'bg-green-400' : 'bg-slate-600',
              )}
            />
            <h4 className="text-sm font-semibold text-slate-100">Bank Surplus CB</h4>
          </div>

          {!hasSurplus && !cbLoading && (
            <p className="text-xs text-slate-500 mb-4 bg-slate-800 rounded-lg px-3 py-2">
              {cb
                ? `Ship has deficit (CB = ${formatCB(cb.cb)}). Banking requires surplus.`
                : 'Select a ship to view CB.'}
            </p>
          )}

          <Input
            label="Amount (gCO₂eq)"
            type="number"
            min="1"
            placeholder="e.g. 50000"
            value={bankAmount}
            onChange={(e) => {
              setBankAmount(e.target.value);
              setBankError('');
            }}
            error={bankError}
            hint={hasSurplus ? `Max: ${formatCB(cb!.cb)}` : undefined}
            disabled={!hasSurplus || cbLoading}
          />

          <Button
            variant="primary"
            size="md"
            className="w-full mt-4"
            loading={bankingLoading}
            disabled={!hasSurplus || !bankAmount || cbLoading}
            onClick={handleBank}
          >
            Bank Surplus
          </Button>
        </Card>

        {/* Apply Banked */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                hasDeficit ? 'bg-teal-400' : 'bg-slate-600',
              )}
            />
            <h4 className="text-sm font-semibold text-slate-100">Apply Banked CB</h4>
          </div>

          {!hasDeficit && !cbLoading && (
            <p className="text-xs text-slate-500 mb-4 bg-slate-800 rounded-lg px-3 py-2">
              {cb
                ? `Ship has surplus (CB = ${formatCB(cb.cb)}). Apply requires deficit.`
                : 'Select a ship to view CB.'}
            </p>
          )}

          <Input
            label="Amount (gCO₂eq)"
            type="number"
            min="1"
            placeholder="e.g. 10000"
            value={applyAmount}
            onChange={(e) => {
              setApplyAmount(e.target.value);
              setApplyError('');
            }}
            error={applyError}
            hint={hasDeficit ? 'Must not exceed net banked balance' : undefined}
            disabled={!hasDeficit || cbLoading}
          />

          <Button
            variant="secondary"
            size="md"
            className="w-full mt-4"
            loading={applyLoading}
            disabled={!hasDeficit || !applyAmount || cbLoading}
            onClick={handleApply}
          >
            Apply to Deficit
          </Button>
        </Card>
      </div>
    </div>
  );
}
