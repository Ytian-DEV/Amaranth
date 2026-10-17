import { Link } from 'react-router-dom';
import type { SkCategory, SkMedal } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { categoryLabels } from '@/lib/skLabels';
import { FactionBadge } from './SkBits';
import type { HubData } from './skData';
import type { WinnerCard } from './winners';

const placeChip: Record<SkMedal, string> = { gold: 'bg-gold text-ink', silver: 'bg-silver text-ink', bronze: 'bg-bronze-deep text-on-dark' };

function Card({ card, hub }: { card: WinnerCard; hub: HubData }) {
  const faction = (id: string) => hub.factions.find((f) => f.id === id);
  return (
    <article aria-labelledby={`win-${card.eventId}`} className="flex min-w-0 flex-col gap-4 rounded-[12px] border border-line bg-surface p-[18px] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-green-500-text">{categoryLabels[card.category]}</p>
          <h2 id={`win-${card.eventId}`} className="mt-1 font-serif text-[20px] font-semibold leading-tight md:text-[22px]">
            {card.title}
          </h2>
          <p className="mt-1 text-meta text-ink-muted">{[card.dates, card.venue].filter(Boolean).join(' · ')}</p>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.99px]', card.final ? 'bg-green-soft text-green-700' : 'bg-lime-soft text-lime-dark-text')}>
          {card.final ? 'Final' : 'In progress'}
        </span>
      </div>
      <ol className="flex flex-col gap-1">
        {card.rows.map((r, i) => (
          <li key={`${r.place}-${r.factionId}-${i}`} className={cn('flex items-center gap-3 rounded-[8px] px-2.5 py-2.5', r.place === 1 && 'bg-lime-soft')}>
            <span
              className={cn('grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums', r.medal ? placeChip[r.medal] : 'bg-line text-ink-muted')}
              aria-label={r.medal ? `${r.medal}, place ${r.place}` : `Place ${r.place}`}
            >
              {r.place}
            </span>
            <FactionBadge faction={faction(r.factionId)} logos={hub.logos} showName={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-[16px] font-semibold leading-tight text-ink">{r.name}</p>
              {r.note && <p className="truncate text-meta text-ink-muted">{r.note}</p>}
            </div>
            {r.result && <span className="shrink-0 font-serif text-[18px] font-semibold tabular-nums text-ink">{r.result}</span>}
          </li>
        ))}
      </ol>
      {card.recapMatchId && (
        <Link to={`/salingkusog/match/${card.recapMatchId}`} className="self-start text-button text-green-700 hover:underline">
          Read the game recap <span aria-hidden>→</span>
          <span className="sr-only"> for {card.title}</span>
        </Link>
      )}
    </article>
  );
}

export function WinnersView({ cards, hub, completed, category, onCategory }: {
  cards: WinnerCard[];
  hub: HubData;
  completed: { done: number; total: number };
  category: SkCategory | null;
  onCategory: (c: SkCategory | null) => void;
}) {
  const present = (Object.keys(categoryLabels) as SkCategory[]).filter((c) => hub.sports.some((s) => s.category === c));
  const shown = category ? cards.filter((c) => c.category === category) : cards;
  const pct = completed.total ? Math.round((completed.done / completed.total) * 100) : 0;

  return (
    <div className="container-page flex flex-col gap-6 pb-16 pt-8 md:gap-8 md:pb-20 md:pt-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-serif text-[28px] font-semibold leading-tight tracking-[-0.5px] md:text-[36px]">Winners per game</h2>
          <p className="mt-1.5 text-body-m text-ink-muted">Official placings, athletes and scores for every completed event</p>
        </div>
        <div className="flex flex-col gap-2 md:w-[260px] md:items-end">
          <p className="text-button">
            {completed.done} of {completed.total} events completed
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Events completed" aria-valuemin={0} aria-valuemax={completed.total} aria-valuenow={completed.done}>
            <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {present.length > 1 && (
        <div role="group" aria-label="Category" data-scroll-x className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {[null, ...present].map((c) => {
            const active = c === category;
            return (
              <button
                key={c ?? 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => onCategory(c)}
                className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold', active ? 'border-green-900 bg-green-900 text-on-dark' : 'border-line bg-surface text-ink hover:border-green-700')}
              >
                {c ? categoryLabels[c] : 'All events'}
              </button>
            );
          })}
        </div>
      )}

      {shown.length ? (
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {shown.map((c) => (
            <Card key={c.eventId} card={c} hub={hub} />
          ))}
        </div>
      ) : (
        <p className="rounded-[12px] border border-dashed border-line px-6 py-12 text-center text-body-m text-ink-muted">
          {cards.length ? 'No results in this category yet.' : 'No results yet. Winners appear here as each event finishes.'}
        </p>
      )}
    </div>
  );
}
