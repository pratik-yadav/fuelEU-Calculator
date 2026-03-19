import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { GHG_TARGET } from '@/lib/constants';
import type { ComparisonResult } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';

interface ComparisonChartProps {
  data: ComparisonResult[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ComparisonResult }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-semibold text-teal-400 font-mono">{label}</p>
      <p className="text-xs text-slate-300 mt-1">GHG: <span className="font-mono">{item.ghgIntensity.toFixed(5)}</span> gCO₂eq/MJ</p>
      <p className="text-xs mt-1">
        <span className={item.compliant ? 'text-green-400' : 'text-red-400'}>
          {item.compliant ? '✓ Compliant' : '✗ Non-compliant'}
        </span>
      </p>
    </div>
  );
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  return (
    <Card>
      <CardHeader title="GHG Intensity vs. Target" subtitle="FuelEU 2025–2029 target: 89.33680 gCO₂eq/MJ" />
      <div className="p-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="routeId"
              tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[40, 100]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
            <ReferenceLine
              y={GHG_TARGET}
              stroke="#f59e0b"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{ value: 'Target 89.3368', fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }}
            />
            <Bar dataKey="ghgIntensity" radius={[4, 4, 0, 0]} maxBarSize={52}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.compliant ? '#10b981' : '#ef4444'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
