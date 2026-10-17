import type { ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ErrorState, Spinner } from '@/components/ui/Feedback';
import { LogoMark } from '@/components/ui/Logo';
import type { AppRole } from '@/lib/database.types';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { useAuth } from './AuthProvider';

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <LogoMark className="h-12" />
      {children}
    </main>
  );
}

/** Signed in, but the profile isn't active (not invited yet, or access removed). */
export function AccessPending() {
  useDocumentTitle('Access pending');
  const { session, signOut } = useAuth();
  return (
    <FullScreen>
      <h1 className="font-serif text-headline-l">Your account isn’t active</h1>
      <p className="max-w-md text-body-m text-ink-muted">
        {session?.user.email} isn’t on the Amaranth staff list yet. Ask the editor-in-chief to invite you, then sign in
        again.
      </p>
      <Button variant="outline" onClick={() => void signOut()}>
        Sign out
      </Button>
    </FullScreen>
  );
}

export function Forbidden({ message = 'Your role doesn’t have access to this page.' }: { message?: string }) {
  useDocumentTitle('No access');
  return (
    <div className="flex flex-col items-start gap-3 py-12">
      <h1 className="font-serif text-headline-l">No access</h1>
      <p className="text-body-m text-ink-muted">{message}</p>
      <Link to="/admin" className="text-button text-green-700 hover:underline">
        ← Back to the newsroom
      </Link>
    </div>
  );
}

/** Route element: only active staff get through; everyone else goes to sign in. */
export function RequireStaff() {
  const { status, profile, profileLoading, profileError, refreshProfile } = useAuth();
  const location = useLocation();

  if (status === 'loading' || profileLoading) {
    return (
      <FullScreen>
        <Spinner label="Opening the newsroom" />
      </FullScreen>
    );
  }
  if (status === 'signed-out') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (profileError) {
    return (
      <FullScreen>
        <ErrorState title="We couldn’t load your profile" error={profileError} onRetry={() => void refreshProfile()} />
      </FullScreen>
    );
  }
  if (!profile || !profile.is_active) return <AccessPending />;
  return <Outlet />;
}

/** Inside RequireStaff: limit a screen to some roles. */
export function RequireRole({ allow, children }: { allow: (role: AppRole) => boolean; children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile || !allow(profile.role)) return <Forbidden />;
  return <>{children}</>;
}
