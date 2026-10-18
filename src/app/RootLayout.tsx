import { Analytics } from '@vercel/analytics/react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { NavigationLoader } from '@/components/ui/LogoLoader';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { usePageTracking } from '@/features/public/analytics/usePageTracking';

/** First-party statistics (inside AuthProvider, so signed-in staff are left out). */
function PageTracking() {
  usePageTracking();
  return null;
}

export function RootLayout() {
  return (
    <AuthProvider>
      <PageTracking />
      <Outlet />
      <NavigationLoader />
      <ScrollRestoration getKey={(location) => location.pathname} />
      {!import.meta.env.DEV && <Analytics />}
    </AuthProvider>
  );
}
