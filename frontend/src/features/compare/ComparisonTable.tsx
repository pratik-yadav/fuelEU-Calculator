import type { ComparisonResult } from '@/types';
import type { Column } from '@/components/ui/DataTable';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatGhg, formatPercent } from '@/lib/utils';
import { GHG_TARGET } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  data: ComparisonResult[];
  loading?: boolean;
}

export function ComparisonTable({ data, loading }: ComparisonTableProps) {
  const columns: Column<ComparisonResult>[] = [
    {
      key: 'routeId',
      header: 'Route',
      render: (row) => <span className="font-mono text-teal-400 font-semibold">{row.routeId}</span>,
    },
    {
      key: 'ghgIntensity',
      header: 'GHG Intensity',
      render: (row) => (
        <span className={cn('font-mono text-xs font-medium', row.ghgIntensity <= GHG_TARGET ? 'text-green-400' : 'text-red-400')}>
          {formatGhg(row.ghgIntensity)}
        </span>
      ),
    },
    {
      key: 'baselineGhgIntensity',
      header: 'Baseline',
      render: (row) => <span className="font-mono text-xs text-slate-400">{formatGhg(row.baselineGhgIntensity)}</span>,
    },
    {
      key: 'percentDiff',
      header: 'vs. Baseline',
      align: 'right',
      render: (row) => (
        <span className={cn('font-mono text-xs font-medium', row.percentDiff < 0 ? 'text-green-400' : row.percentDiff > 0 ? 'text-red-400' : 'text-slate-400')}>
          {formatPercent(row.percentDiff)}
        </span>
      ),
    },
    {
      key: 'compliant',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <Badge variant={row.compliant ? 'success' : 'danger'} dot>
          {row.compliant ? 'Compliant' : 'Non-compliant'}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable<ComparisonResult>
      columns={columns}
      data={data}
      loading={loading}
      rowKey={(r) => r.routeId}
      emptyTitle="No comparison data"
      emptyMessage="Set a baseline route first to enable comparison."
    />
  );
}
