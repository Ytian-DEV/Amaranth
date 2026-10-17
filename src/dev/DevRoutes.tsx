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
import { EditorialBoardView } from '@/features/public/about/EditorialBoardPage';
import { defaultSections } from '@/features/public/nav';
import { SalingkusogHeader } from '@/features/public/salingkusog/SalingkusogHeader';
import { MedalTallyView } from '@/features/public/salingkusog/MedalTallyView';
import { ScheduleView } from '@/features/public/salingkusog/ScheduleView';
import { WinnersView } from '@/features/public/salingkusog/WinnersView';
import { FactionView } from '@/features/public/salingkusog/FactionView';
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

function FixtureSalingkusog() {
  return (
    <>
      <SalingkusogHeader edition={skFixture.edition} factions={skFixture.factions} sportsCount={18} liveCount={1} phase={skPhase} />
      <Routes>
        <Route index element={<MedalTallyView edition={skFixture.edition} hub={skHub} table={skFixture.medalTable} race={skFixture.pointsByDay} phase={skPhase} now={new Date('2026-11-03T01:30:00Z')} />} />
        <Route path="schedule" element={<FixtureSchedule />} />
        <Route path="winners" element={<FixtureWinners />} />
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

const fakeSubmit = () => new Promise((resolve) => setTimeout(resolve, 700));

const devScreens: { path: string; label: string }[] = [
  { path: 'components', label: 'Components' },
  { path: 'home', label: 'Home (Figma content)' },
  { path: 'salingkusog', label: 'Salingkusog — Medal Tally' },
  { path: 'salingkusog/schedule', label: 'Salingkusog — Schedule & Results (filters work)' },
  { path: 'salingkusog/winners', label: 'Salingkusog — Winners per game' },
  { path: 'salingkusog/factions', label: 'Salingkusog — Faction profile' },
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
