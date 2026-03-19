import { useState } from 'react';
import { useComplianceCB } from '@/hooks/useCompliance';
import { useBankingRecords, useBankSurplus, useApplyBank } from '@/hooks/useBanking';
import { useAddToast } from '@/stores/app.store';
import { BankingPanel } from './BankingPanel';
import { BankingHistory } from './BankingHistory';
import Select from '@/components/ui/Select';
import { SHIP_IDS, CURRENT_YEAR } from '@/lib/constants';
import type { BankRequest, ApplyRequest } from '@/types';

export function BankingTab() {
  const [selectedShipId, setSelectedShipId] = useState('');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const addToast = useAddToast();

  const { cb, isLoading: cbLoading } = useComplianceCB(
    selectedShipId || undefined,
    selectedYear,
  );
  const { records, isLoading: recordsLoading, error: recordsError } = useBankingRecords(
    selectedShipId || undefined,
    selectedYear,
  );
  const { execute: bank, isLoading: bankLoading } = useBankSurplus(selectedShipId, selectedYear);
  const { execute: applyBank, isLoading: applyLoading } = useApplyBank(
    selectedShipId,
    selectedYear,
  );

  const handleBank = async (amount: number) => {
    const body: BankRequest = { shipId: selectedShipId, year: selectedYear, amount };
    await bank(body);
    addToast({
      type: 'success',
      title: 'Surplus banked',
      message: `Banked ${amount.toLocaleString()} gCO₂eq for ${selectedShipId}.`,
    });
  };

  const handleApply = async (amount: number) => {
    const body: ApplyRequest = { shipId: selectedShipId, year: selectedYear, amount };
    await applyBank(body);
    addToast({
      type: 'success',
      title: 'Applied to deficit',
      message: `Applied ${amount.toLocaleString()} gCO₂eq to ${selectedShipId}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Banking — Article 20</h2>
        <p className="text-sm text-slate-400 mt-1">
          Bank surplus Compliance Balance or apply banked CB to offset deficit.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select
          label="Ship (Route ID)"
          value={selectedShipId}
          onChange={(e) => setSelectedShipId(e.target.value)}
          placeholder="Select a ship"
          options={[...SHIP_IDS].map((id) => ({ value: id, label: id }))}
          className="min-w-[160px]"
        />
        <Select
          label="Year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          options={[2025, 2024, 2023].map((y) => ({ value: y, label: String(y) }))}
          className="min-w-[120px]"
        />
      </div>

      {selectedShipId ? (
        <div className="space-y-6">
          <BankingPanel
            shipId={selectedShipId}
            year={selectedYear}
            cb={cb}
            cbLoading={cbLoading}
            onBank={handleBank}
            onApply={handleApply}
            bankingLoading={bankLoading}
            applyLoading={applyLoading}
          />
          <BankingHistory
            records={records}
            loading={recordsLoading}
            error={recordsError}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[300px] text-slate-500 text-sm">
          Select a ship to view compliance balance and banking options.
        </div>
      )}
    </div>
  );
}
