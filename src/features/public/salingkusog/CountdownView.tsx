import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HUB_ALIAS_PATH, remaining, remainingSentence, startLine } from '@/lib/countdown';
import { cn } from '@/lib/cn';

/** Line mark: a flame between two wings inside a ring. One colour, no effects (original, not a copy of any film emblem). */
export function FlameEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden focusable="false">
      <circle cx="32" cy="32" r="29" />
      <path d="M32 12c5 7 9 12 8.5 20-.5 7-4 11-8.5 13-4.5-2-8-6-8.5-13-.5-8 3.5-13 8.5-20Z" />
      <path d="M32 24c2.5 3.5 4 6 3.8 9.5-.3 3.5-1.8 5-3.8 6-2-1-3.5-2.5-3.8-6-.2-3.5 1.3-6 3.8-9.5Z" />
      <path d="M23.5 38C17 36 12.5 32 9.5 26c4.5 2.5 8.5 3.5 13 3.5M40.5 38c6.5-2 11-6 14-12-4.5 2.5-8.5 3.5-13 3.5" />
      <path d="M24 47h16" />
    </svg>
  );
}

function useNow(stopAt: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (Date.now() >= stopAt) return;
    // tick on the second boundary so the numbers change together
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      if (d.getTime() < stopAt) timer = setTimeout(tick, 1000 - (d.getTime() % 1000) + 5);
    };
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => clearTimeout(timer);
  }, [stopAt]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function CountdownView({ title, target, now: fixedNow }: { title: string; target: string; now?: Date }) {
  const live = useNow(new Date(target).getTime());
  const now = fixedNow ?? live;
  const r = remaining(target, now);
  // screen readers hear the time once a minute, not every second
  const minuteKey = `${r.days}-${r.hours}-${r.minutes}-${r.done}`;
  const spoken = useMemo(() => remainingSentence(r), [minuteKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const units = [
    ['Days', String(r.days)],
    ['Hours', pad(r.hours)],
    ['Minutes', pad(r.minutes)],
    ['Seconds', pad(r.seconds)],
  ] as const;

  return (
    <div className="flex min-h-dvh flex-col bg-charcoal text-ash">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between border-b border-ash/15 px-4 py-4 md:px-8 md:py-5">
        <Link to="/" className="flex items-center gap-2.5 text-gold-light">
          <FlameEmblem className="size-7" />
          <span className="font-serif text-[17px] font-bold uppercase tracking-[0.2em]">Amaranth</span>
        </Link>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
          <abbr title="Visayas State University" className="no-underline sm:hidden">VSU</abbr>
          <span className="hidden sm:inline">Visayas State University</span>
        </span>
      </header>

      <main id="main" className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center gap-10 overflow-hidden px-4 py-12 md:gap-14 md:px-8 md:py-16">
        <FlameEmblem className="pointer-events-none absolute -right-24 top-1/2 hidden size-[520px] -translate-y-1/2 text-on-dark/[0.04] lg:block" />

        <div className="relative flex flex-col gap-4">
          <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-light">
            <span className="h-px w-10 bg-gold-light" aria-hidden />
            Official notice
          </p>
          <h1 className="font-serif text-[48px] font-semibold leading-[0.95] tracking-[-0.02em] text-on-dark md:text-[104px]">{title}</h1>
          <p className="max-w-[34ch] text-[17px] leading-relaxed md:text-[19px]">
            {r.done ? 'The intramural games of Visayas State University are underway.' : 'The intramural games of Visayas State University begin in'}
          </p>
        </div>

        {r.done ? (
          <p className="relative font-serif text-[40px] font-semibold leading-none text-ember md:text-[72px]">Let the games begin.</p>
        ) : (
          <div role="timer" aria-label={`Countdown to ${title}`} className="relative">
            <ol className="grid grid-cols-2 border-y border-ash/20 md:grid-cols-4" aria-hidden>
              {units.map(([label, value], i) => (
                <li key={label} className={cn('flex flex-col gap-2 py-5 md:py-7', i % 2 === 1 && 'border-l border-ash/20 pl-5', i > 0 && 'md:border-l md:border-ash/20 md:pl-7', i >= 2 && 'border-t border-ash/20 md:border-t-0')}>
                  <span className={cn('font-serif text-[64px] font-semibold leading-none tabular-nums md:text-[112px]', label === 'Seconds' ? 'text-ember' : 'text-on-dark')}>{value}</span>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.18em]">{label}</span>
                </li>
              ))}
            </ol>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {spoken}
            </p>
          </div>
        )}

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[15px]">
            <span className="text-on-dark">Opening day</span>
            <span className="mx-2 text-ash/50" aria-hidden>
              —
            </span>
            {startLine(target)}
          </p>
          <Link
            to={HUB_ALIAS_PATH}
            className="inline-flex items-center justify-center gap-3 self-start bg-gold-light px-6 py-3.5 text-[15px] font-semibold text-charcoal transition-colors hover:bg-on-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-light md:self-auto"
          >
            Continue to Salingkusog <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 border-t border-ash/15 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="font-serif text-[17px] italic text-gold-light">May the odds be ever in your faction’s favor.</p>
        <p className="text-[12px]">An Amaranth special coverage</p>
      </footer>
    </div>
  );
}
