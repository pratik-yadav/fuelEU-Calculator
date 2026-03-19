import type { Route } from '@/types';
import type { Column } from '@/components/ui/DataTable';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatGhg } from '@/lib/utils';
import { GHG_TARGET } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface RouteTableProps {
  routes: Route[];
  isLoading: boolean;
  error?: Error;
  onSetBaseline: (id: string) => Promise<void>;
  settingId: string | null;
}

export function RouteTable({ routes, isLoading, error, onSetBaseline, settingId }: RouteTableProps) {
  const columns: Column<Route>[] = [
    {
      key: 'routeId',
      header: 'Route ID',
      render: (row) => <span className="font-mono text-teal-400 font-semibold">{row.routeId}</span>,
    },
    {
      key: 'vesselType',
      header: 'Vessel Type',
      render: (row) => <span className="text-slate-300">{row.vesselType}</span>,
    },
    {
      key: 'fuelType',
      header: 'Fuel Type',
      render: (row) => <Badge variant="neutral">{row.fuelType}</Badge>,
    },
    { key: 'year', header: 'Year', render: (row) => <span className="text-slate-400">{row.year}</span> },
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
      key: 'fuelConsumption',
      header: 'Fuel Consumption',
      render: (row) => <span className="text-slate-300">{row.fuelConsumption} t</span>,
      align: 'right',
    },
    {
      key: 'isBaseline',
      header: 'Baseline',
      align: 'center',
      render: (row) => row.isBaseline ? <Badge variant="teal" dot>Baseline</Badge> : null,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button
          variant={row.isBaseline ? 'ghost' : 'outline'}
          size="xs"
          disabled={row.isBaseline}
          loading={settingId === row.id}
          onClick={(e) => { e.stopPropagation(); onSetBaseline(row.id); }}
        >
          {row.isBaseline ? 'Current Baseline' : 'Set Baseline'}
        </Button>
      ),
    },
  ];

  return (
    <DataTable<Route>
      columns={columns}
      data={routes}
      loading={isLoading}
      error={error}
      rowKey={(r) => r.id}
      emptyTitle="No routes found"
      emptyMessage="Try clearing the filters or adding routes to the database."
    />
  );
}
