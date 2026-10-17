import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { Img } from '@/components/ui/Img';
import { Kicker } from '@/components/ui/Tag';
import { SectionHeader, StoryCard, StoryCompact } from '@/components/story/Story';
import { articlePath, storyMeta, type StoryItem } from '@/components/story/types';
import type { MediaAssetRow, SkAthleteRow, SkAwardRow, SkEditionRow, SkMatchRow, SkMedalTableRow } from '@/lib/database.types';
import { cn } from '@/lib/cn';
import { latestResults, shortEventLabel, standingsDay, type HubPhase } from '@/features/public/salingkusog/hub';
import { SalingkusogMark } from '@/features/public/salingkusog/SalingkusogHeader';
import { FactionBadge } from '@/features/public/salingkusog/SkBits';
import type { HubData } from '@/features/public/salingkusog/skData';

export type SportsSalingkusog = {
  edition: SkEditionRow;
  hub: HubData;
  table: SkMedalTableRow[];
  phase: HubPhase;
  spotlight: { award: SkAwardRow; athlete: SkAthleteRow; photo: MediaAssetRow | null } | null;
};

function ResultMini({ match, hub }: { match: SkMatchRow; hub: HubData }) {
  const event = hub.events.find((e) => e.id === match.event_id);
  const sport = hub.sports.find((s) => s.id === event?.sport_id);
  const side = (id: string | null) => hub.factions.find((f) => f.id === id);
  const live = match.status === 'live';
  return (
    <Link to={`/salingkusog/match/${match.id}`} className="flex w-[190px] shrink-0 flex-col gap-1.5 rounded-[8px] bg-green-800 px-3 py-2.5 text-on-dark hover:bg-green-700 md:w-[200px]">
      <span className="flex items-center justify-between gap-2 text-[12px]">
        <span className="truncate font-semibold">{event && sport ? shortEventLabel(sport.name, event) : ''}</span>
        <span className={cn('shrink-0 text-[10px] font-bold uppercase tracking-[0.9px]', live ? 'text-lime' : 'text-on-dark-muted')}>{live ? 'Live' : 'Final'}</span>
      </span>
      {(['a', 'b'] as const).map((k) => (
        <span key={k} className="flex items-center justify-between gap-2">
          <FactionBadge faction={side(k === 'a' ? match.side_a_id : match.side_b_id)} logos={hub.logos} theme="dark" className="min-w-0 [&>span:first-child]:size-6 [&>span:first-child]:text-[9px]" nameClassName={cn('text-[12px]', match.winner_side === k ? 'font-bold' : 'font-medium')} />
          <span className="shrink-0 text-[14px] font-semibold tabular-nums">{k === 'a' ? match.score_a : match.score_b}</span>
        </span>
      ))}
    </Link>
  );
}

function ResultsStrip({ hub }: { hub: HubData }) {
  const games = latestResults(hub.matches);
  if (!games.length) return null;
  return (
    <section aria-label="Latest Salingkusog results" className="bg-green-900">
      <div className="container-page flex items-center gap-4 py-3">
        <p className="hidden shrink-0 text-[11px] font-bold uppercase tracking-[0.99px] text-lime md:block">Latest results</p>
        <ul data-scroll-x className="no-scrollbar -mr-4 flex gap-2.5 overflow-x-auto pr-4 md:mr-0 md:pr-0">
          {games.map((m) => (
            <li key={m.id}>
              <ResultMini match={m} hub={hub} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StandingsBlock({ sk }: { sk: SportsSalingkusog }) {
  const day = standingsDay(sk.phase);
  return (
    <aside aria-labelledby="sk-block" className="flex flex-col gap-4 rounded-[14px] bg-night p-5 text-on-dark md:p-6">
      <div className="flex items-center gap-3">
        <SalingkusogMark className="size-9 [--mark-scale:0.7]" />
        <div>
          <p className="hidden text-[11px] font-bold uppercase tracking-[0.99px] text-lime md:block">Special coverage</p>
          <h2 id="sk-block" className="font-serif text-[24px] font-semibold leading-tight">{sk.edition.title}</h2>
        </div>
      </div>
      <p className="hidden text-meta text-on-dark-muted md:block">{sk.phase.kind === 'after' ? 'Final medal table' : day ? `Medal table after Day ${day}` : 'Medal table'}</p>
      <ol className="flex flex-col">
        {sk.table.slice(0, 4).map((r) => (
          <li key={r.faction_id} className="flex items-center gap-3 border-b border-on-dark/10 py-2.5 last:border-0">
            <span className="w-5 font-serif text-[22px] italic text-lime">{r.rank}</span>
            <FactionBadge faction={sk.hub.factions.find((f) => f.id === r.faction_id)} logos={sk.hub.logos} theme="dark" className="min-w-0 flex-1" nameClassName="text-[14px]" />
            <span className="shrink-0 font-serif text-[20px] font-semibold tabular-nums">
              {r.points}
              <span className="hidden md:inline"> pts</span>
            </span>
          </li>
        ))}
      </ol>
      <Link to="/salingkusog" className={buttonClasses('accent', 'md', 'w-full')}>
        Open the Salingkusog hub <ArrowRight className="size-4" aria-hidden />
      </Link>
    </aside>
  );
}

function Lead({ story }: { story: StoryItem }) {
  return (
    <article className="group relative flex min-w-0 flex-col gap-3">
      <Img {...story.image} ratio="760/420" priority sizes="(min-width: 1024px) 760px, 100vw" />
      <Kicker className="mt-1">{story.label}</Kicker>
      <h2 className="font-serif text-[28px] font-bold leading-[1.1] tracking-[-0.5px] text-ink group-hover:text-green-700 md:text-[44px] md:tracking-[-1px]">
        <Link to={articlePath(story.slug)} className="after:absolute after:inset-0">
          {story.title}
        </Link>
      </h2>
      {story.excerpt && <p className="hidden text-body-l text-ink-muted md:block">{story.excerpt}</p>}
      <p className="text-meta text-ink-muted">{storyMeta(story)}</p>
    </article>
  );
}

function Spotlight({ sk }: { sk: SportsSalingkusog }) {
  const s = sk.spotlight;
  if (!s) return null;
  const faction = sk.hub.factions.find((f) => f.id === s.athlete.faction_id);
  const href = s.award.match_id ? `/salingkusog/match/${s.award.match_id}` : '/salingkusog/winners';
  return (
    <section aria-labelledby="spotlight" className="bg-green-900 text-on-dark">
      <div className="container-page grid items-center gap-6 py-10 md:grid-cols-2 md:gap-12 md:py-12">
        {s.photo ? (
          <Img bucket={s.photo.bucket} path={s.photo.path} variants={s.photo.variants} width={s.photo.width} alt={s.athlete.name} ratio="480/290" sizes="(min-width: 768px) 50vw, 100vw" className="rounded-[14px]" />
        ) : (
          <div className="aspect-[480/290] rounded-[14px] bg-green-800" aria-hidden />
        )}
        <div className="flex flex-col gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.99px] text-lime">Athlete spotlight</p>
          <h2 id="spotlight" className="font-serif text-[26px] italic leading-snug md:text-[32px]">“{s.award.quote}”</h2>
          <p className="flex flex-wrap items-center gap-3 text-button">
            {s.athlete.name}
            {s.athlete.program && `, ${s.athlete.program}`}
            <FactionBadge faction={faction} logos={sk.hub.logos} theme="dark" nameClassName="text-[14px] font-medium" />
          </p>
          {s.award.headline && <p className="text-body-m text-on-dark-muted">{s.award.headline}</p>}
          <Link to={href} className={buttonClasses('accent', 'md', 'self-start')}>
            {s.award.match_id ? 'See the game' : 'See the winners'}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SportsLanding({ categories, items, hasMore, sk }: {
  categories: { slug: string; name: string }[];
  items: StoryItem[];
  hasMore: boolean;
  sk: SportsSalingkusog | null;
}) {
  const [lead, ...rest] = items;
  const latest = rest.slice(0, 3);
  const more = rest.slice(3, 7);

  return (
    <div className="pb-16">
      <h1 className="sr-only">Sports</h1>
      {sk && <ResultsStrip hub={sk.hub} />}

      <nav aria-label="Sports categories" className="container-page pt-5 md:pt-6">
        <ul data-scroll-x className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <li className="shrink-0">
            <Link to="/sports" aria-current="page" className="inline-flex h-9 items-center rounded-full border border-green-900 bg-green-900 px-4 text-[14px] font-semibold text-on-dark">
              All Sports
            </Link>
          </li>
          {sk && (
            <li className="shrink-0">
              <Link to="/salingkusog" className="inline-flex h-9 items-center rounded-full border border-night bg-night px-4 text-[14px] font-semibold text-lime">
                {sk.edition.title}
              </Link>
            </li>
          )}
          {categories.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link to={`/sports?category=${encodeURIComponent(c.slug)}`} className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 text-[14px] font-semibold text-ink hover:border-green-700">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={cn('container-page grid gap-8 pt-6 md:pt-8', sk && 'lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10')}>
        {lead ? <Lead story={lead} /> : <p className="rounded-[12px] border border-dashed border-line px-6 py-12 text-center text-body-m text-ink-muted">Sports stories will show up here.</p>}
        {sk && <StandingsBlock sk={sk} />}
      </div>

      {latest.length > 0 && (
        <section aria-labelledby="sports-latest" className="container-page pb-12 pt-10 md:pb-14 md:pt-14">
          <SectionHeader id="sports-latest" title="Latest in Sports" href={hasMore ? '/sports?page=2' : undefined} linkLabel="All stories" />
          <ul className="mt-6 hidden gap-12 md:grid md:grid-cols-3">
            {latest.map((s) => (
              <li key={s.id}>
                <StoryCard story={s} />
              </li>
            ))}
          </ul>
          <ul className="mt-5 flex flex-col gap-5 md:hidden">
            {latest.map((s) => (
              <li key={s.id}>
                <StoryCompact story={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sk && <Spotlight sk={sk} />}

      {more.length > 0 && (
        <section aria-labelledby="sports-more" className="container-page pt-12 md:pt-14">
          <SectionHeader id="sports-more" title="More from the courts" href="/archives" linkLabel="Archives" />
          <ul className="mt-6 grid gap-5 md:grid-cols-2 md:gap-x-12">
            {more.map((s) => (
              <li key={s.id}>
                <StoryCompact story={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
