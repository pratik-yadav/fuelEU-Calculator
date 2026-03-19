import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return <Loader2 className={cn('animate-spin text-teal-400', sizeClasses[size], className)} />;
}

interface LoadingOverlayProps {
  className?: string;
  message?: string;
}

export function LoadingOverlay({ className, message }: LoadingOverlayProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[200px] gap-3', className)}>
      <Spinner size="lg" />
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}
