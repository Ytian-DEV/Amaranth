import { Trophy } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { SectionHeader } from '@/components/story/Story';
import type { SkAthleteRow, SkEventLeaderRow, SkEventRow, SkMatchRow, SkPlacementRow, SkSportRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { isContestFormat } from '@/lib/skContests';
import { isGroupGame, pendingSide } from '@/lib/skSources';
import { manilaDate } from '@/lib/manila';
import { categoryLabels } from '@/lib/skLabels';
import { dayLabel } from './hub';
import { ContestTable, FactionBadge, MatchCard } from './SkBits';
import type { HubData } from './skData';
import { bracketColumns, eventStatusLine, formatLine, isBronzeRound, leaderStat, roundRobinTable } from './sports';
import { winnerCards } from './winners';
import { WinnerCardView } from './WinnersView';

const sportHref = (s: Pick<SkSportRow, 'slug'>, e?: Pick<SkEventRow, 'slug'>) => `/salingkusog/sports/${s.slug}${e ? `?event=${e.slug}` : ''}`;
const eventShort = (e: SkEventRow) => e.name;

/** Strip of every sport (the list). */
export function SportSwitcher({ hub }: { hub: HubData }) {
  return (
    <nav aria-label="Sports" className="border-b border-line bg-surface">
      <ul data-scroll-x className="no-scrollbar container-page flex gap-2 overflow-x-auto py-3 md:py-3.5">
        {hub.sports.map((s) => (
          <li key={s.id} className="shrink-0">
            <NavLink
              to={sportHref(s)}
              className={({ isActive }) => cn('block rounded-full border px-3.5 py-1.5 text-[13px] font-semibold', isActive ? 'border-green-900 bg-green-900 text-lime' : 'border-line text-ink hover:border-lime')}
            >
              {s.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BracketGame({ match, hub, title }: { match: SkMatchRow; hub: HubData; title?: string }) {
  const waiting = (k: 'a' | 'b') => pendingSide(match, k, hub.matches) ?? 'To be decided';
  const side = (id: string | null) => hub.factions.find((f) => f.id === id);
  const done = match.status === 'final' || match.status === 'live';
  const rows: [string | null, number | null, 'a' | 'b'][] = [
    [match.side_a_id, match.score_a, 'a'],
    [match.side_b_id, match.score_b, 'b'],
  ];
  return (
    <Link to={`/salingkusog/match/${match.id}`} className="block w-full overflow-hidden rounded-[8px] border border-line bg-surface hover:border-lime">
      <p className="border-b border-line px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.9px] text-ink-muted">
        {title ?? match.round ?? 'Game'} · {dayLabel(manilaDate(match.scheduled_at), false)}
        {match.status === 'live' && <span className="ml-1 text-alert">· Live</span>}
      </p>
      {rows.map(([id, score, k]) => {
        const won = match.winner_side === k;
        return (
          <div key={k} className={cn('flex items-center gap-2 px-2.5 py-2', won && 'bg-lime-soft')}>
            <FactionBadge faction={side(id)} logos={hub.logos} placeholder={waiting(k)} className="min-w-0 flex-1" nameClassName={cn('text-[13px]', won ? 'font-semibold' : 'font-medium', !id && 'text-ink-muted')} />
            <span className={cn('font-serif text-[18px] font-semibold tabular-nums', done && !won && match.winner_side ? 'text-ink-muted' : 'text-ink')}>{done && score !== null ? score : '—'}</span>
          </div>
        );
      })}
    </Link>
  );
}

function Bracket({ games, hub }: { games: SkMatchRow[]; hub: HubData }) {
  const { columns, bronze } = bracketColumns(games);
  const final = columns.at(-1)?.matches.length === 1 ? columns.at(-1)!.matches[0] : null;
  const champion = final?.status === 'final' && final.winner_side ? hub.factions.find((f) => f.id === (final.winner_side === 'a' ? final.side_a_id : final.side_b_id)) : undefined;
  const runnerUp = champion && final ? hub.factions.find((f) => f.id === (final.winner_side === 'a' ? final.side_b_id : final.side_a_id)) : undefined;
  const cols = columns.length + 1;
  if (!columns.length) return <p className="text-body-m text-ink-muted">The bracket appears once the games are scheduled.</p>;

  return (
    <div data-scroll-x className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <div className="grid min-w-[760px] gap-x-12 gap-y-6" style={{ gridTemplateColumns: `repeat(${cols - 1}, minmax(0, 235px)) minmax(0, 250px)` }}>
        {columns.map((c) => (
          <p key={c.order} className="text-[11px] font-bold uppercase tracking-[0.99px] text-green-500-text">{c.title}</p>
        ))}
        <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-green-500-text">Champion</p>

        {columns.map((c, ci) => {
          const last = ci === columns.length - 1;
          // pairs feed one game in the next column; equal-height cells keep the lines straight
          const pairs: SkMatchRow[][] = [];
          for (let i = 0; i < c.matches.length; i += 2) pairs.push(c.matches.slice(i, i + 2));
          return (
            <div key={c.order} className="flex min-h-[360px] flex-col">
              {pairs.map((pair, pi) => (
                <div key={pi} className="relative flex flex-1 flex-col">
                  {pair.map((m) => (
                    <div key={m.id} className="flex flex-1 items-center py-2">
                      <BracketGame match={m} hub={hub} />
                    </div>
                  ))}
                  {pair.length === 2 && !last && (
                    <>
                      <span className="absolute -right-6 bottom-1/4 top-1/4 w-6 border-y-2 border-r-2 border-lime" aria-hidden />
                      <span className="absolute -right-12 top-1/2 w-6 border-t-2 border-lime" aria-hidden />
                    </>
                  )}
                  {(pair.length === 1 || last) && <span className="absolute -right-12 top-1/2 w-12 border-t-2 border-lime" aria-hidden />}
                </div>
              ))}
            </div>
          );
        })}

        <div className="flex items-center">
          <div className="flex w-full flex-col items-center gap-2.5 rounded-[12px] bg-night px-4 py-6 text-center text-on-dark">
            <Trophy className="size-8 text-gold" aria-hidden />
            <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-lime">Champion</p>
            {champion ? (
              <>
                <FactionBadge faction={champion} logos={hub.logos} theme="dark" />
                <p className="text-meta text-on-dark-muted">
                  Final: {final!.winner_side === 'a' ? `${final!.score_a}–${final!.score_b}` : `${final!.score_b}–${final!.score_a}`} vs {runnerUp?.name ?? 'TBD'}
                </p>
              </>
            ) : (
              <p className="text-meta text-on-dark-muted">To be decided</p>
            )}
          </div>
        </div>

        {bronze && (
          <div className="flex pt-4" style={{ gridColumnStart: columns.length }}>
            <BracketGame match={bronze} hub={hub} title="Bronze game" />
          </div>
        )}
      </div>
    </div>
  );
}

function RoundRobin({ games, hub, seeds }: { games: SkMatchRow[]; hub: HubData; seeds: string[] }) {
  const rows = roundRobinTable(games, seeds);
  return (
    <div data-scroll-x className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left">
        <caption className="sr-only">Standings</caption>
        <thead className="text-[11px] font-bold uppercase tracking-[0.99px] text-green-700">
          <tr className="border-b border-line">
            <th scope="col" className="py-2">Faction</th>
            {['P', 'W', 'L', 'D', '+/−'].map((h) => <th key={h} scope="col" className="w-14 py-2 text-center">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.factionId} className="border-b border-line last:border-0">
              <th scope="row" className="py-2.5 font-normal"><FactionBadge faction={hub.factions.find((f) => f.id === r.factionId)} logos={hub.logos} /></th>
              {[r.played, r.wins, r.losses, r.draws, r.pf - r.pa].map((v, i) => (
                <td key={i} className="py-2.5 text-center tabular-nums">{i === 4 && v > 0 ? `+${v}` : v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SportView({ sport, event, hub, placements, athletes, leaders }: {
  sport: SkSportRow;
  event: SkEventRow | null;
  hub: HubData;
  placements: SkPlacementRow[];
  athletes: SkAthleteRow[];
  leaders: SkEventLeaderRow[];
}) {
  const events = hub.events.filter((e) => e.sport_id === sport.id);
  const games = event ? hub.matches.filter((m) => m.event_id === event.id) : [];
  const results = event ? placements.filter((p) => p.event_id === event.id) : [];
  const gold = results.find((p) => p.medal === 'gold');
  const champion = gold ? (gold.athlete_id ? athletes.find((a) => a.id === gold.athlete_id)?.name : hub.factions.find((f) => f.id === gold.faction_id)?.name) : null;
  const hasBronze = games.some((g) => /bronze|third/i.test(g.round ?? ''));
  const stat = leaderStat(leaders);
  const top = stat ? leaders.filter((l) => l.stat === stat).sort((a, b) => b.total - a.total).slice(0, 5) : [];
  const card = event ? winnerCards({ ...hub, events: [event] }, results, athletes)[0] : undefined;
  const other = events.find((e) => e.id !== event?.id);
  const sortedGames = [...games].sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

  return (
    <>
      <SportSwitcher hub={hub} />
      <div className="container-page flex flex-col gap-6 pb-16 pt-8 md:gap-8 md:pb-20 md:pt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-green-500-text">
              {categoryLabels[sport.category]}
              {event && ` · ${formatLine(event.format, hasBronze)}`}
            </p>
            <h2 className="mt-1 font-serif text-[34px] font-semibold leading-tight tracking-[-0.5px] md:text-[48px]">{sport.name}</h2>
            {event && (
              <p className="mt-1 text-body-m text-ink-muted">
                {eventStatusLine(games, !!gold, (d) => dayLabel(d, false))}
                {champion && `  ·  Champion: ${champion}`}
              </p>
            )}
          </div>
          {events.length > 1 && (
            <nav aria-label="Division" className="flex gap-1 self-start rounded-[8px] bg-green-soft p-1 md:self-auto">
              {events.map((e) => (
                <Link
                  key={e.id}
                  to={sportHref(sport, e)}
                  aria-current={e.id === event?.id ? 'page' : undefined}
                  className={cn('rounded-[6px] px-4 py-1.5 text-button', e.id === event?.id ? 'bg-surface text-green-900 shadow-sm' : 'text-green-700 hover:bg-surface/60')}
                  preventScrollReset
                >
                  {eventShort(e)}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {!event ? (
          <p className="rounded-[12px] border border-dashed border-line px-6 py-12 text-center text-body-m text-ink-muted">Events for {sport.name} will be listed soon.</p>
        ) : event.format === 'bracket' ? (
          <section aria-label="Bracket" className="rounded-[14px] border border-line bg-surface p-5 md:p-8">
            <Bracket games={games} hub={hub} />
          </section>
        ) : event.format === 'round_robin_final' ? (
          <>
            <section aria-labelledby="sport-table" className="rounded-[14px] border border-line bg-surface p-5">
              <h3 id="sport-table" className="font-serif text-[22px] font-semibold">Round robin</h3>
              <p className="mb-3 text-meta text-ink-muted">The top two play the final{games.some((g) => isBronzeRound(g.round)) ? ', 3rd and 4th the bronze game' : ''}.</p>
              <RoundRobin games={games.filter(isGroupGame)} hub={hub} seeds={event.seeds} />
            </section>
            <section aria-label="Finals" className="rounded-[14px] border border-line bg-surface p-5 md:p-8">
              <Bracket games={games.filter((g) => !isGroupGame(g))} hub={hub} />
            </section>
          </>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {event.format === 'round_robin' && (
              <section aria-labelledby="sport-table" className="rounded-[14px] border border-line bg-surface p-5">
                <h3 id="sport-table" className="mb-3 font-serif text-[22px] font-semibold">Standings</h3>
                <RoundRobin games={games} hub={hub} seeds={event.seeds} />
              </section>
            )}
            {isContestFormat(event.format) &&
              [...games]
                .filter((g) => g.is_contest)
                .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
                .map((g) => (
                  <section key={g.id} aria-labelledby={`contest-${g.id}`} className="rounded-[14px] border border-line bg-surface p-5">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <h3 id={`contest-${g.id}`} className="font-serif text-[22px] font-semibold">
                        {g.status === 'final' ? 'Results' : 'Performance order'}
                        {g.round && g.round !== 'Final' && <span className="text-ink-muted"> · {g.round}</span>}
                      </h3>
                      {g.status === 'live' && <span className="text-[11px] font-bold uppercase tracking-[0.99px] text-alert">● Live</span>}
                    </div>
                    <ContestTable session={g} event={event} hub={hub} athletes={athletes} />
                  </section>
                ))}
            {card ? <WinnerCardView card={card} hub={hub} /> : <p className="rounded-[12px] border border-dashed border-line px-6 py-12 text-center text-body-m text-ink-muted">Results will appear here after the event.</p>}
          </div>
        )}

        {event && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
            <section aria-labelledby="sport-games" className="flex min-w-0 flex-col gap-4">
              <SectionHeader id="sport-games" title="All matches" href={other ? sportHref(sport, other) : undefined} linkLabel={other ? `${other.name} division` : undefined} />
              {sortedGames.length ? (
                <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                  {sortedGames.map((m) => <MatchCard key={m.id} match={m} hub={hub} dated />)}
                </div>
              ) : (
                <p className="text-body-m text-ink-muted">No games scheduled yet.</p>
              )}
            </section>
            {top.length > 0 && (
              <section aria-labelledby="sport-leaders" className="self-start rounded-[14px] border border-line bg-surface p-5 md:p-6">
                <h3 id="sport-leaders" className="font-serif text-[22px] font-semibold">Top scorers</h3>
                <p className="text-meta text-ink-muted">Total {stat}, all games</p>
                <table className="mt-3 w-full text-left">
                  <thead className="text-[11px] font-bold uppercase tracking-[0.99px] text-ink-muted">
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2">Player</th>
                      <th scope="col" className="py-2 text-right">{stat}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((l) => {
                      const a = athletes.find((x) => x.id === l.athlete_id);
                      return (
                        <tr key={l.athlete_id} className="border-b border-line last:border-0">
                          <th scope="row" className="py-2.5 font-normal">
                            <span className="flex min-w-0 items-center gap-2.5">
                              <FactionBadge faction={hub.factions.find((f) => f.id === a?.faction_id)} logos={hub.logos} showName={false} />
                              <span className="truncate text-button">{a?.name ?? 'Unknown'}</span>
                            </span>
                          </th>
                          <td className="py-2.5 text-right font-serif text-[20px] font-semibold tabular-nums">{l.total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
