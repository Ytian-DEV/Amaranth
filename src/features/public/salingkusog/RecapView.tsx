import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Img } from '@/components/ui/Img';
import { Tag } from '@/components/ui/Tag';
import type { ArticleDetail } from '@/features/public/article/articleData';
import type { MediaAssetRow, SkAthleteRow, SkAthleteStatsRow, SkAwardRow, SkMatchRow, SkPlacementRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { manilaDate } from '@/lib/manila';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { awardKindLabels } from '@/lib/skLabels';
import { clockLabel, readableOn } from './hub';
import { eventRecord, sideTitle, statShares } from './recap';
import { FactionBadge } from './SkBits';
import type { HubData } from './skData';

type Faction = HubData['factions'][number];

function Emblem({ faction, logos }: { faction: Faction | undefined; logos: MediaAssetRow[] }) {
  const logo = faction?.logo_asset_id ? logos.find((l) => l.id === faction.logo_asset_id) : undefined;
  return (
    <span
      className="grid size-16 place-items-center overflow-hidden rounded-[14px] font-serif text-[22px] font-bold md:size-[88px] md:text-[30px]"
      style={faction && !logo ? { backgroundColor: faction.color, color: readableOn(faction.color, 3) === 'light' ? 'var(--color-on-dark)' : 'var(--color-ink)' } : undefined}
      aria-hidden
    >
      {logo ? <Img bucket={logo.bucket} path={logo.path} variants={logo.variants} width={logo.width} alt="" ratio="1/1" sizes="88px" rounded={false} className="size-full" /> : (faction?.short_name ?? '?')}
    </span>
  );
}

function Scoreboard({ match, hub, placements }: { match: SkMatchRow; hub: HubData; placements: SkPlacementRow[] }) {
  const event = hub.events.find((e) => e.id === match.event_id);
  const sport = hub.sports.find((s) => s.id === event?.sport_id);
  const venue = hub.venues.find((v) => v.id === match.venue_id);
  const side = (id: string | null) => hub.factions.find((f) => f.id === id);
  const [a, b] = [side(match.side_a_id), side(match.side_b_id)];
  const scored = (match.status === 'live' || match.status === 'final') && match.score_a !== null && match.score_b !== null;
  const eventLabel = event?.name.includes('·') ? event.name : `${sport?.name ?? ''} · ${event?.name ?? ''}`;
  const note = (id: string | null) => [sideTitle(id, match.event_id, placements), eventRecord(id, match.event_id, hub.matches)].filter(Boolean).join('  ·  ');
  const pill =
    match.status === 'live' ? 'bg-alert text-on-dark' : match.status === 'final' ? 'bg-green-soft text-green-700' : 'bg-lime-soft text-lime-dark-text';
  const pillText = match.status === 'live' ? `● Live${match.live_note ? ` · ${match.live_note}` : ''}` : match.status === 'final' ? 'Final' : match.status;

  return (
    <section aria-labelledby="recap-score" className="bg-night text-on-dark">
      <div className="container-page flex flex-col items-center gap-6 py-7 md:gap-7 md:py-9">
        <nav aria-label="Breadcrumb" className="text-meta text-on-dark-muted">
          <ol className="flex flex-wrap justify-center gap-x-2">
            <li><Link to="/salingkusog/schedule" className="hover:text-on-dark hover:underline">Schedule &amp; Results</Link> /</li>
            <li>{sport ? <Link to={`/salingkusog/sports/${sport.slug}${event ? `?event=${event.slug}` : ''}`} className="hover:text-on-dark hover:underline">{eventLabel}</Link> : eventLabel}{match.round && ' /'}</li>
            {match.round && <li aria-current="page">{match.round}</li>}
          </ol>
        </nav>
        <h2 id="recap-score" className="sr-only">
          {a?.name ?? 'TBD'} {scored ? `${match.score_a} – ${match.score_b}` : 'vs'} {b?.name ?? 'TBD'}
        </h2>
        <div className="grid w-full max-w-[980px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 md:gap-8">
          {[a, b].map((f, i) => (
            <div key={i} className={cn('flex flex-col items-center gap-2 text-center md:gap-3', i === 1 && 'order-3')}>
              <Emblem faction={f} logos={hub.logos} />
              <p className="font-serif text-[15px] font-semibold leading-tight break-words [hyphens:auto] md:text-[26px]">{f?.name ?? 'To be decided'}</p>
              <p className="hidden whitespace-pre text-meta text-on-dark-muted md:block">{note(i === 0 ? match.side_a_id : match.side_b_id)}</p>
            </div>
          ))}
          <div className="order-2 flex flex-col items-center gap-2 pt-1 md:gap-3">
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.99px]', pill)}>{pillText}</span>
            <p className="flex items-center gap-2 font-serif text-[48px] font-bold leading-none tabular-nums md:gap-4 md:text-[96px]" aria-hidden>
              <span className={match.winner_side === 'a' ? 'text-lime' : undefined}>{scored ? match.score_a : '–'}</span>
              <span className="text-[28px] text-on-dark-muted md:text-[48px]">–</span>
              <span className={match.winner_side === 'b' ? 'text-lime' : undefined}>{scored ? match.score_b : '–'}</span>
            </p>
            <p className="text-center text-meta text-on-dark-muted">
              {formatDate(match.scheduled_at)} · {clockLabel(match.scheduled_at)}
              {venue && <span className="block md:inline"> · {venue.name}</span>}
            </p>
          </div>
        </div>
        {match.periods.length > 0 && (
          <div data-scroll-x className="max-w-full overflow-x-auto rounded-[10px] bg-night-2 px-4 py-3">
            <table className="text-center text-[14px] tabular-nums">
              <caption className="sr-only">Score by period</caption>
              <thead className="text-[11px] font-bold uppercase tracking-[0.99px] text-on-dark-muted">
                <tr>
                  <th scope="col" className="w-12 py-1 text-left"><span className="sr-only">Faction</span></th>
                  {match.periods.map((p, i) => <th key={i} scope="col" className="min-w-10 px-2 py-1">{p.label}</th>)}
                  <th scope="col" className="min-w-10 px-2 py-1">T</th>
                </tr>
              </thead>
              <tbody>
                {(['a', 'b'] as const).map((k) => (
                  <tr key={k}>
                    <th scope="row" className="py-1 text-left font-semibold">{(k === 'a' ? a : b)?.short_name ?? (k === 'a' ? 'A' : 'B')}</th>
                    {match.periods.map((p, i) => <td key={i} className="px-2 py-1">{p[k] ?? '–'}</td>)}
                    <td className="px-2 py-1 font-serif text-[16px] font-semibold text-lime">{k === 'a' ? (match.score_a ?? '–') : (match.score_b ?? '–')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Article({ article }: { article: ArticleDetail }) {
  const html = useMemo(() => sanitizeArticleHtml(article.bodyHtml), [article.bodyHtml]);
  return (
    <article aria-labelledby="recap-title" className="flex min-w-0 flex-col gap-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-green-500-text">Game recap</p>
        <h2 id="recap-title" className="mt-2 font-serif text-[28px] font-bold leading-[1.1] md:text-[40px]">
          <Link to={`/article/${article.slug}`} className="hover:underline">{article.title}</Link>
        </h2>
        <p className="mt-3 text-meta text-ink-muted">
          {article.byline && <span className="font-semibold text-ink">By {article.byline}</span>}
          {article.byline && <br />}
          {article.publishedAt && formatDate(article.publishedAt)} · {article.readingMinutes} min read
        </p>
      </div>
      {article.cover?.path && (
        <figure className="flex flex-col gap-2">
          <Img {...article.cover} alt={article.cover.alt ?? ''} sizes="(min-width: 1024px) 740px, 100vw" />
          {article.coverCaption && <figcaption className="text-meta text-ink-muted">{article.coverCaption}</figcaption>}
        </figure>
      )}
      <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
      {article.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <li key={t.slug}><Tag>{t.name}</Tag></li>
          ))}
        </ul>
      )}
    </article>
  );
}

function AwardCard({ award, athlete, faction, photo, logos }: { award: SkAwardRow; athlete: SkAthleteRow | undefined; faction: Faction | undefined; photo: MediaAssetRow | undefined; logos: MediaAssetRow[] }) {
  return (
    <section aria-labelledby={`award-${award.id}`} className="flex flex-col gap-4 rounded-[14px] bg-night p-5 text-on-dark">
      <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-lime">{awardKindLabels[award.kind]}</p>
      {photo ? (
        <Img bucket={photo.bucket} path={photo.path} variants={photo.variants} width={photo.width} alt={athlete?.name ?? ''} ratio="16/10" sizes="320px" />
      ) : (
        <div className="aspect-[16/10] rounded-md bg-night-2" aria-hidden />
      )}
      <h3 id={`award-${award.id}`} className="font-serif text-[24px] font-semibold">{athlete?.name ?? 'Athlete'}</h3>
      <FactionBadge faction={faction} logos={logos} theme="dark" nameClassName="text-[14px]" />
      {award.stat_line.length > 0 && (
        <dl className="flex justify-between gap-3">
          {award.stat_line.slice(0, 4).map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <dd className="font-serif text-[28px] font-bold leading-none text-lime">{s.value}</dd>
              <dt className="mt-1 text-[11px] font-bold uppercase tracking-[0.99px]">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}
      {award.quote && <p className="font-serif text-[16px] italic text-on-dark-muted">“{award.quote}”</p>}
    </section>
  );
}

export function RecapView({ match, hub, placements, athletes, stats, awards, photos = [], article }: {
  match: SkMatchRow;
  hub: HubData;
  placements: SkPlacementRow[];
  athletes: SkAthleteRow[];
  stats: SkAthleteStatsRow[];
  awards: SkAwardRow[];
  photos?: MediaAssetRow[];
  article: ArticleDetail | null;
}) {
  const side = (id: string | null) => hub.factions.find((f) => f.id === id);
  const [a, b] = [side(match.side_a_id), side(match.side_b_id)];
  const athlete = (id: string) => athletes.find((x) => x.id === id);
  const statKeys = [...new Set(stats.flatMap((s) => Object.keys(s.stats)))].slice(0, 6);
  const day = manilaDate(match.scheduled_at);

  return (
    <>
      <Scoreboard match={match} hub={hub} placements={placements} />
      <div className="container-page grid gap-8 pb-16 pt-8 md:pb-20 md:pt-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          {article ? (
            <Article article={article} />
          ) : (
            <p className="rounded-[12px] border border-dashed border-line px-6 py-10 text-center text-body-m text-ink-muted">
              {match.status === 'final' ? 'The Amaranth sports desk’s recap of this game will appear here.' : 'Follow the score live here; the recap comes after the final buzzer.'}
            </p>
          )}

          {stats.length > 0 && (
            <section aria-labelledby="recap-box" className="flex flex-col gap-3">
              <h2 id="recap-box" className="font-serif text-[24px] font-semibold">Player stats</h2>
              <div data-scroll-x className="overflow-x-auto rounded-[12px] border border-line bg-surface">
                <table className="w-full min-w-[480px] text-left text-[14px] tabular-nums">
                  <thead className="bg-green-soft text-[11px] font-bold uppercase tracking-[0.99px] text-green-700">
                    <tr>
                      <th scope="col" className="px-4 py-2.5">Player</th>
                      {statKeys.map((k) => <th key={k} scope="col" className="px-3 py-2.5 text-right">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats]
                      .sort((x, y) => (athlete(x.athlete_id)?.faction_id === match.side_a_id ? -1 : 1) - (athlete(y.athlete_id)?.faction_id === match.side_a_id ? -1 : 1))
                      .map((s) => {
                        const p = athlete(s.athlete_id);
                        return (
                          <tr key={s.athlete_id} className="border-t border-line">
                            <th scope="row" className="px-4 py-2.5 font-normal">
                              <span className="flex items-center gap-2.5">
                                <FactionBadge faction={side(p?.faction_id ?? null)} logos={hub.logos} showName={false} />
                                <span className="font-semibold">{p?.name ?? 'Unknown'}</span>
                              </span>
                            </th>
                            {statKeys.map((k) => <td key={k} className="px-3 py-2.5 text-right">{s.stats[k] ?? '–'}</td>)}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-6" aria-label="Game details">
          {awards.map((aw) => {
            const ath = athlete(aw.athlete_id);
            return <AwardCard key={aw.id} award={aw} athlete={ath} faction={side(ath?.faction_id ?? null)} photo={photos.find((ph) => ph.id === ath?.photo_asset_id)} logos={hub.logos} />;
          })}

          {match.team_stats.length > 0 && (
            <section aria-labelledby="recap-team" className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <FactionBadge faction={a} logos={hub.logos} showName={false} />
                <h2 id="recap-team" className="font-serif text-[22px] font-semibold">Team stats</h2>
                <FactionBadge faction={b} logos={hub.logos} showName={false} />
              </div>
              <ul className="flex flex-col gap-4">
                {match.team_stats.map((s) => {
                  const share = statShares(s);
                  return (
                    <li key={s.label} className="grid grid-cols-[52px_minmax(0,1fr)_52px] items-center gap-x-3 gap-y-1.5">
                      <span className="text-button tabular-nums">{s.a}</span>
                      <span className="text-center text-meta text-ink-muted">{s.label}</span>
                      <span className="text-right text-button tabular-nums">{s.b}</span>
                      <span className="col-span-3 flex h-1.5 gap-1" aria-hidden>
                        <span className="rounded-full" style={{ flex: share.a, backgroundColor: a?.color }} />
                        <span className="rounded-full" style={{ flex: share.b, backgroundColor: b?.color }} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <Link to={`/salingkusog/schedule?day=${day}`} className="self-start text-button text-green-700 hover:underline">
            More games that day <span aria-hidden>→</span>
          </Link>
        </aside>
      </div>
    </>
  );
}
