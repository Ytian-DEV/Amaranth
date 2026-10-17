import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'outline' | 'accent' | 'ghost' | 'danger' | 'on-dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-[8px] font-sans text-button whitespace-nowrap transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-green-700 text-on-dark hover:bg-green-900 focus-visible:outline-green-700',
  outline: 'border-[1.5px] border-green-700 text-green-700 hover:bg-green-soft focus-visible:outline-green-700',
  accent: 'bg-lime text-green-900 hover:bg-lime-dark hover:text-on-dark focus-visible:outline-green-900',
  ghost: 'text-green-700 hover:bg-green-soft focus-visible:outline-green-700',
  danger: 'bg-alert text-on-dark hover:opacity-90 focus-visible:outline-alert',
  'on-dark': 'border-[1.5px] border-on-dark-muted text-on-dark hover:bg-green-700 focus-visible:outline-lime',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-[41px] px-5',
  lg: 'h-12 px-6 text-[15px]',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

