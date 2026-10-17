import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

// Dev-only fixture screens. `import.meta.env.DEV` is false in production builds,
// so this branch and its dynamic import are removed from the bundle.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [{ path: 'dev/*', lazy: async () => ({ Component: (await import('../dev/DevRoutes')).default }) }]
  : [];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      ...devRoutes,
      // v1 app for every route not rebuilt yet (removed in feature/v2-polish)
      { path: '*', lazy: async () => ({ Component: (await import('../legacy/App')).default }) },
    ],
  },
];

export const router = createBrowserRouter(routes);
