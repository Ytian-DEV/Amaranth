import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HUB_ALIAS_PATH, remaining, remainingSentence, startLine } from '@/lib/countdown';
import { cn } from '@/lib/cn';

/** Original emblem: a flame rising between two outstretched wings, inside a ring (a homage, not a copy). */
export function FlameEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden focusable="false">
      <circle cx="80" cy="80" r="74" fill="none" stroke="var(--color-gold-light)" strokeWidth="3" />
      <circle cx="80" cy="80" r="64" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" strokeDasharray="2 6" />
      {/* wings */}
      <path d="M78 98 C58 92 40 80 26 62 C44 70 56 72 66 70 C54 66 46 60 40 52 C54 58 64 60 72 60 Z" fill="var(--color-gold)" />
      <path d="M82 98 C102 92 120 80 134 62 C116 70 104 72 94 70 C106 66 114 60 120 52 C106 58 96 60 88 60 Z" fill="var(--color-gold)" />
      {/* flame */}
      <g className="sk-flame">
        <path d="M80 30 C92 48 102 60 100 80 C98 98 90 108 80 112 C70 108 62 98 60 80 C58 62 70 50 80 30 Z" fill="var(--color-ember-deep)" />
        <path d="M80 46 C88 60 94 70 92 84 C90 98 85 104 80 106 C75 104 70 98 68 84 C66 70 72 60 80 46 Z" fill="var(--color-ember)" />
        <path d="M80 66 C84 74 87 80 86 88 C85 96 82 99 80 100 C78 99 75 96 74 88 C73 80 76 74 80 66 Z" fill="var(--color-gold-light)" />
      </g>
      {/* base */}
      <path d="M58 118 H102 L96 126 H64 Z" fill="var(--color-gold)" />
    </svg>
  );
}

/** Deterministic ember field (no Math.random, so it renders the same on every load). */
function Embers({ count = 22 }: { count?: number }) {
  const embers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
        return { left: `${(r(1) * 100).toFixed(1)}%`, size: 2 + Math.round(r(2) * 4), dur: `${7 + r(3) * 8}s`, delay: `${-r(4) * 12}s`, drift: `${Math.round((r(5) - 0.5) * 120)}px` };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {embers.map((e, i) => (
        <span key={i} className="sk-ember" style={{ left: e.left, width: e.size, height: e.size, ['--dur' as string]: e.dur, ['--delay' as string]: e.delay, ['--drift' as string]: e.drift }} />
      ))}
    </div>
  );
}

function useNow(stopAt: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (Date.now() >= stopAt) return;
    // tick on the second boundary so all four boxes change together
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

  const boxes = [
    ['Days', r.days],
    ['Hours', r.hours],
    ['Minutes', r.minutes],
    ['Seconds', r.seconds],
  ] as const;

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-charcoal text-ash">
      {/* ember glow from below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[70%] bg-[radial-gradient(ellipse_at_50%_100%,color-mix(in_oklab,var(--color-ember-deep)_55%,transparent),transparent_70%)]" aria-hidden />
      <Embers />

      <header className="relative flex items-center justify-between px-4 py-4 md:px-10 md:py-6">
        <Link to="/" className="font-serif text-[18px] font-bold uppercase tracking-[0.25em] text-gold-light md:text-[20px]">
          Amaranth
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-ash">Special coverage</span>
      </header>

      <main id="main" className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-14 pt-4 text-center md:gap-8 md:pb-20">
        <FlameEmblem className="size-24 drop-shadow-[0_0_24px_color-mix(in_oklab,var(--color-ember)_45%,transparent)] md:size-32" />
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-gold-light md:text-[13px]">The games of the year</p>
          <h1 className="font-serif text-[40px] font-bold uppercase leading-[0.95] tracking-[0.08em] text-on-dark md:text-[80px]">{title}</h1>
          {!r.done && <p className="font-serif text-[18px] uppercase tracking-[0.3em] text-ember md:text-[22px]">begin in</p>}
        </div>

        {r.done ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-serif text-[34px] font-bold uppercase leading-tight tracking-[0.06em] text-ember md:text-[56px]">The games have begun</p>
            <p className="max-w-md text-body-m">Follow the live scores, medal tally and every result on the Salingkusog hub.</p>
          </div>
        ) : (
          <div role="timer" aria-label={`Countdown to ${title}`} className="flex flex-col items-center gap-4">
            <ol className="grid grid-cols-4 gap-2 sm:gap-4" aria-hidden>
              {boxes.map(([label, value]) => (
                <li key={label} className="flex w-[72px] flex-col items-center gap-1 rounded-[10px] border border-gold/40 bg-charcoal-2/90 px-1 py-3 shadow-[inset_0_-12px_24px_-12px_color-mix(in_oklab,var(--color-ember)_35%,transparent)] sm:w-[104px] md:w-[136px] md:py-5">
                  <span className="font-serif text-[34px] font-bold leading-none tabular-nums text-on-dark sm:text-[48px] md:text-[64px]">{label === 'Days' ? value : pad(value)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ash sm:text-[11px] md:text-[12px]">{label}</span>
                </li>
              ))}
            </ol>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {spoken}
            </p>
            <p className="text-meta md:text-body-m">Opening: {startLine(target)}</p>
          </div>
        )}

        <p className="max-w-xl font-serif text-[20px] italic leading-snug text-gold-light md:text-[26px]">“May the odds be ever in your faction’s favor.”</p>

        <Link
          to={HUB_ALIAS_PATH}
          className={cn(
            'inline-flex items-center gap-2 rounded-full bg-gold-light font-semibold text-charcoal transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-light',
            r.done ? 'px-8 py-4 text-[18px] shadow-[0_0_32px_color-mix(in_oklab,var(--color-ember)_55%,transparent)]' : 'px-6 py-3 text-[16px]',
          )}
        >
          Continue to Salingkusog <ArrowRight className="size-5" aria-hidden />
        </Link>
      </main>

      <footer className="relative px-4 pb-6 text-center text-[12px] text-ash md:pb-8">An Amaranth special coverage · Visayas State University</footer>
    </div>
  );
}
