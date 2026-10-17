import { Route, Routes } from 'react-router-dom';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { usePageMeta } from '@/lib/usePageMeta';
import { hubPhase, hubTabs } from './hub';
import { MedalTallyView } from './MedalTallyView';
import { SalingkusogHeader } from './SalingkusogHeader';
import { useCurrentEdition, useHubData, useLiveGames, useStandings } from './skData';

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

/** /salingkusog/* — the intramurals hub. */
export function SalingkusogPage() {
  const edition = useCurrentEdition();
  const ed = edition.data ?? undefined;
  const hub = useHubData(ed?.id);
  const standings = useStandings(ed?.id);
  useLiveGames(ed?.id);
  usePageMeta({
    title: ed ? `${ed.title} Medal Tally` : edition.data === null ? 'Salingkusog' : undefined,
    description: ed ? `Live medal tally, standings and scores from ${ed.title}${ed.subtitle ? `, ${ed.subtitle}` : ''}.` : undefined,
    path: '/salingkusog',
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
        {hubTabs.slice(1).map((t) => (
          <Route key={t.to} path={t.to.replace('/salingkusog/', '')} element={<ComingSoon title={t.label} />} />
        ))}
        <Route path="*" element={<ComingSoon title="This page" />} />
      </Routes>
    </>
  );
}
