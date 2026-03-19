import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  error: Error | null | undefined;
  className?: string;
}

export default function ErrorMessage({ error, className }: ErrorMessageProps) {
  if (!error) return null;
  return (
    <div className={cn('flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3', className)}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{error.message}</span>
    </div>
  );
}
