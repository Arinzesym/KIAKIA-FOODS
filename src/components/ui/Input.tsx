import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes, type DetailedHTMLProps } from 'react';

interface InputProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, helperText, className, ...props }, ref) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-900">
      <span>{label}</span>
      <input
        ref={ref}
        className={cn(
          'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
          error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </label>
  );
});

Input.displayName = 'Input';
