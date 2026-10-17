import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Category pill (Figma "Tag"). */
export function Tag({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm bg-green-soft px-2 py-1 font-sans text-kicker uppercase text-green-700',
        className,
      )}
      {...rest}
    />
  );
}

/** Uppercase section label above headlines ("NEWS · ENVIRONMENT"). */
export function Kicker({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('block font-sans text-kicker uppercase text-green-500-text', className)} {...rest} />;
}
