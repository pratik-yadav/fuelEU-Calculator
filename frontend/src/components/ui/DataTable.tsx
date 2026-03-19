import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadingOverlay } from './Spinner';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render?: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  emptyTitle?: string;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  className?: string;
}

const alignClasses = { left: 'text-left', center: 'text-center', right: 'text-right' };

export default function DataTable<T extends object>({
  columns,
  data,
  loading,
  error,
  emptyMessage,
  emptyTitle = 'No data',
  onRowClick,
  rowKey,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/50',
                  alignClasses[col.align ?? 'left'],
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>
                <LoadingOverlay />
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-red-400">{error.message}</p>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyTitle} description={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-slate-800/50 transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-slate-800/40' : 'hover:bg-slate-800/20',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-slate-200', alignClasses[col.align ?? 'left'], col.className)}
                  >
                    {col.render
                      ? col.render(row, index)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
