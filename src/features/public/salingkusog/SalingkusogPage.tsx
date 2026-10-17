import { Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { usePageMeta } from '@/lib/usePageMeta';
import type { SkCategory, SkEditionRow } from '@/lib/database.types';
import { categoryLabels } from '@/lib/skLabels';
import { hubPhase, hubTabs, scheduleDay, type ScheduleFilters, type ScheduleShow } from './hub';
import { MedalTallyView } from './MedalTallyView';
import { SalingkusogHeader } from './SalingkusogHeader';
import { ScheduleView } from './ScheduleView';
import { FactionView } from './FactionView';
import { SportView } from './SportView';
import { RecapView } from './RecapView';
import { VenuesView } from './VenuesView';
import { useArticle } from '@/features/public/article/articleData';
import { useCurrentEdition, useHubData, useLiveGames, useMediaAsset, useArticleSlug, useEventLeaders, useMatchExtras, useMediaList, useResults, useStandings, type HubData } from './skData';
import { completedCount, winnerCards } from './winners';
import { WinnersView } from './WinnersView';

function HubSkeleton() {
  return (
    <div aria-busy="true">
      <div className="h-[180px] bg-night md:h-[230px]" />
      <div className="h-[340px] bg-night-2 md:h-[480px]" />
      <div className="container-page flex flex-col gap-4 py-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="container-page py-16">
      <h2 className="sr-only">{title}</h2>
      <EmptyState title={`${title} is coming soon`}>We’re still building this page. The medal tally is live now.</EmptyState>
    </div>
  );
}

const showValues: ScheduleShow[] = ['all', 'live', 'upcoming', 'results'];

/** /salingkusog/schedule — day and filters live in the URL (?day=&sport=&faction=&venue=&show=). */
function SchedulePage({ edition, hub }: { edition: SkEditionRow; hub: HubData }) {
  const [params, setParams] = useSearchParams();
  const pdf = useMediaAsset(edition.schedule_pdf_asset_id);
  const show = params.get('show') as ScheduleShow | null;
  const filters: ScheduleFilters = {
    sport: params.get('sport') ?? undefined,
    faction: params.get('faction') ?? undefined,
    venue: params.get('venue') ?? undefined,
    show: show && showValues.includes(show) ? show : 'all',
  };
  const update = (patch: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v && !(k === 'show' && v === 'all')) next.set(k, v);
          else next.delete(k);
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  return (
    <ScheduleView
      edition={edition}
      hub={hub}
      pdf={pdf.data ?? null}
      day={scheduleDay(edition, params.get('day'))}
      filters={filters}
      onDay={(day) => update({ day })}
      onFilters={(f) => update({ sport: f.sport, faction: f.faction, venue: f.venue, show: f.show })}
    />
  );
}

/** /salingkusog/winners?category= */
function WinnersPage({ edition, hub }: { edition: SkEditionRow; hub: HubData }) {
  const [params, setParams] = useSearchParams();
  const results = useResults(edition.id);
  if (results.error) return <div className="container-page py-12"><ErrorState error={results.error} onRetry={() => void results.refetch()} /></div>;
  if (!results.data) return <div className="container-page py-12"><Skeleton className="h-96" /></div>;
  const raw = params.get('category') as SkCategory | null;
  const category = raw && raw in categoryLabels ? raw : null;
  return (
    <WinnersView
      cards={winnerCards(hub, results.data.placements, results.data.athletes)}
      hub={hub}
      completed={completedCount(hub, results.data.placements)}
      category={category}
      onCategory={(c) => setParams(c ? { category: c } : {}, { replace: true, preventScrollReset: true })}
    />
  );
}

/** /salingkusog/factions/:slug (the bare /factions opens the leader). */
function FactionPage({ hub, table, editionId }: { hub: HubData; table: Parameters<typeof FactionView>[0]['table']; editionId: string }) {
  const { slug } = useParams();
  const results = useResults(editionId);
  const photos = useMediaList((results.data?.athletes ?? []).map((a) => a.photo_asset_id));
  const leader = table[0] ? hub.factions.find((f) => f.id === table[0].faction_id) : hub.factions[0];
  const faction = hub.factions.find((f) => f.slug === slug);
  if (!slug) return leader ? <Navigate to={`/salingkusog/factions/${leader.slug}`} replace /> : <ComingSoon title="Factions" />;
  if (!faction) return <Navigate to="/salingkusog/factions" replace />;
  if (results.error) return <div className="container-page py-12"><ErrorState error={results.error} onRetry={() => void results.refetch()} /></div>;
  if (!results.data) return <div className="container-page py-12"><Skeleton className="h-96" /></div>;
  return <FactionView faction={faction} hub={hub} table={table} placements={results.data.placements} athletes={results.data.athletes} photos={photos.data ?? []} />;
}

/** /salingkusog/sports/:slug?event= (the bare /sports opens the first sport). */
function SportPage({ hub, editionId }: { hub: HubData; editionId: string }) {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const sport = hub.sports.find((s) => s.slug === slug);
  const events = sport ? hub.events.filter((e) => e.sport_id === sport.id) : [];
  const event = events.find((e) => e.slug === params.get('event')) ?? events[0] ?? null;
  const results = useResults(editionId);
  const leaders = useEventLeaders(event?.id);
  if (!slug) return hub.sports[0] ? <Navigate to={`/salingkusog/sports/${hub.sports[0].slug}`} replace /> : <ComingSoon title="Sports" />;
  if (!sport) return <Navigate to="/salingkusog/sports" replace />;
  if (results.error) return <div className="container-page py-12"><ErrorState error={results.error} onRetry={() => void results.refetch()} /></div>;
  if (!results.data) return <div className="container-page py-12"><Skeleton className="h-96" /></div>;
  return <SportView sport={sport} event={event} hub={hub} placements={results.data.placements} athletes={results.data.athletes} leaders={leaders.data ?? []} />;
}

/** /salingkusog/match/:id — scoreline, periods, box score, award and the linked recap article. */
function RecapPage({ hub, editionId }: { hub: HubData; editionId: string }) {
  const { id } = useParams();
  const match = hub.matches.find((m) => m.id === id);
  const results = useResults(editionId);
  const extras = useMatchExtras(match?.id);
  const slug = useArticleSlug(match?.recap_article_id);
  const article = useArticle(slug.data ?? '', !!slug.data);
  const photos = useMediaList((extras.data?.awards ?? []).map((a) => results.data?.athletes.find((x) => x.id === a.athlete_id)?.photo_asset_id));
  if (!match) return <ComingSoon title="This game" />;
  const error = results.error ?? extras.error;
  if (error) return <div className="container-page py-12"><ErrorState error={error} onRetry={() => (void results.refetch(), void extras.refetch())} /></div>;
  if (!results.data || !extras.data) return <div className="container-page py-12"><Skeleton className="h-96" /></div>;
  return (
    <RecapView
      match={match}
      hub={hub}
      placements={results.data.placements}
      athletes={results.data.athletes}
      stats={extras.data.stats}
      awards={extras.data.awards}
      photos={photos.data ?? []}
      article={slug.data && article.data?.isLive ? article.data : null}
    />
  );
}

/** /salingkusog/venues — map pins and what's on at each venue. */
function VenuesPage({ edition, hub }: { edition: SkEditionRow; hub: HubData }) {
  const map = useMediaList([edition.map_asset_id]);
  return <VenuesView hub={hub} map={map.data?.[0] ?? null} />;
}

/** /salingkusog/* — the intramurals hub. */
export function SalingkusogPage() {
  const edition = useCurrentEdition();
  const ed = edition.data ?? undefined;
  const hub = useHubData(ed?.id);
  const standings = useStandings(ed?.id);
  useLiveGames(ed?.id);
  // one place sets the meta for every hub tab (a child's effect would run first and be overwritten)
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, '');
  const tab =
    hubTabs.find((t) => t.to === (path.startsWith('/salingkusog/match/') ? '/salingkusog/schedule' : path)) ??
    hubTabs.find((t) => t.to !== '/salingkusog' && path.startsWith(`${t.to}/`)) ??
    hubTabs[0];
  usePageMeta({
    title: ed ? `${ed.title} ${tab.label}` : edition.data === null ? 'Salingkusog' : undefined,
    description: ed
      ? tab.to === '/salingkusog/schedule'
        ? `Game times, live scores and results from ${ed.title}.`
        : tab.to === '/salingkusog/winners'
          ? `Gold, silver and bronze for every event of ${ed.title}.`
          : `Live medal tally, standings and scores from ${ed.title}${ed.subtitle ? `, ${ed.subtitle}` : ''}.`
      : undefined,
    path: tab.to,
  });

  if (edition.error || hub.error || standings.error) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">Salingkusog</h1>
        <ErrorState error={edition.error ?? hub.error ?? standings.error} onRetry={() => (void edition.refetch(), void hub.refetch(), void standings.refetch())} />
      </div>
    );
  }
  if (edition.isPending || (ed && (!hub.data || !standings.data))) return <HubSkeleton />;
  if (!ed || !hub.data || !standings.data) {
    return (
      <div className="container-page py-16">
        <h1 className="sr-only">Salingkusog</h1>
        <EmptyState title="Salingkusog coverage starts soon">Medal tally, schedules and live scores from the VSU Intramural Games will appear here.</EmptyState>
      </div>
    );
  }

  const phase = hubPhase(ed);
  return (
    <>
      <SalingkusogHeader edition={ed} factions={hub.data.factions} sportsCount={hub.data.sports.length} liveCount={hub.data.matches.filter((m) => m.status === 'live').length} phase={phase} />
      <Routes>
        <Route index element={<MedalTallyView edition={ed} hub={hub.data} table={standings.data.table} race={standings.data.race} phase={phase} />} />
        <Route path="schedule" element={<SchedulePage edition={ed} hub={hub.data} />} />
        <Route path="winners" element={<WinnersPage edition={ed} hub={hub.data} />} />
        <Route path="factions" element={<FactionPage hub={hub.data} table={standings.data.table} editionId={ed.id} />} />
        <Route path="factions/:slug" element={<FactionPage hub={hub.data} table={standings.data.table} editionId={ed.id} />} />
        <Route path="sports" element={<SportPage hub={hub.data} editionId={ed.id} />} />
        <Route path="sports/:slug" element={<SportPage hub={hub.data} editionId={ed.id} />} />
        <Route path="match/:id" element={<RecapPage hub={hub.data} editionId={ed.id} />} />
        <Route path="venues" element={<VenuesPage edition={ed} hub={hub.data} />} />
        <Route path="*" element={<ComingSoon title="This page" />} />
      </Routes>
    </>
  );
}
