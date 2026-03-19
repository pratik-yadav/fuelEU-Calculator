import { type SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  selectSize?: 'sm' | 'md' | 'lg';
}

const sizeClasses = { sm: 'pl-3 pr-8 py-1.5 text-sm', md: 'pl-3 pr-8 py-2 text-sm', lg: 'pl-4 pr-9 py-2.5 text-base' };

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, selectSize = 'md', className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none bg-slate-800 border rounded-lg text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer',
              sizeClasses[selectSize],
              error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700',
              className,
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-800 text-slate-100">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
export default Select;
