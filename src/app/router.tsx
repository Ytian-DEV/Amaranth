import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

// Dev-only fixture screens. `import.meta.env.DEV` is false in production builds,
// so this branch and its dynamic import are removed from the bundle.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: 'dev/*', lazy: async () => ({ Component: (await import('../dev/DevRoutes')).default }) }]
  : [];

// CMS screens still to be built (each later feature replaces its entry).
const cmsPlaceholders: RouteObject[] = [
  ['submissions/*', 'Submissions', 'feature/cms-site-settings'],
  ['events/*', 'Events', 'feature/cms-site-settings'],
  ['settings/*', 'Settings', 'feature/cms-site-settings'],
].map(([path, title, feature]) => ({
  path,
  lazy: async () => {
    const { ComingSoon } = await import('@/features/cms/ComingSoon');
    return { Component: () => <ComingSoon title={title} feature={feature} /> };
  },
}));

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
          { path: 'staff/*', lazy: async () => ({ Component: (await import('@/features/cms/people/PeoplePage')).PeoplePage }) },
          { path: 'media', lazy: async () => ({ Component: (await import('@/features/cms/media/MediaLibraryPage')).MediaLibraryPage }) },
          { path: 'articles/:id', lazy: async () => ({ Component: (await import('@/features/cms/articles/editor/ArticleEditorPage')).ArticleEditorPage }) },
          ...cmsPlaceholders,
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
].map(([path, to]) => ({ path, element: <Navigate to={to} replace /> }));

const publicRoutes: RouteObject[] = [
  {
    lazy: async () => ({ Component: (await import('@/features/public/layout/PublicLayout')).PublicLayout }),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/features/public/home/HomePage')).HomePage }) },
      { path: 'article/:slug', lazy: async () => ({ Component: (await import('@/features/public/article/ArticlePage')).ArticlePage }) },
      { path: 'submit', lazy: async () => ({ Component: (await import('@/features/public/intake/SubmitArticlePage')).SubmitArticlePage }) },
      { path: 'submit/event', lazy: async () => ({ Component: (await import('@/features/public/intake/SubmitEventPage')).SubmitEventPage }) },
      { path: 'contact', lazy: async () => ({ Component: (await import('@/features/public/intake/ContactPage')).ContactPage }) },
      { path: 'about', lazy: async () => ({ Component: (await import('@/features/public/about/AboutPage')).AboutPage }) },
      { path: 'editorial-board', lazy: async () => ({ Component: (await import('@/features/public/about/EditorialBoardPage')).EditorialBoardPage }) },
      { path: 'search', lazy: async () => ({ Component: (await import('@/features/public/search/SearchPage')).SearchPage }) },
      { path: 'archives', lazy: async () => ({ Component: (await import('@/features/public/archives/ArchivesPage')).ArchivesPage }) },
      { path: 'archives/:month', lazy: async () => ({ Component: (await import('@/features/public/archives/ArchivesPage')).ArchiveMonthPage }) },
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
