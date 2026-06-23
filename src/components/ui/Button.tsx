import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';

interface ButtonProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        variant === 'primary' && 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700',
        variant === 'secondary' && 'border border-brand-600 bg-white text-brand-700 hover:bg-brand-50',
        variant === 'ghost' && 'bg-transparent text-slate-900 hover:bg-slate-100',
        className
      )}
      {...props}
    />
  );
}
