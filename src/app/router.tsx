import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

// Dev-only fixture screens. `import.meta.env.DEV` is false in production builds,
// so this branch and its dynamic import are removed from the bundle.
const devRoutes: RouteObject[] = import.meta.env.DEV
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
    children: [{ index: true, lazy: async () => ({ Component: (await import('@/features/cms/AdminHome')).AdminHome }) }],
  },
];

const legacy = async () => ({ Component: (await import('../legacy/App')).default });

// v1 pages that haven't been rebuilt yet. Each feature removes its paths from here;
// src/legacy is deleted in feature/v2-polish.
const legacyRoutes: RouteObject[] = [
  'about',
  'editorial-board',
  'archives',
  'contact',
  'submit-article',
  'search',
  'dashboard',
].map((path) => ({ path, lazy: legacy }));

// Old v1 URLs → v2 URLs
const redirects: RouteObject[] = [
  ['home', '/'],
  ['features', '/feature'],
  ['blog', '/blogs'],
  ['s&t', '/science-technology'],
  ['submit', '/submit-article'],
  ['submit/event', '/submit-article'],
].map(([path, to]) => ({ path, element: <Navigate to={to} replace /> }));

const publicRoutes: RouteObject[] = [
  {
    lazy: async () => ({ Component: (await import('@/features/public/layout/PublicLayout')).PublicLayout }),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/features/public/home/HomePage')).HomePage }) },
      { path: 'article/:slug', lazy: async () => ({ Component: (await import('@/features/public/article/ArticlePage')).ArticlePage }) },
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
      ...legacyRoutes,
      ...redirects,
      ...publicRoutes,
    ],
  },
];

export const router = createBrowserRouter(routes);
