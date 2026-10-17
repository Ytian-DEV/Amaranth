import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** White rounded panel used across the CMS (Figma "Recent Articles", "Submission Queue"). */
export function Card({ className, children, as: Tag = 'section', ...rest }: {
  className?: string;
  children: ReactNode;
  as?: 'section' | 'div' | 'article';
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn('rounded-[12px] border border-line bg-surface', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, id, action, className }: { title: ReactNode; id?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-5 pb-2 pt-5', className)}>
      <h2 id={id} className="font-serif text-headline-m text-ink">
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Title row of a CMS page: heading + subtitle on the left, actions on the right. */
export function CmsPageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h1 className="font-serif text-[28px] font-semibold leading-tight tracking-[-0.5px] text-ink md:text-headline-l">{title}</h1>
        {subtitle && <p className="mt-1 text-body-m text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, note, tone = 'muted' }: { label: string; value: ReactNode; note?: ReactNode; tone?: 'muted' | 'good' | 'alert' }) {
  return (
    <div className="flex flex-col gap-2 rounded-[12px] border border-line bg-surface p-5">
      <p className="text-kicker uppercase text-ink-muted">{label}</p>
      <p className="font-serif text-[34px] font-semibold leading-none text-ink md:text-[40px]">{value}</p>
      {note && (
        <p className={cn('text-meta', tone === 'good' ? 'text-green-500-text' : tone === 'alert' ? 'text-alert' : 'text-ink-muted')}>{note}</p>
      )}
    </div>
  );
}
