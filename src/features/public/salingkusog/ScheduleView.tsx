import { Download } from 'lucide-react';
import { Select } from '@/components/ui/Field';
import { buttonClasses } from '@/components/ui/buttonStyles';
import type { MediaAssetRow, SkEditionRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { dayRange, manilaDate } from '@/lib/manila';
import { publicUrl } from '@/lib/media';
import { dayLabel, scheduleGroups, type ScheduleFilters, type ScheduleShow } from './hub';
import { LiveDot, MatchCard } from './SkBits';
import type { HubData } from './skData';

const shows: { value: ScheduleShow; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'results', label: 'Results' },
];

// phones fit three filters in a row: tighter padding and smaller text inside the shared Select
const compactSelect = 'min-w-0 [&>select]:pl-2.5 [&>select]:pr-7 [&>select]:text-[13px] [&>svg]:right-2 md:[&>select]:pl-3.5 md:[&>select]:pr-9 md:[&>select]:text-[14px] md:[&>svg]:right-3';

const count = (n: number) => `${n} match${n === 1 ? '' : 'es'}`;

export function ScheduleView({
  edition,
  hub,
  pdf,
  day,
  filters,
  onDay,
  onFilters,
  today = manilaDate(),
}: {
  edition: Pick<SkEditionRow, 'starts_on' | 'ends_on'>;
  hub: HubData;
  pdf: Pick<MediaAssetRow, 'bucket' | 'path'> | null;
  day: string;
  filters: ScheduleFilters;
  onDay: (day: string) => void;
  onFilters: (f: ScheduleFilters) => void;
  today?: string;
}) {
  const days = dayRange(edition.starts_on, edition.ends_on);
  const sportOf = (eventId: string) => hub.events.find((e) => e.id === eventId)?.sport_id;
  const groups = scheduleGroups(hub.matches, day, filters, sportOf, today, (id) => (hub.entries ?? []).filter((e) => e.match_id === id).map((e) => e.faction_id));
  const filtered = !!(filters.sport || filters.faction || filters.venue || filters.show !== 'all');
  const set = (patch: Partial<ScheduleFilters>) => onFilters({ ...filters, ...patch });
  const pdfHref = pdf ? publicUrl(pdf.bucket, pdf.path) : undefined;

  return (
    <>
      {/* day tabs */}
      <nav aria-label="Competition days" className="border-b border-line bg-surface">
        <ul data-scroll-x className="no-scrollbar container-page flex gap-2 overflow-x-auto py-3 md:gap-3 md:pb-0 md:pt-6">
          {days.map((d) => {
            const active = d.date === day;
            return (
              <li key={d.date} className="shrink-0">
                <button
                  type="button"
                  aria-current={active ? 'date' : undefined}
                  onClick={() => onDay(d.date)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-[10px] border px-4 py-2 leading-[1.2] md:items-start md:rounded-b-none md:border-0 md:px-5 md:pb-3.5 md:pt-3',
                    active ? 'border-green-900 bg-green-900' : 'border-line hover:bg-paper',
                  )}
                >
                  <span className={cn('text-[11px] font-bold uppercase tracking-[0.99px]', active ? 'text-lime' : 'text-green-500-text')}>Day {d.number}</span>
                  <span className={cn('text-button', active ? 'text-on-dark' : 'text-ink')}>
                    <span className="hidden md:inline">{dayLabel(d.date)}</span>
                    <span className="md:hidden">{dayLabel(d.date, false)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* filters */}
      <div className="container-page flex flex-col gap-3 pt-4 md:flex-row md:flex-wrap md:items-center md:pt-6">
        <div role="group" aria-label="Show" className="grid grid-cols-4 gap-1 rounded-[8px] bg-green-soft p-1 md:order-last md:flex">
          {shows.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={filters.show === s.value}
              onClick={() => set({ show: s.value })}
              className={cn('rounded-[6px] px-3.5 py-2 text-button md:py-1.5', filters.show === s.value ? 'bg-surface text-green-900 shadow-sm' : 'text-green-700 hover:bg-surface/60')}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 md:flex md:gap-3">
          <Select aria-label="Sport" value={filters.sport ?? ''} onChange={(e) => set({ sport: e.target.value || undefined })} className={cn(compactSelect, 'md:w-40')}>
            <option value="">All sports</option>
            {hub.sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select aria-label="Faction" value={filters.faction ?? ''} onChange={(e) => set({ faction: e.target.value || undefined })} className={cn(compactSelect, 'md:w-44')}>
            <option value="">All factions</option>
            {hub.factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
          <Select aria-label="Venue" value={filters.venue ?? ''} onChange={(e) => set({ venue: e.target.value || undefined })} className={cn(compactSelect, 'md:w-44')}>
            <option value="">All venues</option>
            {hub.venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </Select>
        </div>
        {pdfHref && (
          <a href={pdfHref} target="_blank" rel="noopener" className={buttonClasses('outline', 'md', 'md:order-last md:ml-auto')}>
            <Download className="size-4" aria-hidden /> Download PDF schedule
          </a>
        )}
      </div>

      {/* games */}
      <div className="container-page flex flex-col gap-8 pb-16 pt-6 md:gap-10 md:pb-20" aria-live="polite">
        {groups.length === 0 && (
          <p className="rounded-[12px] border border-dashed border-line px-6 py-12 text-center text-body-m text-ink-muted">
            {filtered ? 'No games match these filters on this day.' : 'No games on this day.'}
          </p>
        )}
        {groups.map((g) => (
          <section key={g.key} aria-labelledby={`sched-${g.key}`} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {g.key === 'live' && <LiveDot className="size-2.5" />}
              <h2 id={`sched-${g.key}`} className="font-serif text-[22px] font-semibold md:text-[26px]">
                <span className="md:hidden">{g.key === 'completed' ? 'Completed' : g.title}</span>
                <span className="hidden md:inline">{g.title}</span>
              </h2>
              <span className="hidden text-meta text-ink-muted md:inline">{count(g.matches.length)}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 md:gap-x-[30px] md:gap-y-6 lg:grid-cols-3">
              {g.matches.map((m) => (
                <MatchCard key={m.id} match={m} hub={hub} dated />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
