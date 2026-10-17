import { Analytics } from '@vercel/analytics/react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

export function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration getKey={(location) => location.pathname} />
      {!import.meta.env.DEV && <Analytics />}
    </>
  );
}
