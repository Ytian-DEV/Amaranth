import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { configureTracker, trackPageview } from './tracker';

/** Records a pageview on every public route change (never for /admin or /dev, never for signed-in staff). */
export function usePageTracking() {
  const { pathname } = useLocation();
  const { status } = useAuth();
  const loading = status === 'loading';
  const signedIn = status === 'signed-in';

  useEffect(() => {
    if (loading) return;
    configureTracker({ signedIn });
  }, [signedIn, loading]);

  useEffect(() => {
    if (loading || signedIn || /^\/(admin|dev)(\/|$)/.test(pathname)) return;
    trackPageview(pathname);
  }, [pathname, signedIn, loading]);
}
