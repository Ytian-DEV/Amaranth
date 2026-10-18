import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router-dom';
import { cn } from '@/lib/cn';

/** The Amaranth mark, rotating: the loading state for whole pages. Pulses instead with reduced motion. */
export function LogoLoader({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('grid min-h-[60vh] place-items-center', className)}>
      <div className="flex flex-col items-center gap-3">
        <img src="/amaranth-logo.svg" alt="" width={56} height={54} className="size-14 animate-[spin_1.6s_linear_infinite] motion-reduce:animate-pulse" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

/** Small rotating logo while the router loads the next page (only when it takes a moment). */
export function NavigationLoader({ delay = 300 }: { delay?: number }) {
  const loading = useNavigation().state === 'loading';
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [loading, delay]);
  if (!visible) return null;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center">
      <span className="grid size-14 place-items-center rounded-full bg-surface shadow-raised">
        <img src="/amaranth-logo.svg" alt="" width={36} height={34} className="size-9 animate-[spin_1.6s_linear_infinite] motion-reduce:animate-pulse" />
      </span>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
