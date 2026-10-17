import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ProfileRow } from '@/lib/database.types';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabase, unwrapMaybe } from '@/lib/supabase';

type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  profile: ProfileRow | null;
  profileLoading: boolean;
  profileError: unknown;
  /** Set when the visitor arrived from a password-recovery or invite link. */
  recovering: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<unknown>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const profileQueryKey = (userId?: string) => ['profile', userId] as const;

/** Keeps the Supabase session in state and loads the staff profile. Mounted once at the root. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signed-out');
  const [recovering, setRecovering] = useState(() => /type=(recovery|invite)/.test(window.location.hash));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? 'signed-in' : 'signed-out');
    });

    // Never call Supabase from inside this callback (it can deadlock the client); only set state.
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      setStatus(next ? 'signed-in' : 'signed-out');
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') queryClient.removeQueries({ queryKey: ['profile'] });
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  // Invite and recovery links land on the site root; send them to the set-password screen.
  useEffect(() => {
    if (recovering && status === 'signed-in' && location.pathname !== '/admin/set-password') {
      navigate('/admin/set-password', { replace: true });
    }
  }, [recovering, status, location.pathname, navigate]);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: profileQueryKey(userId),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async () =>
      unwrapMaybe(await getSupabase().from('profiles').select('*').eq('id', userId!).maybeSingle()),
  });

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await getSupabase().auth.signOut();
    setRecovering(false);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      profile: profileQuery.data ?? null,
      profileLoading: Boolean(userId) && profileQuery.isPending,
      profileError: profileQuery.error,
      recovering,
      signOut,
      refreshProfile: profileQuery.refetch,
    }),
    [status, session, profileQuery.data, profileQuery.isPending, profileQuery.error, profileQuery.refetch, userId, recovering, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
