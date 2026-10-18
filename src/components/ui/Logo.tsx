import { cn } from '@/lib/cn';

/** Amaranth flower mark (brand SVG in /public). */
export function LogoMark({ className }: { className?: string }) {
  return <img src="/amaranth-logo.svg" alt="" width={40} height={38} className={cn('h-10 w-auto', className)} />;
}

/** Mark + AMARANTH wordmark, optionally with a subtitle ("Newsroom"). */
export function Lockup({
  className,
  tone = 'dark',
  subtitle,
}: {
  className?: string;
  tone?: 'dark' | 'light';
  subtitle?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="h-[1.5em]" />
      <span className="flex flex-col">
        <span
          className={cn(
            'font-wordmark font-bold leading-none tracking-[0.08em]',
            tone === 'light' ? 'text-lime' : 'text-green-900',
          )}
        >
          AMARANTH
        </span>
        {subtitle && (
          <span className={cn('mt-1 text-meta font-normal', tone === 'light' ? 'text-lime' : 'text-ink-muted')}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
