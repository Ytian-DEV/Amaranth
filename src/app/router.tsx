import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { HomePage } from '@/features/public/home/HomePage';
import { PublicLayout } from '@/features/public/layout/PublicLayout';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

// Dev-only fixture screens. `import.meta.env.DEV` is false in production builds,
// so this branch and its dynamic import are removed from the bundle. A perf-test
// build can keep them with VITE_ENABLE_FIXTURES=true (never set this on Vercel).
const devRoutes: RouteObject[] = import.meta.env.DEV || import.meta.env.VITE_ENABLE_FIXTURES === 'true'
  ? [{ path: 'dev/*', lazy: async () => ({ Component: (await import('../dev/DevRoutes')).default }) }]
  : [];

const adminRoutes: RouteObject[] = [
  { path: 'admin/login', lazy: async () => ({ Component: (await import('@/features/auth/LoginPage')).LoginPage }) },
  {
    path: 'admin/forgot-password',
    lazy: async () => ({ Component: (await import('@/features/auth/ForgotPasswordPage')).ForgotPasswordPage }),
  },
  {
    path: 'admin/set-password',
    lazy: async () => ({ Component: (await import('@/features/auth/SetPasswordPage')).SetPasswordPage }),
  },
  {
    path: 'admin',
    lazy: async () => ({ Component: (await import('@/features/auth/guards')).RequireStaff }),
    children: [
      {
        lazy: async () => ({ Component: (await import('@/features/cms/layout/AdminLayout')).AdminLayout }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import('@/features/cms/dashboard/DashboardPage')).DashboardPage }) },
          { path: 'articles', lazy: async () => ({ Component: (await import('@/features/cms/articles/ArticlesListPage')).ArticlesListPage }) },
          { path: 'articles/new', lazy: async () => ({ Component: (await import('@/features/cms/articles/editor/ArticleEditorPage')).ArticleEditorPage }) },
          { path: 'submissions', lazy: async () => { const m = await import('@/features/cms/intake/IntakePage'); return { Component: () => <m.IntakeList kind="submission" /> }; } },
          { path: 'submissions/:id', lazy: async () => { const m = await import('@/features/cms/intake/IntakePage'); return { Component: () => <m.IntakeDetail kind="submission" /> }; } },
          { path: 'events', lazy: async () => { const m = await import('@/features/cms/intake/IntakePage'); return { Component: () => <m.IntakeList kind="event" /> }; } },
          { path: 'events/:id', lazy: async () => { const m = await import('@/features/cms/intake/IntakePage'); return { Component: () => <m.IntakeDetail kind="event" /> }; } },
          { path: 'settings/*', lazy: async () => ({ Component: (await import('@/features/cms/settings/SettingsPage')).SettingsPage }) },
          { path: '*', element: <Navigate to="/admin" replace /> },
          { path: 'staff/*', lazy: async () => ({ Component: (await import('@/features/cms/people/PeoplePage')).PeoplePage }) },
          { path: 'media', lazy: async () => ({ Component: (await import('@/features/cms/media/MediaLibraryPage')).MediaLibraryPage }) },
          { path: 'salingkusog/*', lazy: async () => ({ Component: (await import('@/features/cms/salingkusog/SalingkusogPage')).SalingkusogPage }) },
          { path: 'articles/:id', lazy: async () => ({ Component: (await import('@/features/cms/articles/editor/ArticleEditorPage')).ArticleEditorPage }) },
        ],
      },
    ],
  },
];

// Old v1 URLs → v2 URLs
const redirects: RouteObject[] = [
  ['home', '/'],
  ['features', '/feature'],
  ['blog', '/blogs'],
  ['s&t', '/science-technology'],
  ['submit-article', '/submit'],
  ['dashboard', '/admin'],
  // the hub lives at /salingkusog; the 2026 address is what posters and the countdown link to
  ['salingkusog-2026', '/salingkusog'],
].map(([path, to]) => ({ path, element: <Navigate to={to} replace /> }));

const publicRoutes: RouteObject[] = [
  // full-screen themed page, outside the site header/footer
  { path: 'salingkusog-2026/countdown', lazy: async () => ({ Component: (await import('@/features/public/salingkusog/CountdownPage')).CountdownPage }) },
  {
    // eager: the public shell and front page are the first thing most visitors see
    Component: PublicLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'article/:slug', lazy: async () => ({ Component: (await import('@/features/public/article/ArticlePage')).ArticlePage }) },
      { path: 'submit', lazy: async () => ({ Component: (await import('@/features/public/intake/SubmitArticlePage')).SubmitArticlePage }) },
      { path: 'submit/event', lazy: async () => ({ Component: (await import('@/features/public/intake/SubmitEventPage')).SubmitEventPage }) },
      { path: 'contact', lazy: async () => ({ Component: (await import('@/features/public/intake/ContactPage')).ContactPage }) },
      { path: 'about', lazy: async () => ({ Component: (await import('@/features/public/about/AboutPage')).AboutPage }) },
      { path: 'editorial-board', lazy: async () => ({ Component: (await import('@/features/public/about/EditorialBoardPage')).EditorialBoardPage }) },
      { path: 'search', lazy: async () => ({ Component: (await import('@/features/public/search/SearchPage')).SearchPage }) },
      { path: 'archives', lazy: async () => ({ Component: (await import('@/features/public/archives/ArchivesPage')).ArchivesPage }) },
      { path: 'archives/:month', lazy: async () => ({ Component: (await import('@/features/public/archives/ArchivesPage')).ArchiveMonthPage }) },
      { path: 'salingkusog/*', lazy: async () => ({ Component: (await import('@/features/public/salingkusog/SalingkusogPage')).SalingkusogPage }) },
      { path: 'latest', lazy: async () => ({ Component: (await import('@/features/public/section/SectionPage')).LatestPage }) },
      { path: ':section', lazy: async () => ({ Component: (await import('@/features/public/section/SectionPage')).SectionPage }) },
      { path: '*', lazy: async () => ({ Component: (await import('@/features/public/NotFoundPage')).NotFoundPage }) },
    ],
  },
];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      ...devRoutes,
      ...adminRoutes,
      ...redirects,
      ...publicRoutes,
    ],
  },
];

export const router = createBrowserRouter(routes);
