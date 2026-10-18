import { useState } from 'react';
import type { MediaAssetRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { publicUrl, srcSet } from '@/lib/media';
import type { HubData } from './skData';
import { venueGuide } from './venues';

const toneClass = { live: 'text-alert', next: 'text-green-700', done: 'text-green-700', none: 'text-ink-muted' } as const;

function Pin({ n, active, className }: { n: number | string; active?: boolean; className?: string }) {
  return (
    <span className={cn('grid size-8 shrink-0 place-items-center rounded-full border-2 border-lime bg-green-900 text-[14px] font-bold text-on-dark transition-transform md:size-10 md:text-[16px]', active && 'scale-125', className)}>
      {n}
    </span>
  );
}

export function VenuesView({ hub, map, now }: { hub: HubData; map: Pick<MediaAssetRow, 'bucket' | 'path' | 'width' | 'height' | 'alt_text'> | null; now?: Date }) {
  const rows = venueGuide(hub, now);
  const [active, setActive] = useState<string | null>(null);
  const mapUrl = map ? publicUrl(map.bucket, map.path) : undefined;
  const pins = rows.filter((r) => r.pinned);
  const number = (r: (typeof rows)[number], i: number) => r.venue.map_number ?? i + 1;

  return (
    <div className="container-page flex flex-col gap-6 pb-16 pt-8 md:gap-8 md:pb-20 md:pt-12">
      <div>
        <h2 className="font-serif text-[28px] font-semibold leading-tight tracking-[-0.5px] md:text-[40px]">Venue guide</h2>
        <p className="mt-1.5 text-body-m text-ink-muted">Where every Salingkusog game happens, and what’s on next at each venue</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-line px-6 py-12 text-center text-body-m text-ink-muted">Venues will be listed soon.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_412px] lg:items-start">
          {(mapUrl || pins.length > 0) && (
            <figure className="flex flex-col gap-2.5">
              <div className={cn('relative overflow-hidden rounded-[14px]', !mapUrl && 'aspect-[19/15] bg-green-soft')}>
                {mapUrl && <img src={mapUrl} srcSet={map ? srcSet(map) : undefined} sizes="(min-width: 1024px) 760px, 100vw" width={map?.width ?? undefined} height={map?.height ?? undefined} alt={map?.alt_text || 'Map of the Salingkusog venues on the VSU campus'} className="block h-auto w-full" />}
                {pins.map((r) => (
                  <a
                    key={r.venue.id}
                    href={`#venue-${r.venue.slug}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-900"
                    style={{ left: `${r.venue.map_x}%`, top: `${r.venue.map_y}%` }}
                    onMouseEnter={() => setActive(r.venue.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(r.venue.id)}
                    onBlur={() => setActive(null)}
                    aria-label={`${r.venue.name} on the map`}
                  >
                    <Pin n={number(r, rows.indexOf(r))} active={active === r.venue.id} />
                  </a>
                ))}
              </div>
              <figcaption className="text-meta text-ink-muted">{mapUrl ? 'Tap a pin to see what’s on there.' : 'Pin positions only; the campus map will be added soon.'}</figcaption>
            </figure>
          )}

          <ol className={cn('rounded-[14px] border border-line bg-surface px-5 md:px-6', !(mapUrl || pins.length) && 'lg:col-span-2')}>
            {rows.map((r, i) => (
              <li
                key={r.venue.id}
                id={`venue-${r.venue.slug}`}
                className={cn('flex scroll-mt-24 gap-4 border-b border-line py-4 last:border-0 md:py-5', active === r.venue.id && 'bg-lime-soft/60')}
                onMouseEnter={() => setActive(r.venue.id)}
                onMouseLeave={() => setActive(null)}
              >
                <Pin n={number(r, i)} active={active === r.venue.id} className="mt-0.5 md:size-8 md:text-[14px]" />
                <div className="min-w-0">
                  <h3 className="font-serif text-[19px] font-semibold leading-tight md:text-[21px]">{r.venue.name}</h3>
                  {r.sports.length > 0 && <p className="mt-1 text-meta text-ink-muted">{r.sports.join(', ')}</p>}
                  {r.venue.description && <p className="mt-1 text-meta text-ink-muted">{r.venue.description}</p>}
                  <p className={cn('mt-1.5 whitespace-pre-wrap text-button', toneClass[r.status.tone])}>{r.status.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
