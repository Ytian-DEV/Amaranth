import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { pageWindow } from './pageWindow';

/** Page links that keep the other query parameters (?category=…). */
export function Pagination({ page, pageCount, className }: { page: number; pageCount: number; className?: string }) {
  const location = useLocation();
  if (pageCount <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(location.search);
    if (p <= 1) params.delete('page');
    else params.set('page', String(p));
    const qs = params.toString();
    return `${location.pathname}${qs ? `?${qs}` : ''}`;
  };

  const item = 'inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-button';
  return (
    <nav aria-label="Pagination" className={cn('flex flex-col items-center gap-3', className)}>
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          {page > 1 ? (
            <Link to={href(page - 1)} className={cn(item, 'gap-1 text-green-700 hover:bg-lime-soft')} rel="prev">
              <ChevronLeft className="size-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">Newer</span>
            </Link>
          ) : null}
        </li>
        {pageWindow(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} className="px-1 text-ink-muted" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                to={href(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={cn(item, p === page ? 'bg-green-700 text-on-dark' : 'text-ink hover:bg-lime-soft')}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link to={href(page + 1)} className={cn(item, 'gap-1 text-green-700 hover:bg-lime-soft')} rel="next">
              <span className="sr-only sm:not-sr-only">Older</span>
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </li>
      </ul>
      <p className="text-meta text-ink-muted">
        Page {page} of {pageCount}
      </p>
    </nav>
  );
}
