import { Analytics } from '@vercel/analytics/react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <ScrollRestoration getKey={(location) => location.pathname} />
      {!import.meta.env.DEV && <Analytics />}
    </AuthProvider>
  );
}
