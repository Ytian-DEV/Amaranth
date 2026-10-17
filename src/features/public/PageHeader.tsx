import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Lime-bar page title band used by section, archive, search and form pages. */
export function PageHeader({
  title,
  intro,
  children,
  narrow,
}: {
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  narrow?: boolean;
}) {
  return (
    <header className="border-b border-line bg-surface">
      <div className={cn('container-page flex flex-col gap-3 py-8 md:py-12', narrow && 'max-w-[960px]')}>
        <div className="flex items-center gap-4">
          <span className="h-8 w-1.5 shrink-0 rounded-[2px] bg-lime md:h-10" aria-hidden />
          <h1 className="font-serif text-[34px] font-bold leading-none tracking-[-1px] text-ink md:text-display-l">{title}</h1>
        </div>
        {intro && <div className="max-w-2xl text-body-m text-ink-muted md:text-body-l">{intro}</div>}
        {children}
      </div>
    </header>
  );
}
