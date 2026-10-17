import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicErrorMessage } from '@/lib/errors';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-line/70', className)} aria-hidden />;
}

export function Spinner({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-meta text-ink-muted', className)}>
      <span className="size-4 animate-spin rounded-full border-2 border-green-700 border-r-transparent" aria-hidden />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center', className)}>
      <p className="font-serif text-headline-m text-ink">{title}</p>
      {children && <div className="max-w-md text-body-m text-ink-muted">{children}</div>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'We couldn’t load this',
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center gap-3 rounded-lg border border-alert/30 bg-alert-soft px-6 py-10 text-center', className)}
    >
      <p className="font-serif text-headline-m text-ink">{title}</p>
      <p className="max-w-md text-body-m text-ink-muted">{publicErrorMessage(error)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-button text-green-700 underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: 'info' | 'success' | 'error';
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-line bg-surface text-ink',
    success: 'border-green-500/30 bg-green-soft text-green-900',
    error: 'border-alert/30 bg-alert-soft text-alert',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-lg border px-4 py-3 text-body-m', tones[tone], className)}>
      {children}
    </div>
  );
}
