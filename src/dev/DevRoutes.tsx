import type { SkEntryRow } from '@/lib/database.types';
import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { AccessPending, Forbidden } from '@/features/auth/guards';
import { PublicShell } from '@/features/public/layout/PublicLayout';
import { HomeSkeleton, HomeView } from '@/features/public/home/HomeView';
import { ComponentsPreview } from './ComponentsPreview';
import { SectionSkeleton, SectionView } from '@/features/public/section/SectionView';
import { ArticleSkeleton, ArticleView } from '@/features/public/article/ArticleView';
import { Comments } from '@/features/public/article/Comments';
import { ArchivesView } from '@/features/public/archives/ArchivesView';
import { SearchView } from '@/features/public/search/SearchView';
import { SubmitArticleForm, SubmitArticleLayout } from '@/features/public/intake/SubmitArticlePage';
import { SubmitEventForm, SubmitEventLayout } from '@/features/public/intake/SubmitEventPage';
import { ContactForm, ContactLayout } from '@/features/public/intake/ContactPage';
import { AboutPage } from '@/features/public/about/AboutPage';
import { PrivacyPage } from '@/features/public/about/PrivacyPage';
import { EditorialBoardView } from '@/features/public/about/EditorialBoardPage';
import { defaultSections } from '@/features/public/nav';
import { SalingkusogHeader } from '@/features/public/salingkusog/SalingkusogHeader';
import { MedalTallyView } from '@/features/public/salingkusog/MedalTallyView';
import { ScheduleView } from '@/features/public/salingkusog/ScheduleView';
import { WinnersView } from '@/features/public/salingkusog/WinnersView';
import { FactionView } from '@/features/public/salingkusog/FactionView';
import { SportView } from '@/features/public/salingkusog/SportView';
import { RecapView } from '@/features/public/salingkusog/RecapView';
import { VenuesView } from '@/features/public/salingkusog/VenuesView';
import { SportsLanding } from '@/features/public/section/SportsLanding';
import { CountdownView } from '@/features/public/salingkusog/CountdownView';
import { completedCount, winnerCards } from '@/features/public/salingkusog/winners';
import type { SkCategory } from '@/lib/database.types';
import type { ScheduleFilters } from '@/features/public/salingkusog/hub';
import { skFixture } from './skFixtures';
import { fixtureArticle, fixtureComments, fixtureHome, fixtureHomeEmpty, fixtureIssues, fixtureMonths, fixtureSection } from './fixtures';

/** /dev/* — fixture screens for checking UI without production data (dev builds only). */
export default function DevRoutes() {
  return (
    <Routes>
      <Route index element={<DevIndex />} />
      <Route path="components" element={<ComponentsPreview />} />
      <Route path="home" element={<PublicShell><HomeView data={fixtureHome} /></PublicShell>} />
      <Route path="home/empty" element={<PublicShell><HomeView data={fixtureHomeEmpty} /></PublicShell>} />
      <Route path="home/loading" element={<PublicShell><HomeSkeleton /></PublicShell>} />
      <Route path="section" element={<PublicShell><SectionView {...fixtureSection} activeCategory={null} categoryHref={(s) => (s ? `/dev/section?category=${s}` : '/dev/section')} /></PublicShell>} />
      <Route path="section/empty" element={<PublicShell><SectionView {...fixtureSection} items={[]} total={0} pageCount={1} activeCategory="environment" categoryHref={() => '/dev/section'} /></PublicShell>} />
      <Route path="section/loading" element={<PublicShell><SectionSkeleton /></PublicShell>} />
      <Route path="section/:slug" element={<PublicShell><Suspense fallback={null}><FixtureLanding /></Suspense></PublicShell>} />
      <Route path="section/:slug/empty" element={<PublicShell><Suspense fallback={null}><FixtureLanding empty /></Suspense></PublicShell>} />
      <Route
        path="article"
        element={
          <PublicShell>
            <ArticleView
              article={fixtureArticle}
              url="https://amaranth.example/article/demo"
              related={fixtureHome.latest}
              comments={<Comments comments={fixtureComments} open onSubmit={() => new Promise((r) => setTimeout(r, 600))} />}
            />
          </PublicShell>
        }
      />
      <Route
        path="article/preview"
        element={
          <PublicShell>
            <ArticleView article={{ ...fixtureArticle, status: 'in_review', isLive: false }} url="/" related={[]} />
          </PublicShell>
        }
      />
      <Route path="article/loading" element={<PublicShell><ArticleSkeleton /></PublicShell>} />
      <Route
        path="search"
        element={
          <PublicShell>
            <SearchView
              draft="typhoon"
              onDraftChange={() => undefined}
              onSubmit={() => undefined}
              filters={{ q: 'typhoon', section: null, from: null, to: null, tag: null, page: 1 }}
              onFilter={() => undefined}
              sections={defaultSections}
              result={{ items: fixtureSection.items.slice(0, 6), total: 23, pageCount: 3 }}
              loading={false}
              fetching={false}
              error={null}
              onRetry={() => undefined}
            />
          </PublicShell>
        }
      />
      <Route path="archives" element={<PublicShell><ArchivesView issues={fixtureIssues} months={fixtureMonths} /></PublicShell>} />
      <Route path="submit" element={<PublicShell><SubmitArticleLayout form={<SubmitArticleForm sections={defaultSections} onSubmit={fakeSubmit} />} /></PublicShell>} />
      <Route path="submit/event" element={<PublicShell><SubmitEventLayout form={<SubmitEventForm onSubmit={fakeSubmit} />} /></PublicShell>} />
      <Route
        path="contact"
        element={
          <PublicShell>
            <ContactLayout
              info={{ office_address: ['Amaranth Publication Office', 'Student Center Building', 'Visayas State University', 'Baybay City, Leyte 6521-A'], phones: ['+63 53 335 2601'], emails: ['amaranth@vsu.edu.ph', 'editor@amaranth.vsu.edu.ph'], office_hours: ['Monday – Friday: 8:00 AM – 5:00 PM'] }}
              departments={[{ id: 'd1', name: 'News Department', email: 'news@amaranth.vsu.edu.ph', phone: null, description: null }, { id: 'd2', name: 'Sports Department', email: 'sports@amaranth.vsu.edu.ph', phone: null, description: null }]}
              form={<ContactForm onSubmit={fakeSubmit} />}
            />
          </PublicShell>
        }
      />
      <Route path="about" element={<PublicShell><AboutPage /></PublicShell>} />
      <Route path="privacy" element={<PublicShell><PrivacyPage /></PublicShell>} />
      <Route
        path="sports"
        element={
          <PublicShell>
            <SportsLanding
              categories={[{ slug: 'basketball', name: 'Basketball' }, { slug: 'volleyball', name: 'Volleyball' }, { slug: 'athletics', name: 'Athletics' }, { slug: 'varsity', name: 'Varsity' }]}
              items={fixtureSection.items}
              hasMore
              sk={{ edition: skFixture.edition, hub: skHub, table: skFixture.medalTable, phase: skPhase, spotlight: { award: skFixture.awards.find((a) => a.id === 'aw2')!, athlete: skFixture.athletes[1], photo: null } }}
            />
          </PublicShell>
        }
      />
      <Route path="sports/no-salingkusog" element={<PublicShell><SportsLanding categories={[]} items={fixtureSection.items} hasMore={false} sk={null} /></PublicShell>} />
      <Route path="countdown" element={<CountdownView title="Salingkusog 2026" target={new Date(Date.now() + 12 * 86_400_000 + 4 * 3600_000 + 37 * 60_000).toISOString()} />} />
      <Route path="countdown/done" element={<CountdownView title="Salingkusog 2026" target="2020-01-01T08:00:00+08:00" />} />
      <Route path="salingkusog/*" element={<PublicShell><FixtureSalingkusog /></PublicShell>} />
      <Route
        path="editorial-board"
        element={
          <PublicShell>
            <EditorialBoardView
              data={{
                term: '2025–2026',
                terms: [{ label: '2025–2026', is_current: true }, { label: '2024–2025', is_current: false }],
                people: [
                  { id: 'p1', name: 'Dr. Ulderico A. Alviola', position: 'Adviser', group: 'adviser', photo: { bucket: 'media', path: '/images/advisers/ulderico-alviola.jpg' } },
                  { id: 'p2', name: 'Anna Marie Naagas', position: 'Executive Editor', group: 'editorial_board', photo: { bucket: 'media', path: '/images/editorial-board/anna-naagas.jpg' } },
                  { id: 'p3', name: 'Jelly Mondejar', position: 'Managing Editor', group: 'editorial_board', photo: { bucket: 'media', path: '/images/editorial-board/jelly-mondejar.jpg' } },
                  { id: 'p4', name: 'Fred Vincent Marfori', position: 'News Editor', group: 'section_head', photo: { bucket: 'media', path: '/images/section-heads/fred-marfori.jpg' } },
                  { id: 'p5', name: 'Frances Ibo', position: 'Sports Editor', group: 'section_head', photo: { bucket: 'media', path: '/images/section-heads/frances-ibo.jpg' } },
                ],
              }}
            />
          </PublicShell>
        }
      />
      <Route path="admin/*" element={<Suspense fallback={null}><AdminFixtures /></Suspense>} />
      <Route path="auth/pending" element={<AccessPending />} />
      <Route path="auth/forbidden" element={<main id="main" className="container-page"><Forbidden /></main>} />
    </Routes>
  );
}


const skHub = { factions: skFixture.factions, sports: skFixture.sports, events: skFixture.events, venues: skFixture.venues, logos: [], matches: skFixture.matches };
const skPhase = { kind: 'during', day: 4, of: 6 } as const;

// "Build schedule" output: a bracket halfway through and a round robin + final after round 1
const genBase = skFixture.matches[0];
const gen = (id: string, event_id: string, round: string, round_order: number, extra: Partial<typeof genBase>) =>
  ({ ...genBase, id, event_id, round, round_order, bracket_slot: null, status: 'upcoming', side_a_id: null, side_b_id: null, score_a: null, score_b: null, winner_side: null, periods: [], team_stats: [], live_note: null, ended_at: null, recap_article_id: null, ...extra }) as typeof genBase;
const genEvents = [
  { ...skFixture.events[0], id: 'gen-ko', name: 'Men', seeds: ['pt', 'cv', 'sd', 'mm'] },
  { ...skFixture.events[1], id: 'gen-rr', name: 'Women', format: 'round_robin_final' as const, seeds: ['pt', 'cv', 'sd', 'mm'] },
];
const genMatches = [
  gen('k1', 'gen-ko', 'Semifinal 1', 1, { bracket_slot: 1, source_a: 'seed:1', source_b: 'seed:4', side_a_id: 'pt', side_b_id: 'mm', status: 'final', score_a: 83, score_b: 80, winner_side: 'a', scheduled_at: '2026-11-03T00:00:00Z' }),
  gen('k2', 'gen-ko', 'Semifinal 2', 1, { bracket_slot: 2, source_a: 'seed:2', source_b: 'seed:3', side_a_id: 'cv', side_b_id: 'sd', status: 'live', score_a: 41, score_b: 44, live_note: 'Q3', scheduled_at: '2026-11-03T01:30:00Z' }),
  gen('k3', 'gen-ko', 'Bronze game', 2, { source_a: 'loser:k1', source_b: 'loser:k2', side_a_id: 'mm', scheduled_at: '2026-11-04T00:00:00Z' }),
  gen('k4', 'gen-ko', 'Final', 2, { bracket_slot: 1, source_a: 'winner:k1', source_b: 'winner:k2', side_a_id: 'pt', scheduled_at: '2026-11-04T01:30:00Z' }),
  gen('r1', 'gen-rr', 'Round 1 · Game 1', 1, { bracket_slot: 1, source_a: 'seed:1', source_b: 'seed:4', side_a_id: 'pt', side_b_id: 'mm', status: 'final', score_a: 4, score_b: 1, winner_side: 'a', scheduled_at: '2026-11-03T00:00:00Z' }),
  gen('r2', 'gen-rr', 'Round 1 · Game 2', 1, { bracket_slot: 2, source_a: 'seed:2', source_b: 'seed:3', side_a_id: 'cv', side_b_id: 'sd', status: 'final', score_a: 1, score_b: 4, winner_side: 'b', scheduled_at: '2026-11-03T01:30:00Z' }),
  gen('r3', 'gen-rr', 'Round 2 · Game 1', 2, { bracket_slot: 1, source_a: 'seed:1', source_b: 'seed:3', side_a_id: 'pt', side_b_id: 'sd', scheduled_at: '2026-11-04T00:00:00Z' }),
  gen('r4', 'gen-rr', 'Round 2 · Game 2', 2, { bracket_slot: 2, source_a: 'seed:2', source_b: 'seed:4', side_a_id: 'cv', side_b_id: 'mm', scheduled_at: '2026-11-04T01:30:00Z' }),
  gen('r5', 'gen-rr', 'Round 3 · Game 1', 3, { bracket_slot: 1, source_a: 'seed:1', source_b: 'seed:2', scheduled_at: '2026-11-05T00:00:00Z' }),
  gen('r6', 'gen-rr', 'Round 3 · Game 2', 3, { bracket_slot: 2, source_a: 'seed:3', source_b: 'seed:4', scheduled_at: '2026-11-05T01:30:00Z' }),
  gen('r7', 'gen-rr', 'Bronze game', 4, { source_a: 'rank:3', source_b: 'rank:4', scheduled_at: '2026-11-06T00:00:00Z' }),
  gen('r8', 'gen-rr', 'Final', 4, { bracket_slot: 1, source_a: 'rank:1', source_b: 'rank:2', scheduled_at: '2026-11-06T01:30:00Z' }),
];
const genHub = { ...skHub, events: genEvents, matches: genMatches };

// Contests: a finished 100m (times, one athlete per faction) and a dance contest before it starts
const danceEvent = { ...skFixture.events[3], id: 'dance', sport_id: 'at', name: 'Hip-hop', format: 'judged' as const, is_team: true, result_unit: null };
const contestMatches = [
  gen('c1', 'at-100w', 'Final', 1, { is_contest: true, status: 'final', venue_id: 'oval', scheduled_at: '2026-11-03T01:00:00Z', ended_at: '2026-11-03T01:20:00Z' }),
  gen('c2', 'dance', 'Final', 1, { is_contest: true, venue_id: 'gym', scheduled_at: '2026-11-05T06:00:00Z' }),
];
const entry = (id: string, match_id: string, faction_id: string, lane: number, extra: Partial<SkEntryRow> = {}): SkEntryRow =>
  ({ id, edition_id: 'e1', match_id, faction_id, athlete_id: null, lane, result: null, place: null, status: 'ok', created_at: '', updated_at: '', ...extra }) as SkEntryRow;
const contestHub = {
  ...skHub,
  events: [...skHub.events, danceEvent],
  matches: [...skHub.matches, ...contestMatches],
  entries: [
    entry('x1', 'c1', 'pt', 1, { athlete_id: 'a1', result: 12.84 }),
    entry('x2', 'c1', 'sd', 2, { athlete_id: 'a2', result: 12.61 }),
    entry('x3', 'c1', 'cv', 3, { athlete_id: 'a3', result: 13.02 }),
    entry('x4', 'c1', 'mm', 4, { status: 'dnf' }),
    entry('y1', 'c2', 'mm', 1),
    entry('y2', 'c2', 'cv', 2),
    entry('y3', 'c2', 'pt', 3),
    entry('y4', 'c2', 'sd', 4),
  ],
};

function FixtureSalingkusog() {
  return (
    <>
      <SalingkusogHeader edition={skFixture.edition} factions={skFixture.factions} sportsCount={18} liveCount={1} phase={skPhase} />
      <Routes>
        <Route index element={<MedalTallyView edition={skFixture.edition} hub={skHub} table={skFixture.medalTable} race={skFixture.pointsByDay} phase={skPhase} now={new Date('2026-11-03T01:30:00Z')} />} />
        <Route path="final" element={<MedalTallyView edition={skFixture.edition} hub={{ ...skHub, matches: skHub.matches.map((m) => (m.status === 'cancelled' ? m : { ...m, status: 'final' as const })) }} table={skFixture.medalTable} race={skFixture.pointsByDay} phase={{ kind: 'after', of: 6 }} />} />
        <Route path="schedule" element={<FixtureSchedule />} />
        <Route path="winners" element={<FixtureWinners />} />
        <Route path="sports/contest-race" element={<SportView sport={skFixture.sports[2]} event={skFixture.events[3]} hub={contestHub} placements={[]} athletes={skFixture.athletes} leaders={[]} />} />
        <Route path="sports/contest-dance" element={<SportView sport={skFixture.sports[2]} event={danceEvent} hub={contestHub} placements={[]} athletes={skFixture.athletes} leaders={[]} />} />
        <Route path="sports/auto-bracket" element={<SportView sport={skFixture.sports[0]} event={genEvents[0]} hub={genHub} placements={[]} athletes={skFixture.athletes} leaders={[]} />} />
        <Route path="sports/auto-round-robin" element={<SportView sport={skFixture.sports[0]} event={genEvents[1]} hub={genHub} placements={[]} athletes={skFixture.athletes} leaders={[]} />} />
        <Route path="sports" element={<SportView sport={skFixture.sports[0]} event={skFixture.events[0]} hub={skHub} placements={skFixture.placements} athletes={skFixture.athletes} leaders={skFixture.leaders} />} />
        <Route path="venues" element={<VenuesView hub={skHub} map={null} now={new Date('2026-11-03T01:30:00Z')} />} />
        <Route path="match" element={<RecapView match={skFixture.matches.find((m) => m.id === 'm8')!} hub={skHub} placements={skFixture.placements} athletes={skFixture.athletes} stats={skFixture.athleteStats} awards={skFixture.awards.filter((a) => a.match_id === 'm8')} article={{ ...fixtureArticle, title: 'Tiamat survive a late Vanguard surge to claim basketball gold' }} />} />
        <Route path="factions" element={<FactionView faction={skFixture.factions[0]} hub={skHub} table={skFixture.medalTable} placements={skFixture.placements} athletes={skFixture.athletes} />} />
      </Routes>
    </>
  );
}

function FixtureWinners() {
  const [category, setCategory] = useState<SkCategory | null>(null);
  return <WinnersView cards={winnerCards(skHub, skFixture.placements, skFixture.athletes)} hub={skHub} completed={completedCount(skHub, skFixture.placements)} category={category} onCategory={setCategory} />;
}

function FixtureSchedule() {
  const [day, setDay] = useState('2026-11-03');
  const [filters, setFilters] = useState<ScheduleFilters>({ show: 'all' });
  return <ScheduleView edition={skFixture.edition} hub={skHub} pdf={{ bucket: 'archives', path: '/documents/sample.pdf' }} day={day} filters={filters} onDay={setDay} onFilters={setFilters} today="2026-11-03" />;
}

// CMS fixtures pull in the editor (TipTap); keep them out of the public fixture chunk.
const AdminFixtures = lazy(() => import('./AdminFixtures'));
const FixtureLanding = lazy(() => import('./landingFixtures'));

const fakeSubmit = () => new Promise((resolve) => setTimeout(resolve, 700));

const devScreens: { path: string; label: string }[] = [
  { path: 'components', label: 'Components' },
  { path: 'home', label: 'Home (Figma content)' },
  { path: 'sports', label: 'Sports landing (with Salingkusog)' },
  { path: 'sports/no-salingkusog', label: 'Sports landing (no edition)' },
  { path: 'countdown', label: 'Salingkusog countdown (ticking)' },
  { path: 'countdown/done', label: 'Salingkusog countdown — the games have begun' },
  { path: 'salingkusog', label: 'Salingkusog — Medal Tally' },
  { path: 'salingkusog/final', label: 'Salingkusog — Official and final medal tally' },
  { path: 'salingkusog/sports/contest-race', label: 'Salingkusog — Contest results (100m, times)' },
  { path: 'salingkusog/sports/contest-dance', label: 'Salingkusog — Contest line-up (dance, before it starts)' },
  { path: 'salingkusog/sports/auto-bracket', label: 'Salingkusog — Built bracket, halfway (winners move on)' },
  { path: 'salingkusog/sports/auto-round-robin', label: 'Salingkusog — Round robin + final after round 1' },
  { path: 'salingkusog/schedule', label: 'Salingkusog — Schedule & Results (filters work)' },
  { path: 'salingkusog/winners', label: 'Salingkusog — Winners per game' },
  { path: 'salingkusog/factions', label: 'Salingkusog — Faction profile' },
  { path: 'salingkusog/sports', label: 'Salingkusog — Sport with bracket' },
  { path: 'salingkusog/match', label: 'Salingkusog — Match recap' },
  { path: 'salingkusog/venues', label: 'Salingkusog — Venue guide' },
  { path: 'home/empty', label: 'Home — empty' },
  { path: 'home/loading', label: 'Home — loading' },
  { path: 'section', label: 'Section page' },
  { path: 'section/empty', label: 'Section — empty category' },
  { path: 'section/loading', label: 'Section — loading' },
  { path: 'article', label: 'Article' },
  { path: 'article/preview', label: 'Article — staff preview' },
  { path: 'article/loading', label: 'Article — loading' },
  { path: 'search', label: 'Search results' },
  { path: 'archives', label: 'Archives' },
  { path: 'submit', label: 'Submit a story' },
  { path: 'submit/event', label: 'Report an event' },
  { path: 'contact', label: 'Contact' },
  { path: 'about', label: 'About' },
  { path: 'editorial-board', label: 'Editorial Board' },
  { path: 'admin', label: 'CMS dashboard (editor)' },
  { path: 'admin/writer', label: 'CMS dashboard (writer)' },
  { path: 'admin/loading', label: 'CMS dashboard — loading' },
  { path: 'admin/articles', label: 'CMS articles table' },
  { path: 'admin/editor', label: 'CMS editor (body + workflow)' },
  { path: 'admin/media', label: 'CMS media library' },
  { path: 'admin/intake', label: 'CMS submission review' },
  { path: 'admin/salingkusog-team', label: 'CMS Salingkusog team (manager)' },
  { path: 'admin/salingkusog-team-member', label: 'CMS Salingkusog team (member, read-only)' },
  { path: 'admin/salingkusog-setup', label: 'CMS Salingkusog setup (edition, factions, sports, import)' },
  { path: 'admin/salingkusog-scores', label: 'CMS Salingkusog games by day' },
  { path: 'admin/salingkusog-scorekeeper', label: 'CMS Salingkusog scorekeeper (live, buttons work)' },
  { path: 'admin/salingkusog-results', label: 'CMS Salingkusog results & medals' },
  { path: 'admin/salingkusog-awards', label: 'CMS Salingkusog awards + athletes' },
  { path: 'admin/salingkusog-cards', label: 'CMS Salingkusog social cards (MVP, Athlete of the Day)' },
  { path: '/admin/login', label: 'Staff sign in' },
  { path: '/admin/forgot-password', label: 'Forgot password' },
  { path: '/admin/set-password', label: 'Set password (expired link state)' },
  { path: 'auth/pending', label: 'Access pending' },
  { path: 'auth/forbidden', label: 'Forbidden' },
];

function DevIndex() {
  useDocumentTitle('Dev screens');
  (window as unknown as { __devPaths?: string[] }).__devPaths = devScreens.map((s) => (s.path.startsWith('/') ? s.path : `/dev/${s.path}`));
  return (
    <main id="main" className="container-page py-12">
      <h1 className="font-serif text-headline-l">Dev screens</h1>
      <ul className="mt-6 flex flex-col gap-2">
        {devScreens.map((s) => (
          <li key={s.path}>
            <Link className="text-green-700 underline" to={s.path}>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
