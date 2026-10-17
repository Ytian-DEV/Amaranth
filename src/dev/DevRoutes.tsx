import { Link, Route, Routes } from 'react-router-dom';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { AccessPending, Forbidden } from '@/features/auth/guards';
import { PublicShell } from '@/features/public/layout/PublicLayout';
import { HomeSkeleton, HomeView } from '@/features/public/home/HomeView';
import { ComponentsPreview } from './ComponentsPreview';
import { SectionSkeleton, SectionView } from '@/features/public/section/SectionView';
import { fixtureHome, fixtureHomeEmpty, fixtureSection } from './fixtures';

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
      <Route path="auth/pending" element={<AccessPending />} />
      <Route path="auth/forbidden" element={<main id="main" className="container-page"><Forbidden /></main>} />
    </Routes>
  );
}

const devScreens: { path: string; label: string }[] = [
  { path: 'components', label: 'Components' },
  { path: 'home', label: 'Home (Figma content)' },
  { path: 'home/empty', label: 'Home — empty' },
  { path: 'home/loading', label: 'Home — loading' },
  { path: 'section', label: 'Section page' },
  { path: 'section/empty', label: 'Section — empty category' },
  { path: 'section/loading', label: 'Section — loading' },
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
