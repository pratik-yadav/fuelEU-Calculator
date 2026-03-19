import { useState } from 'react';
import { useRoutes, useSetBaseline } from '@/hooks/useRoutes';
import { useAddToast } from '@/stores/app.store';
import { RouteFilters } from './RouteFilters';
import { RouteTable } from './RouteTable';
import { Card, CardHeader } from '@/components/ui/Card';
import type { RouteFilters as IRouteFilters } from '@/types';

export function RoutesTab() {
  const [filters, setFilters] = useState<IRouteFilters>({});
  const [settingId, setSettingId] = useState<string | null>(null);
  const { routes, isLoading, error } = useRoutes(filters);
  const { setBaseline } = useSetBaseline();
  const addToast = useAddToast();

  const handleSetBaseline = async (id: string) => {
    setSettingId(id);
    try {
      const route = await setBaseline(id);
      addToast({ type: 'success', title: 'Baseline updated', message: `Route ${route.routeId} is now the baseline.` });
    } catch (err) {
      const e = err as Error;
      addToast({ type: 'error', title: 'Failed to set baseline', message: e.message });
    } finally {
      setSettingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Route Profiles</h2>
        <p className="text-sm text-slate-400 mt-1">Compare GHG intensities across fuel types and vessel configurations.</p>
      </div>

      <Card>
        <CardHeader title="Filters" />
        <div className="p-6">
          <RouteFilters filters={filters} onChange={setFilters} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Routes"
          subtitle={`${routes.length} route${routes.length !== 1 ? 's' : ''} found`}
        />
        <RouteTable
          routes={routes}
          isLoading={isLoading}
          error={error}
          onSetBaseline={handleSetBaseline}
          settingId={settingId}
        />
      </Card>
    </div>
  );
}
