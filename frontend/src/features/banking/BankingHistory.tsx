import type { BankEntry } from '@/types';
import type { Column } from '@/components/ui/DataTable';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatCB, formatDate, cn } from '@/lib/utils';

interface BankingHistoryProps {
  records: BankEntry[];
  loading: boolean;
  error?: Error;
}

export function BankingHistory({ records, loading, error }: BankingHistoryProps) {
  const columns: Column<BankEntry>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'BANKED' ? 'success' : 'teal'}>{row.type}</Badge>
      ),
    },
    {
      key: 'amountGco2eq',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span
          className={cn(
            'font-mono text-sm font-medium',
            row.type === 'BANKED' ? 'text-green-400' : 'text-teal-400',
          )}
        >
          {row.type === 'BANKED' ? '+' : '-'}
          {formatCB(Math.abs(row.amountGco2eq))}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => (
        <span className="text-slate-400 text-xs">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader title="Banking History" subtitle="All ledger entries for this ship" />
      <DataTable<BankEntry>
        columns={columns}
        data={records}
        loading={loading}
        error={error ?? null}
        rowKey={(r) => r.id}
        emptyTitle="No banking records"
        emptyMessage="Bank or apply surplus CB to see ledger entries here."
      />
    </Card>
  );
}
