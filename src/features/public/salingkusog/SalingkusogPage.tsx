import { Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { usePageMeta } from '@/lib/usePageMeta';
import type { SkCategory, SkEditionRow } from '@/lib/database.types';
import { categoryLabels } from '@/lib/skLabels';
import { hubPhase, hubTabs, scheduleDay, type ScheduleFilters, type ScheduleShow } from './hub';
import { MedalTallyView } from './MedalTallyView';
import { SalingkusogHeader } from './SalingkusogHeader';
import { ScheduleView } from './ScheduleView';
import { useCurrentEdition, useHubData, useLiveGames, useMediaAsset, useResults, useStandings, type HubData } from './skData';
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

/** /salingkusog/* — the intramurals hub. */
export function SalingkusogPage() {
  const edition = useCurrentEdition();
  const ed = edition.data ?? undefined;
  const hub = useHubData(ed?.id);
  const standings = useStandings(ed?.id);
  useLiveGames(ed?.id);
  // one place sets the meta for every hub tab (a child's effect would run first and be overwritten)
  const { pathname } = useLocation();
  const tab = hubTabs.find((t) => t.to === pathname.replace(/\/$/, '')) ?? hubTabs[0];
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
        {hubTabs.slice(3).map((t) => (
          <Route key={t.to} path={t.to.replace('/salingkusog/', '')} element={<ComingSoon title={t.label} />} />
        ))}
        <Route path="*" element={<ComingSoon title="This page" />} />
      </Routes>
    </>
  );
}
