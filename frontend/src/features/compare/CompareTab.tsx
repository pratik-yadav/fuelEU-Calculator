import { useComparison } from '@/hooks/useComparison';
import { useSetActiveTab } from '@/stores/app.store';
import { ApiClientError } from '@/lib/api-client';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonChart } from './ComparisonChart';
import { LoadingOverlay } from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export function CompareTab() {
  const { comparison, isLoading, error } = useComparison();
  const setActiveTab = useSetActiveTab();

  if (isLoading) return <LoadingOverlay message="Loading comparison data..." />;

  if (error) {
    const isNoBaseline = error instanceof ApiClientError && error.statusCode === 422;
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-100">
            {isNoBaseline ? 'No Baseline Set' : 'Failed to Load Comparison'}
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            {isNoBaseline
              ? 'You need to set a baseline route before comparing GHG intensities.'
              : error.message}
          </p>
          {isNoBaseline && (
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setActiveTab('routes')}
            >
              Go to Routes Tab
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Route Comparison</h2>
        <p className="text-sm text-slate-400 mt-1">All routes compared against the baseline GHG intensity.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-base font-semibold text-slate-100">Comparison Results</h3>
          </div>
          <ComparisonTable data={comparison} loading={isLoading} />
        </div>
        <ComparisonChart data={comparison} />
      </div>
    </div>
  );
}
