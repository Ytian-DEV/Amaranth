import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lockup } from '@/components/ui/Logo';

/** Split layout for staff auth screens: brand panel (≥768px) + form. */
export function AuthLayout({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden flex-col justify-between bg-green-900 p-12 text-on-dark md:flex">
        <Link to="/" className="text-[28px]" aria-label="Amaranth home">
          <Lockup tone="light" subtitle="Newsroom" />
        </Link>
        <div className="flex flex-col gap-4">
          <span className="h-7 w-1.5 rounded-[2px] bg-lime" aria-hidden />
          <p className="max-w-sm font-serif text-headline-l text-on-dark">Truth in every season.</p>
          <p className="max-w-sm text-body-m text-on-dark-muted">
            The staff workspace of Amaranth, the official student publication of Visayas State University.
          </p>
        </div>
        <p className="text-meta font-normal text-on-dark-muted">Baybay City, Leyte</p>
      </aside>

      <main id="main" className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <Link to="/" className="mb-10 text-[24px] md:hidden" aria-label="Amaranth home">
          <Lockup subtitle="Newsroom" />
        </Link>
        <div className="w-full max-w-[400px]">
          <h1 className="font-serif text-headline-l text-ink">{title}</h1>
          {intro && <div className="mt-2 text-body-m text-ink-muted">{intro}</div>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
