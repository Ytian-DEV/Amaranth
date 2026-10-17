import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { SkipLink } from '@/components/ui/a11y';
import { SiteFooter } from './Footer';
import { SiteHeader } from './Header';

/** Header + footer around public pages. `children` is used by /dev fixture screens. */
export function PublicShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SkipLink />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children ?? <Outlet />}
      </main>
      <SiteFooter />
    </div>
  );
}

export function PublicLayout() {
  return <PublicShell />;
}
