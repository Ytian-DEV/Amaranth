import { useEffect, useRef, useState } from 'react';
import { drawSocialCard, socialCardData } from '@/features/cms/salingkusog/awards/socialCard';
import { AwardsView } from '@/features/cms/salingkusog/awards/AwardsTab';
import { ResultsEditorView, ResultsListView } from '@/features/cms/salingkusog/results/ResultsTab';
import { ScorekeeperView } from '@/features/cms/salingkusog/scores/Scorekeeper';
import { ScoresView } from '@/features/cms/salingkusog/scores/ScoresTab';
import { AthletesView } from '@/features/cms/salingkusog/setup/AthletesTab';
import type { SkMatchRow } from '@/lib/database.types';
import { skFixture } from './skFixtures';

const noop = () => undefined;

/** Scorekeeper with local state, so the buttons work without Supabase. */
export function FixtureScorekeeper() {
  const [match, setMatch] = useState<SkMatchRow>(skFixture.matches[1]);
  return (
    <ScorekeeperView
      match={match}
      lookups={skFixture}
      saving="saved"
      error={null}
      onDraft={(p) => setMatch((m) => ({ ...m, ...p }))}
      onStatus={(status) => setMatch((m) => ({ ...m, status, winner_side: status === 'final' ? ((m.score_a ?? 0) > (m.score_b ?? 0) ? 'a' : 'b') : null }))}
      onEdit={noop}
      onDelete={noop}
    />
  );
}

export function FixtureScores() {
  const [day, setDay] = useState('2026-11-03');
  const [sport, setSport] = useState('');
  return <ScoresView edition={skFixture.edition} matches={skFixture.matches} lookups={skFixture} day={day} onDay={setDay} sportId={sport} onSport={setSport} onAdd={noop} />;
}

export function FixtureResults() {
  return (
    <div className="flex flex-col gap-8">
      <ResultsListView lookups={skFixture} placements={skFixture.placements} />
      <ResultsEditorView event={skFixture.events[3]} lookups={skFixture} games={[]} placements={skFixture.placements} day="2026-11-03" onSave={noop} />
    </div>
  );
}

export function FixtureAwardsAthletes() {
  const [q, setQ] = useState('');
  return (
    <div className="flex flex-col gap-8">
      <AwardsView edition={skFixture.edition} awards={skFixture.awards} lookups={skFixture} onAdd={noop} onEdit={noop} onDelete={noop} />
      <AthletesView athletes={skFixture.athletes} factions={skFixture.factions} photos={[]} query={q} onQuery={setQ} onAdd={noop} onEdit={noop} onDelete={noop} />
    </div>
  );
}

/** Both social cards, drawn from fixture data (no Supabase needed). */
export function FixtureSocialCards() {
  const mvp = useRef<HTMLCanvasElement>(null);
  const aotd = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const find = (id: string) => skFixture.awards.find((a) => a.id === id)!;
    if (mvp.current) void drawSocialCard(mvp.current, socialCardData(find('aw1'), skFixture, skFixture.edition, skFixture.matches, skFixture.placements, []));
    if (aotd.current) void drawSocialCard(aotd.current, socialCardData(find('aw2'), skFixture, skFixture.edition, skFixture.matches, skFixture.placements, []));
  }, []);
  return (
    <div className="flex flex-wrap items-start gap-6">
      <canvas ref={mvp} role="img" aria-label="MVP of the Day card" className="h-auto w-full max-w-[360px] rounded-md border border-line" />
      <canvas ref={aotd} role="img" aria-label="Athlete of the Day card" className="h-auto w-full max-w-[360px] rounded-md border border-line" />
    </div>
  );
}
