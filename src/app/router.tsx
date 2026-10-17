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

const publicRoutes: RouteObject[] = [
  {
    lazy: async () => ({ Component: (await import('@/features/public/layout/PublicLayout')).PublicLayout }),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/features/public/home/HomePage')).HomePage }) },
      { path: 'home', element: <Navigate to="/" replace /> },
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
      ...publicRoutes,
      // v1 app for every route not rebuilt yet (removed in feature/v2-polish)
      { path: '*', lazy: async () => ({ Component: (await import('../legacy/App')).default }) },
    ],
  },
];

export const router = createBrowserRouter(routes);
