import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToasts, useAppStore, type Toast } from '@/stores/app.store';
import { cn } from '@/lib/utils';

const iconMap = {
  success: <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-teal-400 flex-shrink-0" />,
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useAppStore((s) => s.removeToast);
  return (
    <div
      className={cn(
        'bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4',
        'flex items-start gap-3 min-w-[280px] max-w-[380px]',
        'animate-in fade-in slide-in-from-right-4 duration-200',
      )}
    >
      {iconMap[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
        {toast.message && <p className="text-xs text-slate-400 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
