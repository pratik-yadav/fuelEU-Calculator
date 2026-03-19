import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  valueClassName?: string;
  loading?: boolean;
}

export default function StatCard({ label, value, subValue, trend, trendValue, className, valueClassName, loading }: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <div className={cn('bg-slate-900 border border-slate-800 rounded-xl p-5', className)}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      {loading ? (
        <div className="mt-2"><Spinner size="sm" /></div>
      ) : (
        <p className={cn('text-2xl font-bold text-slate-50 mt-1 tracking-tight', valueClassName)}>{value}</p>
      )}
      {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      {trend && trendValue && !loading && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColor)}>
          <TrendIcon className="w-3 h-3" />
          {trendValue}
        </div>
      )}
    </div>
  );
}
