import { Link, Route, Routes } from 'react-router-dom';
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
import { defaultSections } from '@/features/public/nav';
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
      <Route path="auth/pending" element={<AccessPending />} />
      <Route path="auth/forbidden" element={<main id="main" className="container-page"><Forbidden /></main>} />
    </Routes>
  );
}

const fakeSubmit = () => new Promise((resolve) => setTimeout(resolve, 700));

const devScreens: { path: string; label: string }[] = [
  { path: 'components', label: 'Components' },
  { path: 'home', label: 'Home (Figma content)' },
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
  { path: '/admin/login', label: 'Staff sign in' },
  { path: '/admin/forgot-password', label: 'Forgot password' },
  { path: '/admin/set-password', label: 'Set password (expired link state)' },
  { path: 'auth/pending', label: 'Access pending' },
  { path: 'auth/forbidden', label: 'Forbidden' },
];

function DevIndex() {
  useDocumentTitle('Dev screens');
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
