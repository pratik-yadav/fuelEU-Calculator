import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'neutral' | 'info' | 'teal';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  neutral: 'bg-slate-700/50 text-slate-300 border border-slate-600/50',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  teal: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
};

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-400',
  danger: 'bg-red-400',
  warning: 'bg-amber-400',
  neutral: 'bg-slate-400',
  info: 'bg-blue-400',
  teal: 'bg-teal-400',
};

export default function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', variantClasses[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotClasses[variant])} />}
      {children}
    </span>
  );
}
