import type { ReactNode } from 'react';
import type { ArticleStatus } from '@/lib/database.types';
import { statusInfo, tones, type Tone } from './status';
import { cn } from '@/lib/cn';

/** Pill with a dot (Figma admin "Status"). */
export function Pill({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-meta', tones[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export function StatusPill({ status, className }: { status: ArticleStatus; className?: string }) {
  const info = statusInfo[status];
  return (
    <Pill tone={info.tone} className={className}>
      {info.label}
    </Pill>
  );
}
